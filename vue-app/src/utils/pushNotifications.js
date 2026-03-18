/**
 * pushNotifications.js
 * Utilidades para registrar el Service Worker y suscribirse a Web Push.
 * Llamar initPushNotifications() cuando el usuario hace login.
 */
import axios from 'axios'
import { Capacitor } from '@capacitor/core'

/**
 * Convierte una VAPID public key en formato base64url a Uint8Array
 * (requerido por PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

/**
 * Registra el Service Worker, solicita permiso de notificaciones
 * y guarda la suscripción push en el servidor.
 * Es seguro llamarlo múltiples veces — detecta si ya está suscrito.
 */
export async function initPushNotifications() {
  // En el APK nativo (Capacitor), el WebView no tiene acceso a la
  // infraestructura FCM del navegador → Web Push no funciona.
  // Las notificaciones en el APK llegan por WebSocket mientras la app está abierta,
  // y el ForegroundService GPS mantiene el proceso vivo en segundo plano.
  if (Capacitor.isNativePlatform()) {
    console.log('[push] APK nativo detectado — Web Push omitido (usar WS)')
    return
  }

  // Verificar soporte del navegador (PWA)
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[push] Push notifications no soportadas en este navegador')
    return
  }

  try {
    // 1. Registrar Service Worker
    const reg = await navigator.serviceWorker.register('/sw.js')

    // 2. Pedir permiso de notificaciones PRIMERO (antes de cualquier check)
    //    Así el navegador siempre muestra el diálogo, aunque el backend
    //    no tenga VAPID configurado todavía.
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') {
      console.log('[push] Permiso de notificaciones denegado')
      return
    }

    // 3. Obtener VAPID public key del servidor
    const { data } = await axios.get('/api/push/vapid-public-key')
    if (!data.publicKey) {
      console.log('[push] VAPID keys no configuradas en el servidor — permiso obtenido, push pendiente')
      return
    }

    // 4. Suscribirse al push (o reutilizar suscripción existente)
    await reg.pushManager.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey)
      })
    }

    // 5. Enviar suscripción al backend para almacenarla
    await axios.post('/api/push/subscribe', { subscription: sub.toJSON() })
    console.log('[push] Suscripción push registrada correctamente')

  } catch (err) {
    // No bloquear el flujo de la app si falla push
    console.warn('[push] Error al inicializar push notifications:', err.message)
  }
}
