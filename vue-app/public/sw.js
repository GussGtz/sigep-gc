/* ═══════════════════════════════════════════════════════════
   VITREX SIGEP — Service Worker
   Responsabilidad: gestionar Push Notifications (PWA)
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'vitrex-sw-v1'

// Activar inmediatamente sin esperar a que las páginas se recarguen
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// ── Push Event — mostrar notificación nativa ──────────────────
self.addEventListener('push', e => {
  let data = {}
  try { data = e.data?.json() ?? {} } catch {}

  const title   = data.title || 'VITREX SIGEP'
  const options = {
    body:     data.body  || '',
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    tag:      data.tag   || 'vitrex-notif',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: data.url || '/' }
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

// ── Notification Click — abrir / enfocar la app ──────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()

  const targetUrl = e.notification.data?.url || '/'

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        // Si ya hay una ventana abierta de la app, enfocarla y navegar
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
