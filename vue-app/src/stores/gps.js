import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

export const useGpsStore = defineStore('gps', () => {
  // Map: conductorId (número) → { lat, lng, nombre, pedido_id, updated_at }
  const ubicaciones = ref({})

  // ── Carga inicial desde REST (admin) ──────────────────────────────────────
  async function fetchUbicaciones() {
    try {
      const { data } = await axios.get(`${API}/gps/ubicaciones`)
      const map = {}
      for (const row of data) {
        map[row.conductor_id] = {
          lat:             row.lat,
          lng:             row.lng,
          nombre:          row.conductor_nombre,
          pedido_id:       row.pedido_id,
          numero_pedido:   row.numero_pedido,
          updated_at:      row.updated_at
        }
      }
      ubicaciones.value = map
    } catch (err) {
      console.error('[gps] fetchUbicaciones', err.message)
    }
  }

  // ── Actualizar posición vía WebSocket ─────────────────────────────────────
  function recibirUbicacion(msg) {
    ubicaciones.value = {
      ...ubicaciones.value,
      [msg.conductorId]: {
        lat:           msg.lat,
        lng:           msg.lng,
        nombre:        msg.nombre,
        pedido_id:     msg.pedido_id,
        numero_pedido: msg.numero_pedido || null,
        updated_at:    msg.updated_at
      }
    }
  }

  // ── Limpiar al logout ──────────────────────────────────────────────────────
  function clear() {
    ubicaciones.value = {}
  }

  return { ubicaciones, fetchUbicaciones, recibirUbicacion, clear }
})
