import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useTiposVidrio = defineStore('tiposVidrio', () => {
  const tipos   = ref([])
  const loading = ref(false)

  const tiposActivos = computed(() => tipos.value.filter(t => t.activo))
  const nombresActivos = computed(() => tiposActivos.value.map(t => t.nombre))

  async function fetchTipos() {
    loading.value = true
    try {
      const { data } = await axios.get('/api/tipos-vidrio')
      tipos.value = data
    } finally {
      loading.value = false
    }
  }

  async function toggleActivo(id, activo) {
    await axios.put(`/api/tipos-vidrio/${id}`, { activo })
    const t = tipos.value.find(x => x.id === id)
    if (t) t.activo = activo
  }

  async function crearTipo(nombre) {
    const { data } = await axios.post('/api/tipos-vidrio', { nombre })
    tipos.value.push(data)
    tipos.value.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
  }

  async function renombrarTipo(id, nombre) {
    const { data } = await axios.put(`/api/tipos-vidrio/${id}`, { nombre })
    const idx = tipos.value.findIndex(x => x.id === id)
    if (idx !== -1) tipos.value[idx] = data
  }

  async function eliminarTipo(id) {
    await axios.delete(`/api/tipos-vidrio/${id}`)
    tipos.value = tipos.value.filter(t => t.id !== id)
  }

  return { tipos, tiposActivos, nombresActivos, loading, fetchTipos, toggleActivo, crearTipo, renombrarTipo, eliminarTipo }
})
