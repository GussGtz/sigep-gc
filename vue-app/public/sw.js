/* ═══════════════════════════════════════════════════════════
   Glass Caribe — Service Worker v6
   Responsabilidades:
     1. Push Notifications — mostrar notificaciones nativas
     2. GPS Keepalive     — intercepta /sw-ping para mantener el
        Service Worker y el tab del conductor activos en background
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'glass-caribe-sw-v6'

// Activar inmediatamente sin esperar a que las páginas se recarguen
self.addEventListener('install', () => self.skipWaiting())

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

  const title   = data.title || 'Glass Caribe'
  const options = {
    body:     data.body  || '',
    icon:     '/icons/icon-192.png',
    badge:    '/icons/icon-192.png',
    tag:      data.tag   || 'glass-caribe-notif',
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: data.url || '/' }
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

// ── Fetch — intercepción especial para GPS keepalive ─────────────────────
//
// El store gps.js llama fetch('/sw-ping', { keepalive: true }) cada 20 s
// mientras el GPS está activo. Interceptar aquí sirve para:
//   (a) Mantener el SW "vivo" (procesar el fetch event evita que el browser
//       termine el SW por inactividad).
//   (b) Enviar un GPS_PING a todos los clientes → el store responde llamando
//       getCurrentPosition como respaldo en background.
//   (c) Responder 200 inmediatamente — cero tráfico de red.
//
// Todos los demás requests pasan sin modificar (no se cachea nada).
// ─────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  if (url.pathname === '/sw-ping') {
    // Despertar a los clientes para que tomen una lectura GPS
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(all => {
        all.forEach(c => c.postMessage({ type: 'GPS_PING' }))
      })
    )

    // Respuesta inmediata — sin red
    e.respondWith(
      new Response('ok', {
        status:  200,
        headers: {
          'Content-Type':  'text/plain',
          'Cache-Control': 'no-store'
        }
      })
    )
    return
  }

  // Resto de requests: dejar pasar al navegador sin interferir
  // (sin cache, sin modificación)
})

// ── Message — recibir mensajes de la página ───────────────────────────────
self.addEventListener('message', e => {

  // Actualización del SW
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
