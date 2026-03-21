import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { fuzzyMatch, fuzzyScore } from '../utils/fuzzy.js'

const API = '/api'

export const usePedidosStore = defineStore('pedidos', () => {
  const pedidos   = ref([])
  const loading   = ref(false)
  const error     = ref(null)

  // Filtros activos
  const filtros = ref({
    texto:       '',
    estatus:     '',
    area:        '',
    completados: null,
    prioridad:   '',
    fechaDesde:  '',
    fechaHasta:  ''
  })

  const pedidosFiltrados = computed(() => {
    let list = [...pedidos.value]
    const f = filtros.value

    if (f.texto) {
      const q = f.texto
      list = list
        .map(p => ({
          p,
          score: Math.max(
            fuzzyScore(p.numero_pedido    || '', q),
            fuzzyScore(p.creado_por_nombre || '', q),
            fuzzyScore(p.cliente_nombre   || '', q)
          )
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ p }) => p)
    }
    if (f.estatus) {
      list = list.filter(p =>
        p.areas?.some(a => a.estatus === f.estatus) ||
        (f.area && p.areas?.find(a => a.area === f.area)?.estatus === f.estatus)
      )
    }
    if (f.prioridad) {
      list = list.filter(p => p.prioridad === f.prioridad)
    }
    if (f.completados === true) {
      list = list.filter(p => p.areas?.every(a => a.estatus === 'completado'))
    }
    if (f.completados === false) {
      list = list.filter(p => !p.areas?.every(a => a.estatus === 'completado'))
    }
    if (f.fechaDesde) {
      list = list.filter(p => p.fecha_entrega >= f.fechaDesde)
    }
    if (f.fechaHasta) {
      list = list.filter(p => p.fecha_entrega <= f.fechaHasta)
    }
    // Ordenar por prioridad: urgente → media → normal
    const prioridadOrd = { alto: 0, medio: 1, bajo: 2 }
    list.sort((a, b) => (prioridadOrd[a.prioridad] ?? 2) - (prioridadOrd[b.prioridad] ?? 2))
    return list
  })

  // KPIs
  const kpis = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const total       = pedidos.value.length
    const completados = pedidos.value.filter(p => p.areas?.every(a => a.estatus === 'completado')).length
    const enProceso   = pedidos.value.filter(p =>
      p.areas?.some(a => a.estatus === 'en proceso') &&
      !p.areas?.every(a => a.estatus === 'completado')
    ).length
    const pendientes  = pedidos.value.filter(p => p.areas?.every(a => a.estatus === 'pendiente')).length
    const atrasados   = pedidos.value.filter(p =>
      p.retrasado === true ||
      (p.fecha_entrega && new Date(p.fecha_entrega) < today && !p.areas?.every(a => a.estatus === 'completado'))
    ).length
    const urgentes    = pedidos.value.filter(p =>
      p.prioridad === 'alto' &&
      !p.areas?.every(a => a.estatus === 'completado')
    ).length
    const medias      = pedidos.value.filter(p =>
      p.prioridad === 'medio' &&
      !p.areas?.every(a => a.estatus === 'completado')
    ).length

    return { total, completados, enProceso, pendientes, atrasados, urgentes, medias }
  })

  async function fetchPedidos(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const { data } = await axios.get(`${API}/pedidos`, { params })
      pedidos.value = data
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cargar pedidos'
    } finally {
      loading.value = false
    }
  }

  async function crearPedido(payload) {
    const { data } = await axios.post(`${API}/pedidos`, payload)
    await fetchPedidos()
    return data
  }

  async function actualizarEstatus(id, area, estatus, comentarios = '') {
    const { data } = await axios.put(`${API}/pedidos/estatus/${id}`, { area, estatus, comentarios })
    const idx = pedidos.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      const areaIdx = pedidos.value[idx].areas?.findIndex(a => a.area === area)
      if (areaIdx !== -1) {
        pedidos.value[idx].areas[areaIdx].estatus     = estatus
        pedidos.value[idx].areas[areaIdx].comentarios = comentarios
      }
    }
    return data
  }

  async function eliminarPedido(id) {
    await axios.delete(`${API}/pedidos/${id}`)
    pedidos.value = pedidos.value.filter(p => p.id !== id)
  }

  async function eliminarCompletados() {
    await axios.delete(`${API}/pedidos/completados`)
    pedidos.value = pedidos.value.filter(p => !p.areas?.every(a => a.estatus === 'completado'))
  }

  async function actualizarPrioridad(id, prioridad) {
    const { data } = await axios.put(`${API}/pedidos/${id}/prioridad`, { prioridad })
    const idx = pedidos.value.findIndex(p => p.id === id)
    if (idx !== -1) pedidos.value[idx].prioridad = prioridad
    return data
  }

  async function registrarMerma(id, merma_m2, merma_descripcion = '') {
    const { data } = await axios.put(`${API}/pedidos/${id}/merma`, { merma_m2, merma_descripcion })
    // Actualizar optimistamente en local
    const idx = pedidos.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      pedidos.value[idx].merma_m2          = parseFloat(merma_m2)
      pedidos.value[idx].merma_descripcion = merma_descripcion || null
    }
    return data
  }

  function setFiltro(key, value) {
    filtros.value[key] = value
  }
  function limpiarFiltros() {
    filtros.value = { texto: '', estatus: '', area: '', completados: null, prioridad: '', fechaDesde: '', fechaHasta: '' }
  }

  return {
    pedidos, loading, error, filtros, pedidosFiltrados, kpis,
    fetchPedidos, crearPedido, actualizarEstatus, actualizarPrioridad,
    eliminarPedido, eliminarCompletados, registrarMerma, setFiltro, limpiarFiltros
  }
})
