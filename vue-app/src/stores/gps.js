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
  const watchId        = ref(null)
  const trackingActive = ref(false)
  let _wsStore         = null
  let _pedidoId        = null
  let _retryTimeout    = null

  // ── Wake Lock ─────────────────────────────────────────────────────────────
  let _wakeLock = null

  async function _requestWakeLock() {
    if (!('wakeLock' in navigator)) return
    try {
      _wakeLock = await navigator.wakeLock.request('screen')
      _wakeLock.addEventListener('release', () => { _wakeLock = null })
    } catch (err) {
      console.warn('[GPS] Wake Lock no disponible:', err.message)
    }
  }

  function _releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release().catch(() => {}); _wakeLock = null }
  }

  // ── localStorage: persistir estado ───────────────────────────────────────
  function _saveTrackingState(active, pedidoId) {
    try {
      if (active) {
        localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify({
          active: true, pedidoId: pedidoId ?? null, startedAt: Date.now()
        }))
      } else {
        localStorage.removeItem(GPS_STORAGE_KEY)
      }
    } catch {}
  }

  function getSavedTrackingState() {
    try {
      const raw = localStorage.getItem(GPS_STORAGE_KEY)
      if (!raw) return null
      const state = JSON.parse(raw)
      const MAX_SHIFT_MS = 14 * 60 * 60 * 1000
      if (state.active && (Date.now() - state.startedAt) < MAX_SHIFT_MS) return state
      localStorage.removeItem(GPS_STORAGE_KEY)
    } catch {}
    return null
  }

  // ── Filtro de movimiento ──────────────────────────────────────────────────
  let _lastLat    = null
  let _lastLng    = null
  let _lastSentAt = 0

  function _haversine(lat1, lon1, lat2, lon2) {
    const R  = 6_371_000
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const dφ = (lat2 - lat1) * Math.PI / 180
    const dλ = (lon2 - lon1) * Math.PI / 180
    const a  = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // ── Pending location: buffer para cuando el WS está desconectado ──────────
  // Si el WebSocket está caído cuando se captura una posición GPS, se guarda aquí
  // y se reintenta en el próximo tick del keepalive (evita perder updates).
  let _pendingLocation = null

  function _sendGpsUpdate(lat, lng, accuracy) {
    const payload = {
      type:      'location_update',
      lat,
      lng,
      accuracy:  Math.round(accuracy || 0),
      pedido_id: _pedidoId || null
    }
    if (_wsStore?.connected?.value) {
      _wsStore.send(payload)
      _pendingLocation = null
    } else {
      // WS desconectado — guardar la posición más reciente para reenviar
      _pendingLocation = payload
      console.warn('[GPS] WS desconectado, posición en buffer')
    }
  }

  // ── NoSleep: AudioContext silencioso ──────────────────────────────────────
  //
  // PROBLEMA: AudioContext require un gesto del usuario para activarse en
  // Chrome/Android. Cuando startTracking() se llama automáticamente en mount
  // (sin gesto), el context queda "suspended" y el NoSleep nunca funciona.
  //
  // SOLUCIÓN: separar la CREACIÓN del context de la ACTIVACIÓN del oscilador.
  // Si no hay gesto: crear el context pero esperar al próximo gesto/visibilidad
  // para activar el oscilador. El statechange del context dispara la creación
  // automáticamente cuando el browser lo permite.
  //
  let _audioCtx = null
  let _audioOsc = null
  let _audioRetryListeners = false

  function _createAudioOscillator() {
    if (!_audioCtx || _audioCtx.state !== 'running' || _audioOsc) return
    try {
      const osc  = _audioCtx.createOscillator()
      const gain = _audioCtx.createGain()
      gain.gain.value = 0.00001  // −100 dB — inaudible en cualquier dispositivo
      osc.connect(gain)
      gain.connect(_audioCtx.destination)
      osc.start()
      _audioOsc = osc
      console.log('[GPS] NoSleep oscilador activo ✓')
    } catch (err) {
      console.warn('[GPS] NoSleep oscilador error:', err.message)
    }
  }

  function _setupAudioRetry() {
    if (_audioRetryListeners) return
    _audioRetryListeners = true

    // Reintentar en el próximo gesto del usuario (tocar la pantalla / clic)
    const onGesture = async () => {
      if (!_audioCtx || !trackingActive.value) {
        _removeAudioRetry(onGesture, onVisibility)
        return
      }
      try {
        if (_audioCtx.state === 'suspended') await _audioCtx.resume()
        if (_audioCtx.state === 'running')   _createAudioOscillator()
      } catch {}
      if (_audioOsc) _removeAudioRetry(onGesture, onVisibility)
    }

    // También reintentar cuando la app vuelve al frente (visibilitychange)
    const onVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      await onGesture()
    }

    document.addEventListener('touchstart',       onGesture,    { passive: true })
    document.addEventListener('click',            onGesture)
    document.addEventListener('visibilitychange', onVisibility)
  }

  function _removeAudioRetry(onGesture, onVisibility) {
    document.removeEventListener('touchstart',       onGesture)
    document.removeEventListener('click',            onGesture)
    document.removeEventListener('visibilitychange', onVisibility)
    _audioRetryListeners = false
  }

  async function _startNoSleep() {
    // Ya está corriendo — nada que hacer
    if (_audioCtx?.state === 'running' && _audioOsc) return

    try {
      // Crear context si no existe o fue cerrado
      if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)()

        // Cuando el context cambie de estado: activar oscilador si pasa a 'running'
        _audioCtx.addEventListener('statechange', async () => {
          if (!_audioCtx || !trackingActive.value) return
          if (_audioCtx.state === 'running') {
            _createAudioOscillator()
          } else if (_audioCtx.state === 'suspended') {
            // Llamada entrante u otra interrupción → re-resumir
            try { await _audioCtx.resume() } catch {}
          }
        })
      }

      // Intentar activar ahora (solo funciona si hay gesto del usuario)
      if (_audioCtx.state === 'suspended') {
        try { await _audioCtx.resume() } catch {}
      }

      if (_audioCtx.state === 'running') {
        _createAudioOscillator()
      } else {
        // Context suspendido (sin gesto todavía) → esperar al próximo gesto
        console.warn('[GPS] NoSleep AudioContext suspendido — esperando gesto del usuario')
        _setupAudioRetry()
      }
    } catch (err) {
      console.warn('[GPS] NoSleep no disponible:', err.message)
      _audioCtx = null
      _audioOsc = null
    }
  }

  function _stopNoSleep() {
    _audioRetryListeners = false  // ya no hay que reintentar
    try { _audioOsc?.stop() }  catch {}
    try { _audioCtx?.close() } catch {}
    _audioOsc = null
    _audioCtx = null
  }

  // ── Background Sync ───────────────────────────────────────────────────────
  async function _registerBackgroundSync() {
    try {
      const reg = await navigator.serviceWorker?.ready
      if (reg?.sync) await reg.sync.register('gps-keepalive')
    } catch {}
  }

  // ── Periodic Background Sync ──────────────────────────────────────────────
  async function _registerPeriodicSync() {
    try {
      const reg    = await navigator.serviceWorker?.ready
      if (!reg?.periodicSync) return
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' })
      if (status.state !== 'granted') return
      await reg.periodicSync.register('gps-bg', { minInterval: 60_000 })
      console.log('[GPS] Periodic Background Sync registrado ✓')
    } catch {}
  }

  // ── Web Lock ──────────────────────────────────────────────────────────────
  let _webLockRelease = null

  async function _acquireWebLock() {
    if (!navigator.locks || _webLockRelease) return
    try {
      navigator.locks.request(
        'gps-conductor-active',
        { mode: 'shared' },
        () => new Promise(resolve => { _webLockRelease = resolve })
      )
    } catch (err) {
      console.warn('[GPS] Web Lock no disponible:', err.message)
    }
  }

  function _releaseWebLock() {
    if (_webLockRelease) { _webLockRelease(); _webLockRelease = null }
  }

  // ── Service Worker: canal bidireccional GPS ───────────────────────────────
  let _swListenerActive = false

  function _swSend(msg) {
    try { navigator.serviceWorker?.controller?.postMessage(msg) } catch {}
  }

  function _handleSwMessage({ data }) {
    if (data?.type !== 'GPS_PING' && data?.type !== 'GPS_SYNC') return
    if (!trackingActive.value || !_wsStore) return
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        if (coords.accuracy > 250) return
        _sendGpsUpdate(coords.latitude, coords.longitude, coords.accuracy)
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 45_000 }
    )
  }

  function _registerSwListener() {
    if (_swListenerActive || typeof navigator === 'undefined') return
    navigator.serviceWorker?.addEventListener('message', _handleSwMessage)
    _swListenerActive = true
  }

  // ── GPS Silence Watchdog ──────────────────────────────────────────────────
  // Si el watchPosition lleva más de 50 s sin entregar ninguna posición
  // (Android lo mató silenciosamente), reinicia automáticamente el tracking.
  let _lastPositionAt = 0
  const GPS_SILENCE_MS = 50_000  // 50 s sin posición = reiniciar

  // ── Keepalive interval ────────────────────────────────────────────────────
  // Cada 15 s mientras el GPS está activo:
  //  1. Re-solicita Wake Lock si fue liberado
  //  2. Hace fetch('/sw-ping') → mantiene el SW vivo → GPS_PING de vuelta
  //  3. Re-registra Background Sync
  //  4. Reintenta NoSleep audio si estaba suspendido
  //  5. Verifica WebSocket y reconecta si está caído
  //  6. Vacía el buffer de posición pendiente si el WS ya está online
  //  7. GPS Silence Watchdog: reinicia watchPosition si lleva >50 s sin datos
  //  8. Fallback directo con getCurrentPosition cuando está en background
  let _keepAliveInterval = null

  function _startKeepAlive() {
    _stopKeepAlive()
    _keepAliveInterval = setInterval(async () => {
      if (!trackingActive.value) return

      // 1. Wake Lock
      if (!_wakeLock) await _requestWakeLock()

      // 2. SW ping
      try {
        fetch('/sw-ping', { method: 'GET', keepalive: true, cache: 'no-store' }).catch(() => {})
      } catch {}

      // 3. Background Sync
      _registerBackgroundSync()

      // 4. NoSleep: intentar activar si el context estaba suspendido
      if (_audioCtx?.state === 'suspended') {
        try { await _audioCtx.resume() } catch {}
        if (_audioCtx?.state === 'running') _createAudioOscillator()
      } else if (!_audioCtx || !_audioOsc) {
        _startNoSleep()
      }

      // 5. WebSocket: reconectar si está caído
      //    En background, el timer de reconexión del WS también se throttlea.
      //    Forzamos la reconexión desde aquí para que el GPS no pierda updates.
      if (_wsStore && !_wsStore.connected?.value) {
        _wsStore.reconnect?.()
      }

      // 6. Vaciar buffer de posición pendiente si el WS ya está online
      if (_pendingLocation && _wsStore?.connected?.value) {
        _wsStore.send(_pendingLocation)
        _pendingLocation = null
        console.log('[GPS] Posición pendiente enviada ✓')
      }

      // 7. GPS Silence Watchdog
      if (_lastPositionAt > 0) {
        const silenceMs = Date.now() - _lastPositionAt
        if (silenceMs > GPS_SILENCE_MS) {
          console.warn('[GPS] Watchdog: sin posición por ' + Math.round(silenceMs / 1000) + 's — reiniciando watchPosition')
          _lastPositionAt = Date.now()  // evitar spam de reinicios
          // Reiniciar solo el watchPosition (el resto del stack sigue igual)
          if (watchId.value !== null) {
            navigator.geolocation.clearWatch(watchId.value)
            watchId.value = null
          }
          _startWatchPosition()
        }
      }

      // 8. Fallback GPS directo cuando la página está en background
      if (document.visibilityState !== 'visible' && navigator.geolocation && _wsStore) {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (coords.accuracy > 250) return
            _lastPositionAt = Date.now()
            _sendGpsUpdate(coords.latitude, coords.longitude, coords.accuracy)
          },
          () => {},
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 }
        )
      }
    }, 15_000)
  }

  function _stopKeepAlive() {
    if (_keepAliveInterval) { clearInterval(_keepAliveInterval); _keepAliveInterval = null }
  }

  // ── Visibility change ─────────────────────────────────────────────────────
  function _handleVisibilityChange() {
    if (!trackingActive.value || !_wsStore) return

    if (document.visibilityState === 'visible') {
      // App vuelve al frente: reiniciar tracking completo + Wake Lock + NoSleep
      startTracking(_wsStore, _pedidoId)
      _requestWakeLock()
    } else {
      // App va al fondo:
      // (a) Posición inmediata antes del throttle
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          if (coords.accuracy > 250) return
          _lastPositionAt = Date.now()
          _sendGpsUpdate(coords.latitude, coords.longitude, coords.accuracy)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8_000, maximumAge: 5_000 }
      )
      // (b) Background Sync backup
      _registerBackgroundSync()
    }
  }

  const isTracking = computed(() => trackingActive.value)

  // ── Helper: crear/reiniciar solo el watchPosition ─────────────────────────
  function _startWatchPosition() {
    if (!navigator.geolocation) return

    watchId.value = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng, accuracy } = coords

        _lastPositionAt = Date.now()  // actualizar watchdog

        if (accuracy > 120) return

        if (_lastLat !== null) {
          const dist    = _haversine(lat, lng, _lastLat, _lastLng)
          const elapsed = Date.now() - _lastSentAt
          if (dist < 8 && elapsed < 25_000) return
        }
        _lastLat    = lat
        _lastLng    = lng
        _lastSentAt = Date.now()

        _sendGpsUpdate(lat, lng, accuracy)
      },
      (err) => {
        console.warn('[GPS] Error watchPosition:', err.code, err.message)
        if (err.code === 1 /* PERMISSION_DENIED */) {
          trackingActive.value = false
          watchId.value = null
          _saveTrackingState(false)
          _stopKeepAlive()
        } else {
          // TIMEOUT o POSITION_UNAVAILABLE → reintentar
          if (_retryTimeout) clearTimeout(_retryTimeout)
          _retryTimeout = setTimeout(() => {
            if (_wsStore && trackingActive.value) _startWatchPosition()
          }, 5000)
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            15_000,
        maximumAge:         3_000
      }
    )
  }

  /**
   * Inicia (o reinicia) el GPS del conductor.
   * Seguro llamarlo varias veces: cancela el watch anterior.
   */
  function startTracking(wsStoreInstance, pedidoId = null) {
    _wsStore  = wsStoreInstance
    _pedidoId = pedidoId

    if (!navigator.geolocation) {
      console.warn('[GPS] Geolocalización no soportada')
      return false
    }

    if (_retryTimeout) { clearTimeout(_retryTimeout); _retryTimeout = null }

    // Cancelar watch anterior
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }

    // ── Activar todas las capas de background ──────────────────────────────

    // NoSleep Audio: si hay gesto → activa inmediatamente;
    //                si no hay gesto → crea el context y espera al próximo gesto
    _startNoSleep()

    // Wake Lock
    _requestWakeLock()

    // Web Lock
    _acquireWebLock()

    // SW listener (solo una vez por sesión)
    _registerSwListener()

    // Avisar al SW que el GPS está activo
    _swSend({ type: 'GPS_START' })

    // Background Sync
    _registerBackgroundSync()

    // Periodic Background Sync
    _registerPeriodicSync()

    // Visibilitychange
    document.removeEventListener('visibilitychange', _handleVisibilityChange)
    document.addEventListener('visibilitychange', _handleVisibilityChange)

    // Iniciar watchPosition
    _startWatchPosition()

    trackingActive.value = true

    // Persistir estado + keepalive
    _saveTrackingState(true, pedidoId)
    _startKeepAlive()

    return true
  }

  /**
   * Actualiza el pedido_id SIN reiniciar el watchPosition.
   */
  function updatePedidoId(pedidoId) {
    _pedidoId = pedidoId
    if (trackingActive.value) _saveTrackingState(true, pedidoId)
  }

  /**
   * Detiene el GPS. Solo llamar al finalizar turno o hacer logout.
   */
  function stopTracking() {
    if (_retryTimeout) { clearTimeout(_retryTimeout); _retryTimeout = null }
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }

    _wsStore?.send({ type: 'stop_tracking' })

    _stopNoSleep()
    _releaseWakeLock()
    _releaseWebLock()
    _swSend({ type: 'GPS_STOP' })
    _stopKeepAlive()
    document.removeEventListener('visibilitychange', _handleVisibilityChange)

    _saveTrackingState(false)

    _lastLat = null; _lastLng = null; _lastSentAt = 0
    _lastPositionAt  = 0
    _pendingLocation = null

    trackingActive.value = false
    _wsStore  = null
    _pedidoId = null
  }

  function clear() {
    stopTracking()
    ubicaciones.value = {}
  }

  return {
    // Admin
    ubicaciones, fetchUbicaciones, recibirUbicacion,
    // Conductor
    isTracking, startTracking, stopTracking, updatePedidoId,
    // Estado persistido
    getSavedTrackingState,
    // General
    clear
  }
})
