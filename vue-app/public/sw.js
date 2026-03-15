/* ═══════════════════════════════════════════════════════════
   Glass Caribe — Service Worker v3
   Responsabilidad:
     1. Push Notifications — mostrar notificaciones nativas
     2. GPS Reminder — notificación persistente con botón "Abrir GPS"
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'glass-caribe-sw-v3'

// Activar inmediatamente sin esperar a que las páginas se recarguen
self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// ── Push Event — mostrar notificación nativa ──────────────────────────────
self.addEventListener('push', e => {
  let data = {}
  try { data = e.data?.json() ?? {} } catch {}

  const isGpsReminder = data.tag === 'gps-reminder'

  const title   = data.title || 'Glass Caribe'
  const options = {
    body:     data.body  || '',
    icon:     '/icons/logo.jpg',
    badge:    '/icons/logo.jpg',
    tag:      data.tag   || 'glass-caribe-notif',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: data.url || '/' },

    // GPS Reminder: no desaparece automáticamente + botón de acción
    ...(isGpsReminder ? {
      requireInteraction: true,
      actions: [
        { action: 'open-gps', title: '📍 Abrir app' }
      ]
    } : {})
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification Click — abrir / enfocar la app ───────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()

  const targetUrl = e.notification.data?.url || '/'

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Si ya hay una ventana abierta, enfocarla y navegar a la ruta
        for (const client of list) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) client.navigate(targetUrl)
            return
          }
        }
        // Sin ventanas abiertas — abrir nueva
        if (clients.openWindow) return clients.openWindow(targetUrl)
      })
  )
})

// ── Message — recibir mensajes de la página ───────────────────────────────
// Útil para que la página le diga al SW el token JWT (para futuras acciones)
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
