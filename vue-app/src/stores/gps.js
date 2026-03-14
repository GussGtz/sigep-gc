import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

export const useGpsStore = defineStore('gps', () => {

  // ── Admin: posiciones de todos los conductores ──────────────────────────────
  // Map: conductorId → { lat, lng, nombre, pedido_id, updated_at }
  const ubicaciones = ref({})

  async function fetchUbicaciones() {
    try {
      const { data } = await axios.get(`${API}/gps/ubicaciones`)
      const map = {}
      for (const row of data) {
        map[row.conductor_id] = {
          lat:           row.lat,
          lng:           row.lng,
          nombre:        row.conductor_nombre,
          pedido_id:     row.pedido_id,
          numero_pedido: row.numero_pedido,
          updated_at:    row.updated_at
        }
      }
      ubicaciones.value = map
    } catch (err) {
      console.error('[gps] fetchUbicaciones', err.message)
    }
  }

  // Llamado desde App.vue cuando llega WS location_update (para el admin)
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

  // ── Conductor: tracking GPS persistente entre páginas ──────────────────────
  // El tracking vive en el store para no perderse al navegar entre componentes
  const watchId        = ref(null)   // ID del geolocation.watchPosition
  const trackingActive = ref(false)  // ¿está el GPS corriendo?
  let _wsStore         = null        // referencia al websocket store
  let _pedidoId        = null        // pedido en curso (puede ser null)
  let _retryTimeout    = null        // timeout de reintento tras error

  // ── Wake Lock: mantiene la pantalla encendida mientras el GPS está activo ──
  // Sin Wake Lock, Android suspende JS al apagarse la pantalla y el GPS se detiene.
  let _wakeLock        = null

  async function _requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      _wakeLock = await navigator.wakeLock.request('screen')
      _wakeLock.addEventListener('release', () => {
        _wakeLock = null
        // Si el GPS sigue activo, re-solicitar cuando la pantalla vuelva a estar visible
      })
    } catch (err) {
      // Puede fallar si la pantalla ya está apagada o el navegador no lo permite
      console.warn('[GPS] Wake Lock no disponible:', err.message)
    }
  }

  function _releaseWakeLock() {
    if (_wakeLock) {
      _wakeLock.release().catch(() => {})
      _wakeLock = null
    }
  }

  // ── Visibility change: reiniciar watchPosition cuando la app vuelve al frente ──
  // Chrome Android pausa JS en background; al volver al frente el watchPosition
  // puede quedar zombi → limpiarlo y crear uno nuevo garantiza señal fresca.
  function _handleVisibilityChange() {
    if (document.visibilityState === 'visible' && trackingActive.value && _wsStore) {
      // Reactivar GPS (puede haber quedado parado tras suspensión)
      startTracking(_wsStore, _pedidoId)
      // Re-solicitar Wake Lock (puede haberse liberado al bloquear la pantalla)
      _requestWakeLock()
    }
  }

  const isTracking = computed(() => trackingActive.value)

  /**
   * Inicia (o reinicia) el GPS del conductor con máxima precisión.
   * Es seguro llamarlo varias veces: cancela el watch anterior antes de crear uno nuevo.
   * @param {object} wsStoreInstance - instancia de useWebSocketStore
   * @param {number|null} pedidoId   - ID del pedido en entrega (null si turno sin entrega)
   */
  function startTracking(wsStoreInstance, pedidoId = null) {
    _wsStore  = wsStoreInstance
    _pedidoId = pedidoId

    if (!navigator.geolocation) {
      console.warn('[GPS] Geolocalización no soportada')
      return false
    }

    // Cancelar reintento pendiente
    if (_retryTimeout) { clearTimeout(_retryTimeout); _retryTimeout = null }

    // Limpiar watch anterior
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }

    // ── Activar Wake Lock: pantalla encendida → JS sigue corriendo ──
    _requestWakeLock()

    // ── Listener de visibilidad: reiniciar GPS cuando la app vuelve al frente ──
    document.removeEventListener('visibilitychange', _handleVisibilityChange)
    document.addEventListener('visibilitychange', _handleVisibilityChange)

    watchId.value = navigator.geolocation.watchPosition(
      ({ coords }) => {
        // Enviar posición via WebSocket al backend
        _wsStore?.send({
          type:      'location_update',
          lat:       coords.latitude,
          lng:       coords.longitude,
          accuracy:  Math.round(coords.accuracy || 0),
          pedido_id: _pedidoId || null
        })
      },
      (err) => {
        console.warn('[GPS] Error:', err.code, err.message)
        if (err.code === 1 /* PERMISSION_DENIED */) {
          // El usuario rechazó el permiso — no reintentar
          trackingActive.value = false
          watchId.value = null
        } else {
          // TIMEOUT o POSITION_UNAVAILABLE — reintentar en 5s
          _retryTimeout = setTimeout(() => {
            if (_wsStore) startTracking(_wsStore, _pedidoId)
          }, 5000)
        }
      },
      {
        enableHighAccuracy: true, // Usa chip GPS real (no solo WiFi/celular)
        timeout:            30000, // Hasta 30s para obtener señal
        maximumAge:         0      // Sin caché — siempre posición fresca
      }
    )

    trackingActive.value = true
    return true
  }

  /**
   * Actualiza el pedido_id del envío actual SIN reiniciar el watchPosition.
   * Llamar cuando el conductor inicia una entrega específica.
   */
  function updatePedidoId(pedidoId) {
    _pedidoId = pedidoId
  }

  /**
   * Detiene el GPS del conductor.
   * Solo llamar al finalizar turno o al hacer logout.
   */
  function stopTracking() {
    if (_retryTimeout) { clearTimeout(_retryTimeout); _retryTimeout = null }
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
    // ── Liberar Wake Lock y listener de visibilidad ──
    _releaseWakeLock()
    document.removeEventListener('visibilitychange', _handleVisibilityChange)

    trackingActive.value = false
    _wsStore  = null
    _pedidoId = null
  }

  // ── Limpiar todo al logout ──────────────────────────────────────────────────
  function clear() {
    stopTracking()
    ubicaciones.value = {}
  }

  return {
    // Admin
    ubicaciones, fetchUbicaciones, recibirUbicacion,
    // Conductor
    isTracking, startTracking, stopTracking, updatePedidoId,
    // General
    clear
  }
})
