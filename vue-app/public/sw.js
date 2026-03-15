/* ═══════════════════════════════════════════════════════════
   Glass Caribe — Service Worker v5
   Responsabilidades:
     1. Push Notifications   — mostrar notificaciones nativas
     2. GPS Foreground Notif — notificación persistente GPS activo
        (equivalente al "foreground service" de Android)
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
    return
  }

  // ── GPS Foreground Start ─────────────────────────────────────────────────
  // La página notifica que el GPS del conductor está activo.
  // Mostramos una notificación persistente en la barra de notificaciones.
  // En Android, esta notificación evita que el SO mate el proceso
  // (equivalente al "startForegroundService" de apps nativas).
  if (e.data?.type === 'GPS_FOREGROUND_START') {
    e.waitUntil(
      self.registration.showNotification('Glass Caribe', {
        body:             '📍 GPS activo — tu ubicación se está compartiendo',
        icon:             '/icons/logo.jpg',
        badge:            '/icons/logo.jpg',
        tag:              'gps-foreground',
        renotify:         false,   // no vibrar ni hacer ruido al actualizar
        silent:           true,    // sin sonido (es solo indicador de estado)
        requireInteraction: true,  // no se cierra sola → persiste en la barra
        data:             { url: '/conductor' },
      })
    )
    return
  }

  // ── GPS Foreground Stop ──────────────────────────────────────────────────
  // El conductor finalizó su turno → cerrar la notificación persistente.
  if (e.data?.type === 'GPS_FOREGROUND_STOP') {
    e.waitUntil(
      self.registration
        .getNotifications({ tag: 'gps-foreground' })
        .then(notifs => notifs.forEach(n => n.close()))
    )
    return
  }
})
