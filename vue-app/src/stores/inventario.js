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
      materiales.value = data
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
      movimientos.value = data
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

  return {
    materiales, movimientos, loading, error,
    bajoMinimo, totalM2, valorTotal,
    fetchMateriales, crearMaterial, actualizarMaterial, eliminarMaterial,
    fetchMovimientos, registrarMovimiento
  }
})
