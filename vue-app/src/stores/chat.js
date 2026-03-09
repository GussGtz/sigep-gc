import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

export const useChatStore = defineStore('chat', () => {
  // Estado
  const contactos            = ref([])          // array de usuarios con unread_count
  const conversaciones       = ref({})          // { userId: [ mensaje, ... ] }
  const conversacionActiva   = ref(null)        // userId del contacto abierto

  // ── Total no leídos (para badge global) ───────────────────────────────────
  const unreadTotal = computed(() =>
    contactos.value.reduce((acc, c) => acc + (c.unread_count || 0), 0)
  )

  // ── Contactos ─────────────────────────────────────────────────────────────
  async function fetchContactos() {
    try {
      const { data } = await axios.get(`${API}/chat/contactos`)
      contactos.value = data
    } catch (err) {
      console.error('[chat] fetchContactos', err.message)
    }
  }

  // ── Conversación con un usuario ───────────────────────────────────────────
  async function fetchConversacion(userId) {
    conversacionActiva.value = userId
    try {
      const { data } = await axios.get(`${API}/chat/conversacion/${userId}`)
      conversaciones.value = { ...conversaciones.value, [userId]: data }

      // Marcar como leídos en BD y resetear badge local
      await axios.patch(`${API}/chat/leer/${userId}`)
      const c = contactos.value.find(u => u.id === userId)
      if (c) c.unread_count = 0
    } catch (err) {
      console.error('[chat] fetchConversacion', err.message)
    }
  }

  // ── Recibir mensaje vía WebSocket (handler) ───────────────────────────────
  function recibirMensaje(msg) {
    const from = msg.de_usuario_id

    // Añadir a conversación si ya existe en el dict
    if (conversaciones.value[from]) {
      conversaciones.value[from].push(msg)
    }

    // Incrementar badge del contacto (si no es la conv activa)
    if (conversacionActiva.value !== from) {
      const c = contactos.value.find(u => u.id === from)
      if (c) {
        c.unread_count = (c.unread_count || 0) + 1
        c.ultimo_mensaje = msg.mensaje
        c.ultimo_at      = msg.created_at
      } else {
        // Contacto nuevo: refrescar lista completa
        fetchContactos()
      }
    } else {
      // Conversación activa → marcar en BD silenciosamente
      axios.patch(`${API}/chat/leer/${from}`).catch(() => {})
    }
  }

  // ── Confirmación de envío (chat_sent vía WS) ──────────────────────────────
  function confirmarEnviado(msg) {
    const to = msg.para_usuario_id
    if (!conversaciones.value[to]) conversaciones.value[to] = []
    conversaciones.value[to].push(msg)

    // Actualizar último mensaje del contacto
    const c = contactos.value.find(u => u.id === to)
    if (c) {
      c.ultimo_mensaje = msg.mensaje
      c.ultimo_at      = msg.created_at
    }
  }

  // ── Enviar mensaje ─────────────────────────────────────────────────────────
  // Nota: el mensaje real se envía por WS desde App.vue via wsStore.send
  // Este método sólo es un helper conveniente (usa wsStore injected externamente)
  function enviarMensaje(wsStore, paraId, texto) {
    if (!texto?.trim()) return
    wsStore.send({
      type:           'chat_message',
      para_usuario_id: paraId,
      mensaje:         texto.trim()
    })
  }

  // ── Limpiar al logout ──────────────────────────────────────────────────────
  function clear() {
    contactos.value          = []
    conversaciones.value     = {}
    conversacionActiva.value = null
  }

  return {
    contactos,
    conversaciones,
    conversacionActiva,
    unreadTotal,
    fetchContactos,
    fetchConversacion,
    recibirMensaje,
    confirmarEnviado,
    enviarMensaje,
    clear
  }
})
