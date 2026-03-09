import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  let _pollTimer = null

  /* ── Conteo de no leídas ── */
  const unreadCount = computed(() =>
    notifications.value.filter(n => !n._read).length
  )

  /* ── Fetch desde la BD ──────────────────────────────────────────
     Llama a GET /api/notificaciones y sincroniza el estado local.
     Silencioso en caso de error (red, token expirado, etc.)
  ────────────────────────────────────────────────────────────── */
  async function fetchFromDB() {
    try {
      const { data } = await axios.get('/api/notificaciones')
      // Normalizar para compatibilidad con templates existentes
      notifications.value = data.map(n => ({
        id:          String(n.id),
        type:        n.tipo,
        orderId:     n.pedido_id ? String(n.pedido_id) : null,
        orderNumber: n.pedido_numero || null,
        message:     n.mensaje,
        createdAt:   new Date(n.created_at),
        creadoPor:   n.creado_por_nombre || 'Sistema',
        _read:       Boolean(n.leida)
      }))
    } catch {
      // Silencioso — puede ser que el token no esté disponible todavía
    }
  }

  /* ── Iniciar polling cada 15 segundos ── */
  function startPolling() {
    if (_pollTimer) return        // ya está corriendo
    fetchFromDB()                 // fetch inmediato al arrancar
    _pollTimer = setInterval(fetchFromDB, 15_000)
  }

  /* ── Detener polling (logout) ── */
  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer)
      _pollTimer = null
    }
    notifications.value = []
  }

  /* ── Marcar una como leída (optimista + API) ── */
  async function markAsRead(id) {
    const n = notifications.value.find(n => n.id === String(id))
    if (n) n._read = true   // optimista
    try {
      await axios.patch(`/api/notificaciones/${id}/leer`)
    } catch { /* silencioso */ }
  }

  /* ── Marcar todas como leídas ── */
  async function markAllAsRead() {
    notifications.value.forEach(n => { n._read = true })  // optimista
    try {
      await axios.patch('/api/notificaciones/leer-todas')
    } catch { /* silencioso */ }
  }

  /* ── Añadir optimistamente ──────────────────────────────────────
     Muestra la notificación de forma instantánea para el usuario
     que acaba de hacer la acción. El poll siguiente la confirma.
  ────────────────────────────────────────────────────────────── */
  function create({ type, orderId, orderNumber, message }) {
    // No insertar duplicados si ya existe la misma desde el poll
    const yaExiste = notifications.value.some(n =>
      n.type === type && n.message === message
    )
    if (yaExiste) return
    notifications.value.unshift({
      id:          `opt-${Date.now()}`,
      type,
      orderId:     orderId ? String(orderId) : null,
      orderNumber: orderNumber || null,
      message,
      createdAt:   new Date(),
      creadoPor:   'Tú',
      _read:       true   // el propio usuario no la ve como no leída
    })
  }

  /* ── Limpiar y detener (logout) ── */
  function clear() {
    stopPolling()
  }

  return {
    notifications,
    unreadCount,
    fetchFromDB,
    startPolling,
    stopPolling,
    markAsRead,
    markAllAsRead,
    create,
    clear
  }
})
