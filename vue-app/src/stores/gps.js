import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

// ── Clave para persistir estado GPS en localStorage ──────────────────────────
const GPS_STORAGE_KEY = 'gps_bg_state'

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

  // Llamado desde App.vue cuando llega WS location_update / conductor_offline (para el admin)
  function recibirUbicacion(msg) {
    // El conductor finalizó turno → eliminar del mapa inmediatamente
    if (msg.type === 'conductor_offline') {
      const next = { ...ubicaciones.value }
      delete next[msg.conductorId]
      ubicaciones.value = next
      return
    }
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
  const watchId        = ref(null)   // ID del geolocation.watchPosition
  const trackingActive = ref(false)  // ¿está el GPS corriendo?
  let _wsStore         = null        // referencia al websocket store
  let _pedidoId        = null        // pedido en curso (puede ser null)
  let _retryTimeout    = null        // timeout de reintento tras error

  // ── Wake Lock: mantiene la pantalla encendida mientras el GPS está activo ──
  let _wakeLock        = null

  async function _requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      _wakeLock = await navigator.wakeLock.request('screen')
      _wakeLock.addEventListener('release', () => {
        _wakeLock = null
      })
    } catch (err) {
      console.warn('[GPS] Wake Lock no disponible:', err.message)
    }
  }

  function _releaseWakeLock() {
    if (_wakeLock) {
      _wakeLock.release().catch(() => {})
      _wakeLock = null
    }
  }

  // ── Service Worker: notificación persistente tipo "foreground service" ──────
  // En Android, una notificación activa en la barra evita que el SO mate el
  // proceso del navegador. Es el equivalente web del startForegroundService().
  function _swNotify(type) {
    try {
      if (!('serviceWorker' in navigator)) return
      const send = () => navigator.serviceWorker.controller?.postMessage({ type })
      // Si el SW ya está listo → enviar de inmediato; si no → esperar
      if (navigator.serviceWorker.controller) {
        send()
      } else {
        navigator.serviceWorker.ready.then(send).catch(() => {})
      }
    } catch { /* SW no disponible en este entorno */ }
  }

  // ── localStorage: persistir estado para auto-reanudar al reabrir la app ────
  function _saveTrackingState(active, pedidoId) {
    try {
      if (active) {
        localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify({
          active:    true,
          pedidoId:  pedidoId ?? null,
          startedAt: Date.now()
        }))
      } else {
        localStorage.removeItem(GPS_STORAGE_KEY)
      }
    } catch { /* localStorage no disponible */ }
  }

  /**
   * Devuelve el estado GPS guardado en localStorage, o null si no hay ninguno
   * o si el estado tiene más de 14 horas (un turno no puede durar más que eso).
   */
  function getSavedTrackingState() {
    try {
      const raw = localStorage.getItem(GPS_STORAGE_KEY)
      if (!raw) return null
      const state = JSON.parse(raw)
      const MAX_SHIFT_MS = 14 * 60 * 60 * 1000  // 14 horas
      if (state.active && (Date.now() - state.startedAt) < MAX_SHIFT_MS) {
        return state
      }
      // Estado expirado → limpiar
      localStorage.removeItem(GPS_STORAGE_KEY)
    } catch {}
    return null
  }

  // ── Filtro de movimiento: evitar enviar actualizaciones redundantes ────────
  let _lastLat    = null
  let _lastLng    = null
  let _lastSentAt = 0

  /** Distancia en metros entre dos coordenadas (fórmula Haversine) */
  function _haversine(lat1, lon1, lat2, lon2) {
    const R  = 6_371_000
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const dφ = (lat2 - lat1) * Math.PI / 180
    const dλ = (lon2 - lon1) * Math.PI / 180
    const a  = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // ── Keepalive interval ───────────────────────────────────────────────────────
  // Cada 30 segundos mientras el GPS está activo:
  //  1. Re-solicita Wake Lock si fue liberado (pantalla encendida de nuevo)
  //  2. Cuando la página está oculta (minimizada): usa getCurrentPosition()
  //     como respaldo porque Android puede pausar watchPosition en background.
  let _keepAliveInterval = null

  function _startKeepAlive() {
    _stopKeepAlive()
    _keepAliveInterval = setInterval(async () => {
      if (!trackingActive.value) return

      // 1. Re-solicitar Wake Lock si se liberó
      if (!_wakeLock) await _requestWakeLock()

      // 2. Fallback GPS cuando la página está en segundo plano
      //    enableHighAccuracy: false → batería reducida para el fallback en background
      if (document.visibilityState !== 'visible' && navigator.geolocation && _wsStore) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            // En background ser más tolerante con accuracia (señal puede ser peor)
            if (coords.accuracy > 250) return
            _wsStore.send({
              type:      'location_update',
              lat:       coords.latitude,
              lng:       coords.longitude,
              accuracy:  Math.round(coords.accuracy || 0),
              pedido_id: _pedidoId || null
            })
          },
          () => {},  // ignorar errores del fallback silenciosamente
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
        )
      }
    }, 30_000)
  }

  function _stopKeepAlive() {
    if (_keepAliveInterval) {
      clearInterval(_keepAliveInterval)
      _keepAliveInterval = null
    }
  }

  // ── Visibility change: reiniciar watchPosition cuando la app vuelve al frente ──
  function _handleVisibilityChange() {
    if (document.visibilityState === 'visible' && trackingActive.value && _wsStore) {
      startTracking(_wsStore, _pedidoId)
      _requestWakeLock()
    }
  }

  const isTracking = computed(() => trackingActive.value)

  /**
   * Inicia (o reinicia) el GPS del conductor con máxima precisión.
   * Es seguro llamarlo varias veces: cancela el watch anterior antes de crear uno nuevo.
   * Al iniciarse:
   *   - Muestra notificación persistente en la barra de notificaciones (Android foreground)
   *   - Guarda estado en localStorage para auto-reanudar si la app se cierra
   *   - Activa keepalive interval para mantener GPS en segundo plano
   *
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
        const { latitude: lat, longitude: lng, accuracy } = coords

        // 1. Descartar lecturas con incertidumbre muy alta (señal débil / indoor)
        if (accuracy > 120) return

        // 2. Evitar inundar el WS con jitter: enviar solo si se movió ≥8 m
        //    o si pasaron más de 25 s desde la última actualización
        if (_lastLat !== null) {
          const dist    = _haversine(lat, lng, _lastLat, _lastLng)
          const elapsed = Date.now() - _lastSentAt
          if (dist < 8 && elapsed < 25_000) return
        }
        _lastLat    = lat
        _lastLng    = lng
        _lastSentAt = Date.now()

        _wsStore?.send({
          type:      'location_update',
          lat,
          lng,
          accuracy:  Math.round(accuracy),
          pedido_id: _pedidoId || null
        })
      },
      (err) => {
        console.warn('[GPS] Error:', err.code, err.message)
        if (err.code === 1 /* PERMISSION_DENIED */) {
          trackingActive.value = false
          watchId.value = null
          _swNotify('GPS_FOREGROUND_STOP')
          _saveTrackingState(false)
          _stopKeepAlive()
        } else {
          // TIMEOUT o POSITION_UNAVAILABLE — reintentar en 5s
          _retryTimeout = setTimeout(() => {
            if (_wsStore) startTracking(_wsStore, _pedidoId)
          }, 5000)
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            15_000,  // reintentar más rápido en Android
        maximumAge:         3_000    // tolerar posiciones de hasta 3 s para reducir errores TIMEOUT
      }
    )

    trackingActive.value = true

    // ── Activar mecanismos de segundo plano ──────────────────────────────────

    // Notificación persistente (foreground service) en la barra de notificaciones
    _swNotify('GPS_FOREGROUND_START')

    // Guardar estado para auto-reanudar al reabrir la app
    _saveTrackingState(true, pedidoId)

    // Keepalive: mantiene GPS cuando la pantalla se apaga o la app se minimiza
    _startKeepAlive()

    return true
  }

  /**
   * Actualiza el pedido_id del envío actual SIN reiniciar el watchPosition.
   * Llamar cuando el conductor inicia una entrega específica.
   */
  function updatePedidoId(pedidoId) {
    _pedidoId = pedidoId
    // Actualizar estado persistido con el nuevo pedidoId
    if (trackingActive.value) _saveTrackingState(true, pedidoId)
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

    // Notificar al backend: borrar fila en conductor_ubicaciones y
    // avisar a todos los admins para que el marcador desaparezca de inmediato
    _wsStore?.send({ type: 'stop_tracking' })

    // ── Liberar todos los mecanismos de segundo plano ──
    _releaseWakeLock()
    _stopKeepAlive()
    document.removeEventListener('visibilitychange', _handleVisibilityChange)

    // Cerrar notificación persistente
    _swNotify('GPS_FOREGROUND_STOP')

    // Limpiar estado localStorage
    _saveTrackingState(false)

    // Resetear filtro de movimiento
    _lastLat = null; _lastLng = null; _lastSentAt = 0

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
    // Estado persistido (para auto-reanudar en ConductorDashboard)
    getSavedTrackingState,
    // General
    clear
  }
})
