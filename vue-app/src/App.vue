<template>
  <router-view />

  <!-- ══ TOAST PREMIUM — fixed top-right ══ -->
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-80">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start bg-white rounded-2xl border border-gray-100 shadow-modal overflow-hidden"
        >
          <!-- Left accent bar -->
          <div class="w-[3px] self-stretch flex-shrink-0" :class="toastAccent(t.type)"></div>

          <!-- Icon -->
          <div class="flex-shrink-0 flex items-start pt-3.5 pl-3.5 pr-1">
            <div class="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" :class="toastIconBg(t.type)">
              <!-- success -->
              <svg v-if="t.type === 'success'" class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
              <!-- error -->
              <svg v-else-if="t.type === 'error'" class="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <!-- warning -->
              <svg v-else-if="t.type === 'warning'" class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <!-- info -->
              <svg v-else class="w-3.5 h-3.5 text-[#1B3A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 py-3.5 pr-1">
            <p v-if="t.title" class="font-semibold text-sm text-gray-900 leading-tight">{{ t.title }}</p>
            <p class="text-sm leading-snug" :class="t.title ? 'text-gray-500 mt-0.5' : 'text-gray-700 font-medium'">
              {{ t.message }}
            </p>
          </div>

          <!-- Dismiss -->
          <button @click="removeToast(t.id)"
            class="flex-shrink-0 p-3 text-gray-300 hover:text-gray-500 transition-colors self-start">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, provide, watch, onMounted } from 'vue'
import { useAuthStore }          from './stores/auth.js'
import { useNotificationsStore } from './stores/notifications.js'
import { useWebSocketStore }     from './stores/websocket.js'
import { useChatStore }          from './stores/chat.js'
import { useGpsStore }           from './stores/gps.js'
import { initPushNotifications } from './utils/pushNotifications.js'

const auth    = useAuthStore()
const notifs  = useNotificationsStore()
const wsStore = useWebSocketStore()
const chat    = useChatStore()
const gps     = useGpsStore()

// Iniciar polling de notificaciones cuando el usuario esté autenticado
onMounted(() => {
  if (auth.isAuthenticated) {
    notifs.startPolling()
    if (auth.token) wsStore.connect(auth.token)
  }
})
watch(() => auth.isAuthenticated, (loggedIn) => {
  if (loggedIn) {
    notifs.startPolling()
    if (auth.token) wsStore.connect(auth.token)
  } else {
    notifs.stopPolling()
    wsStore.disconnect()
    chat.clear()
    gps.clear()
  }
})

// Registrar handlers de WS cuando el token esté disponible
watch(() => auth.token, (token) => {
  if (token) {
    wsStore.on('chat_message',    chat.recibirMensaje)
    wsStore.on('chat_sent',       chat.confirmarEnviado)
    wsStore.on('location_update', gps.recibirUbicacion)
    chat.fetchContactos()
    // Inicializar push notifications con un pequeño delay (esperar SW ready)
    setTimeout(() => initPushNotifications().catch(console.warn), 2000)
  }
}, { immediate: true })

// ── Toast system ──
const toasts = ref([])
let toastId = 0

function addToast({ type = 'info', title = '', message = '', duration = 4500 }) {
  const id = ++toastId
  toasts.value.push({ id, type, title, message })
  if (duration > 0) setTimeout(() => removeToast(id), duration)
}
function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) toasts.value.splice(idx, 1)
}

function toastAccent(type) {
  return {
    success: 'bg-emerald-400',
    error:   'bg-red-400',
    warning: 'bg-amber-400',
    info:    'bg-[#1B3A5C]',
  }[type] || 'bg-gray-300'
}
function toastIconBg(type) {
  return {
    success: 'bg-emerald-50',
    error:   'bg-red-50',
    warning: 'bg-amber-50',
    info:    'bg-blue-50',
  }[type] || 'bg-gray-100'
}

provide('toast', { add: addToast })
</script>

<style>
/* ── Toast transition ── */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.97);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px) scale(0.97);
}
.toast-move {
  transition: transform 0.2s ease;
}
</style>
