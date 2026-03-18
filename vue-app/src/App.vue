<template>
  <router-view />
  <PwaInstallBanner />

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
              <CheckCircle2 v-if="t.type === 'success'" class="w-3.5 h-3.5 text-emerald-600" :stroke-width="2.5" />
              <!-- error -->
              <XCircle v-else-if="t.type === 'error'" class="w-3.5 h-3.5 text-red-600" :stroke-width="2.5" />
              <!-- warning -->
              <AlertTriangle v-else-if="t.type === 'warning'" class="w-3.5 h-3.5 text-amber-600" :stroke-width="2.5" />
              <!-- info -->
              <Info v-else class="w-3.5 h-3.5 text-[#0D89CB]" :stroke-width="2.5" />
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
            <X class="w-3.5 h-3.5" :stroke-width="2.5" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, provide, watch, onMounted } from 'vue'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import PwaInstallBanner          from './components/shared/PwaInstallBanner.vue'
import { useAuthStore }          from './stores/auth.js'
import { useNotificationsStore } from './stores/notifications.js'
import { useWebSocketStore }     from './stores/websocket.js'
import { useChatStore }          from './stores/chat.js'
import { useGpsStore }           from './stores/gps.js'
import { usePedidosStore }       from './stores/pedidos.js'
import { useInventarioStore }    from './stores/inventario.js'
import { initPushNotifications } from './utils/pushNotifications.js'
import { usePwaStore }           from './stores/pwa.js'

const auth          = useAuthStore()
const notifs        = useNotificationsStore()
const wsStore       = useWebSocketStore()
const chat          = useChatStore()
const gps           = useGpsStore()
const pedidosStore  = usePedidosStore()
const inventarioStore = useInventarioStore()
const pwaStore      = usePwaStore()

// ── Debounce: evita múltiples re-fetch si llegan señales en ráfaga ──
function debounce(fn, delay) {
  let timer = null
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay) }
}
const debouncedFetchPedidos    = debounce(() => {
  // Conductores (role 3) no usan el store de pedidos
  if (auth.user?.role_id !== 3) pedidosStore.fetchPedidos()
}, 400)
const debouncedFetchInventario = debounce(() => {
  // Solo admins gestionan el inventario
  if (auth.user?.role_id === 1) {
    inventarioStore.fetchMateriales()
    inventarioStore.fetchMovimientos()
  }
}, 400)
// Cuando el admin asigna/modifica una entrega, el conductor recibe data_entregas.
// Si el conductor está en otra página (chat, entrega), el dashboard no está montado
// y no tiene un handler activo. Este handler global actualiza las notificaciones
// para que el badge alerte al conductor de que tiene nuevas asignaciones.
const debouncedConductorEntregas = debounce(() => {
  if (auth.user?.role_id === 3) notifs.fetchFromDB()
}, 400)

// Iniciar polling de notificaciones cuando el usuario esté autenticado
onMounted(() => {
  if (auth.isAuthenticated) {
    notifs.startPolling()
    if (auth.token) wsStore.connect(auth.token)
  }
  // ── Capturar evento PWA para instalación global ──
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    pwaStore.capturePrompt(e)
  })
  window.addEventListener('appinstalled', () => pwaStore.markInstalled())
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
    wsStore.on('location_update',   gps.recibirUbicacion)
    wsStore.on('conductor_offline', gps.recibirUbicacion)
    // ── Actualización en tiempo real: cualquier mutación del servidor
    //    emite un mensaje de invalidación → el frontend re-fetcha ──
    wsStore.on('data_pedidos',    debouncedFetchPedidos)
    wsStore.on('data_inventario', debouncedFetchInventario)
    wsStore.on('data_entregas',   debouncedConductorEntregas)
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
    info:    'bg-[#0D89CB]',
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

