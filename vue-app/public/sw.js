/* ═══════════════════════════════════════════════════════════
   Glass Caribe — Service Worker v7

   Capas de background GPS (de mayor a menor prioridad):
     1. fetch '/sw-ping'        → ping cada 15 s desde el tab activo
     2. sync 'gps-keepalive'   → Background Sync: backup cuando hay
                                  reconexión o el browser despierta el SW
     3. periodicsync 'gps-bg'  → Periodic Background Sync: disparo
                                  periódico sin que la app esté abierta
                                  (requiere PWA instalada + permiso)
     4. push notification      → si GPS está activo, además de mostrar
                                  la notif pinga a los clientes
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'glass-caribe-sw-v7'

// ── Estado interno: ¿está el GPS del conductor activo? ─────────────────────
// Se sincroniza con GPS_START / GPS_STOP desde la página.
// Permite que el SW tome decisiones (p.ej. pingar en push) sin que la
// página tenga que estar abierta.
let _gpsActive = false

// ── Lifecycle ────────────────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => clients.claim())
  )
})

// ── Message — mensajes de la página ──────────────────────────────────────────
self.addEventListener('message', e => {
  switch (e.data?.type) {
    case 'GPS_START':    _gpsActive = true;  break
    case 'GPS_STOP':     _gpsActive = false; break
    case 'SKIP_WAITING': self.skipWaiting(); break
  }
})

// ── Helper: enviar GPS_PING a todos los clientes/tabs activos ─────────────────
function _pingGpsClients() {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: false })
    .then(all => {
      all.forEach(c => c.postMessage({ type: 'GPS_PING' }))
      return all.length
    })
}

// ── Push — mostrar notificación nativa ───────────────────────────────────────
// Si el GPS está activo, además de mostrar la notif se pinga a los clientes
// para que capturen una posición inmediata (cubre el gap de Doze/screen-off).
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

  const tasks = [self.registration.showNotification(title, options)]
  if (_gpsActive) tasks.push(_pingGpsClients())

  e.waitUntil(Promise.all(tasks))
})

// ── Notification Click — abrir / enfocar la app ───────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const targetUrl = e.notification.data?.url || '/conductor'

  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const client of list) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) client.navigate(targetUrl)
            return
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl)
      })
  )
})

// ── Fetch — intercepción GPS keepalive (/sw-ping) ─────────────────────────────
//
// El store gps.js llama fetch('/sw-ping', { keepalive:true }) cada 15 s
// mientras el GPS está activo. Interceptar aquí sirve para:
//   (a) Mantener el SW "vivo" (procesar el fetch event evita que el browser
//       termine el SW por inactividad).
//   (b) Enviar GPS_PING a todos los clientes → el store responde llamando
//       getCurrentPosition como respaldo en background.
//   (c) Responder 200 inmediatamente — cero tráfico de red.
//
// Todos los demás requests pasan sin modificar (no se cachea nada).
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  if (url.pathname === '/sw-ping') {
    e.waitUntil(_pingGpsClients())
    e.respondWith(
      new Response('ok', {
        status:  200,
        headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }
      })
    )
    return
  }

  // Resto de requests: pasar al navegador sin modificar
})

// ── Background Sync — backup cuando el browser despierta el SW ────────────────
// Útil cuando el tab es throttleado/suspendido brevemente y el browser
// elige despertar el SW para sincronizar. Pingar clientes activos para
// que tomen una posición GPS de respaldo.
self.addEventListener('sync', e => {
  if (e.tag === 'gps-keepalive') {
    e.waitUntil(_pingGpsClients())
  }
})

// ── Periodic Background Sync — disparo periódico (PWA instalada) ──────────────
// Chrome para Android puede despertar el SW periódicamente aunque la app
// esté cerrada o minimizada con pantalla apagada.
// Si hay tabs del conductor abiertos: pingar para obtener posición GPS.
// Si no hay tabs: no se puede obtener GPS desde el SW (limitación PWA).
self.addEventListener('periodicsync', e => {
  if (e.tag === 'gps-bg') {
    // Solo actuar si el SW sabe que el GPS está activo
    if (_gpsActive) {
      e.waitUntil(_pingGpsClients())
    }
  }
})
