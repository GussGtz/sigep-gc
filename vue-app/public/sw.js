/* ═══════════════════════════════════════════════════════════
   Glass Caribe — Service Worker v5
   Responsabilidades:
     1. Push Notifications — mostrar notificaciones nativas
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'glass-caribe-sw-v5'

// Activar inmediatamente sin esperar a que las páginas se recarguen
self.addEventListener('install',  () => self.skipWaiting())

// Al activar: eliminar TODOS los cachés viejos y tomar control de inmediato
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  )
})

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

  const targetUrl = e.notification.data?.url || '/conductor'

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
self.addEventListener('message', e => {

  // Actualización del SW
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
