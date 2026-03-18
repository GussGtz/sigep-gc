import { ref } from 'vue'
import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'

export const useWebSocketStore = defineStore('websocket', () => {
  const ws        = ref(null)
  const connected = ref(false)
  const handlers  = {}   // { type: [fn, fn, ...] }

  let _token        = null
  let _reconnectTid = null
  let _intentional  = false   // ¿cierre deliberado? → no reconectar

  // ── Construir URL compatible dev (proxy Vite), prod y APK nativa ──────────
  //    En APK (Capacitor), location.host es "localhost" (webview) → usar URL
  //    absoluta del backend en producción.
  function buildUrl(token) {
    if (Capacitor.isNativePlatform()) {
      return `wss://sigep-gc.onrender.com/ws?token=${token}`
    }
    const isSecure = location.protocol === 'https:'
    const base     = `${isSecure ? 'wss' : 'ws'}://${location.host}/ws`
    return `${base}?token=${token}`
  }

  // ── Conectar ───────────────────────────────────────────────────────────────
  function connect(token) {
    if (!token) return
    _token      = token
    _intentional = false
    if (_reconnectTid) clearTimeout(_reconnectTid)

    // Cerrar socket previo sin disparar reconexión
    if (ws.value) {
      _intentional = true
      ws.value.close()
      _intentional = false
    }

    const socket = new WebSocket(buildUrl(token))

    socket.onopen = () => {
      connected.value = true
      console.log('[WS] Conectado')
    }

    socket.onclose = (e) => {
      connected.value = false
      ws.value = null
      if (!_intentional) {
        console.log('[WS] Desconectado, reintentando en 3s…', e.code)
        _reconnectTid = setTimeout(() => connect(_token), 3000)
      }
    }

    socket.onerror = (err) => {
      console.warn('[WS] Error de conexión', err)
    }

    socket.onmessage = (event) => {
      let msg
      try { msg = JSON.parse(event.data) } catch { return }
      const fns = handlers[msg.type]
      if (fns) fns.forEach(fn => fn(msg))
    }

    ws.value = socket
  }

  // ── Enviar ─────────────────────────────────────────────────────────────────
  function send(data) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    }
  }

  // ── Registrar handler para tipo de mensaje ─────────────────────────────────
  // Soporta múltiples handlers por tipo; llama a todos cuando llega el mensaje.
  function on(type, fn) {
    if (!handlers[type]) handlers[type] = []
    if (!handlers[type].includes(fn)) handlers[type].push(fn)
  }

  // off(type)     → elimina TODOS los handlers de ese tipo
  // off(type, fn) → elimina solo el handler específico (para onUnmounted granular)
  function off(type, fn) {
    if (fn === undefined) {
      delete handlers[type]
    } else if (handlers[type]) {
      handlers[type] = handlers[type].filter(h => h !== fn)
    }
  }

  // ── Reconexión manual (forzada) ───────────────────────────────────────────
  // Llamado desde el GPS keepalive cuando detecta que el WS está caído.
  // En background, el timer de onclose (3 s) puede estar throttleado — este
  // método fuerza la reconexión inmediata sin esperar el timer interno.
  function reconnect() {
    if (!_token) return
    if (ws.value?.readyState === WebSocket.OPEN) return
    if (_reconnectTid) { clearTimeout(_reconnectTid); _reconnectTid = null }
    connect(_token)
  }

  // ── Desconectar deliberadamente ────────────────────────────────────────────
  function disconnect() {
    _intentional = true
    if (_reconnectTid) clearTimeout(_reconnectTid)
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  return { connected, connect, disconnect, reconnect, send, on, off }
})
