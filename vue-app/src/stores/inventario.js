import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = '/api'

export const useInventarioStore = defineStore('inventario', () => {
  const materiales   = ref([])
  const movimientos  = ref([])
  const loading      = ref(false)
  const error        = ref(null)

  /* KPIs rápidos */
  const bajoMinimo = computed(() =>
    materiales.value.filter(m => m.stock_m2 <= m.stock_minimo_m2)
  )
  const totalM2 = computed(() =>
    materiales.value.reduce((acc, m) => acc + (m.stock_m2 || 0), 0)
  )
  const valorTotal = computed(() =>
    materiales.value.reduce((acc, m) => acc + ((m.stock_m2 || 0) * (m.precio_m2 || 0)), 0)
  )

  /* ── Materiales ── */
  async function fetchMateriales() {
    loading.value = true
    error.value   = null
    try {
      const { data } = await axios.get(`${API}/inventario`)
      // pg devuelve DECIMAL/NUMERIC como strings → convertir a number
      materiales.value = data.map(m => ({
        ...m,
        stock_m2:        m.stock_m2        != null ? parseFloat(m.stock_m2)        : 0,
        stock_minimo_m2: m.stock_minimo_m2 != null ? parseFloat(m.stock_minimo_m2) : 0,
        precio_m2:       m.precio_m2       != null ? parseFloat(m.precio_m2)       : null,
        espesor_mm:      m.espesor_mm      != null ? parseFloat(m.espesor_mm)      : null,
      }))
    } catch (e) {
      error.value = e.response?.data?.message || 'Error al cargar inventario'
    } finally {
      loading.value = false
    }
  }

  async function crearMaterial(payload) {
    const { data } = await axios.post(`${API}/inventario`, payload)
    await fetchMateriales()
    return data
  }

  async function actualizarMaterial(id, payload) {
    const { data } = await axios.put(`${API}/inventario/${id}`, payload)
    await fetchMateriales()
    return data
  }

  async function eliminarMaterial(id) {
    await axios.delete(`${API}/inventario/${id}`)
    materiales.value = materiales.value.filter(m => m.id !== id)
  }

  /* ── Movimientos ── */
  async function fetchMovimientos(inventario_id = null) {
    try {
      const params = inventario_id ? { inventario_id } : {}
      const { data } = await axios.get(`${API}/inventario/movimientos`, { params })
      // pg devuelve DECIMAL como string → convertir m2 y espesor_mm a number
      movimientos.value = data.map(mv => ({
        ...mv,
        m2:        mv.m2        != null ? parseFloat(mv.m2)        : 0,
        espesor_mm: mv.espesor_mm != null ? parseFloat(mv.espesor_mm) : null,
      }))
    } catch (e) {
      console.error('Error al cargar movimientos', e)
    }
  }

  async function registrarMovimiento(payload) {
    const { data } = await axios.post(`${API}/inventario/movimiento`, payload)
    // Refrescar stock actualizado
    await fetchMateriales()
    await fetchMovimientos()
    return data
  }

  async function limpiarMovimientos() {
    await axios.delete(`${API}/inventario/movimientos`)
    movimientos.value = []
  }

  return {
    materiales, movimientos, loading, error,
    bajoMinimo, totalM2, valorTotal,
    fetchMateriales, crearMaterial, actualizarMaterial, eliminarMaterial,
    fetchMovimientos, registrarMovimiento, limpiarMovimientos
  }
})
