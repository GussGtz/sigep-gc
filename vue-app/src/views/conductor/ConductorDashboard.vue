<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <!-- ── Mobile Top Bar ── -->
    <header class="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/[0.06] flex items-center px-4 gap-3 shadow-soft">
      <div class="flex items-center gap-2.5 flex-1">
        <svg class="w-7 h-7" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="28" height="28" rx="7" fill="#1B3A5C"/>
          <rect x="4.5" y="4.5" width="19" height="19" rx="2" stroke="white" stroke-width="1.5" fill="none"/>
          <line x1="14" y1="4.5" x2="14" y2="23.5" stroke="white" stroke-width="1.5"/>
          <line x1="4.5" y1="14" x2="23.5" y2="14" stroke="white" stroke-width="1.5"/>
          <rect x="6" y="6" width="7" height="7" rx="0.75" fill="white" fill-opacity="0.18"/>
        </svg>
        <div>
          <span class="font-serif font-bold text-gray-900 text-sm">Mis Entregas</span>
        </div>
      </div>
      <!-- GPS status pill -->
      <div v-if="gpsActivo"
        class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
        GPS
      </div>
      <!-- Refresh button -->
      <button @click="fetchEntregas" :disabled="loadingEntregas"
        class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        title="Actualizar entregas">
        <svg class="w-4 h-4" :class="loadingEntregas ? 'animate-spin' : ''"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </button>
      <!-- User avatar → chat -->
      <router-link to="/chat"
        class="relative w-8 h-8 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
        {{ initials }}
      </router-link>
    </header>

    <main class="pt-14 pb-6">
      <div class="max-w-lg mx-auto px-4 py-6 space-y-5">

        <!-- ── Turno card ── -->
        <div class="bg-white rounded-2xl border shadow-soft p-5 transition-colors"
          :class="enRuta
            ? 'border-emerald-200 bg-emerald-50/60'
            : 'border-black/[0.06]'">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-gray-900">{{ auth.user?.nombre }}</p>
              <p class="text-sm mt-0.5 font-medium"
                :class="enRuta ? 'text-emerald-600' : 'text-gray-400'">
                {{ enRuta ? '● En ruta' : '○ Turno no iniciado' }}
              </p>
              <p class="text-[11px] text-gray-400 mt-0.5 capitalize">
                {{ todayLabel }}
              </p>
            </div>
            <button
              @click="toggleTurno"
              :disabled="toggling"
              class="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex-shrink-0"
              :class="enRuta
                ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                : 'bg-[#1B3A5C] text-white hover:bg-[#15304D] shadow-sm'">
              {{ enRuta ? 'Finalizar' : 'Iniciar turno' }}
            </button>
          </div>

          <!-- Stats row -->
          <div v-if="entregas.length" class="flex gap-4 mt-4 pt-4 border-t border-black/[0.05]">
            <div class="flex-1 text-center">
              <p class="font-serif text-xl font-bold text-gray-900">{{ entregas.length }}</p>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Total</p>
            </div>
            <div class="w-px bg-gray-100"></div>
            <div class="flex-1 text-center">
              <p class="font-serif text-xl font-bold text-[#1B3A5C]">
                {{ entregas.filter(e => e.estado === 'en_camino').length }}
              </p>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">En ruta</p>
            </div>
            <div class="w-px bg-gray-100"></div>
            <div class="flex-1 text-center">
              <p class="font-serif text-xl font-bold text-emerald-600">
                {{ entregas.filter(e => e.estado === 'entregada').length }}
              </p>
              <p class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Listas</p>
            </div>
          </div>
        </div>

        <!-- ── Entregas list ── -->
        <div>
          <h2 class="font-semibold text-gray-700 text-sm uppercase tracking-widest mb-3">Entregas Asignadas</h2>

          <!-- Loading skeleton -->
          <div v-if="loadingEntregas" class="space-y-3">
            <div v-for="i in 3" :key="i" class="skeleton h-24 rounded-2xl"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="entregas.length === 0"
            class="bg-white rounded-2xl border border-black/[0.06] shadow-soft text-center py-12 px-4">
            <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg class="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <p class="text-gray-700 text-sm font-semibold">Sin entregas asignadas</p>
            <p class="text-gray-400 text-xs mt-1 mb-4">El administrador te asignará rutas aquí</p>
            <button @click="fetchEntregas"
              class="text-xs font-semibold text-[#1B3A5C] hover:underline">
              Actualizar
            </button>
          </div>

          <!-- List -->
          <div v-else class="space-y-3">
            <div v-for="e in entregas" :key="e.id"
              class="bg-white rounded-2xl border shadow-soft p-4 transition-colors"
              :class="{
                'border-emerald-200 bg-emerald-50/30': e.estado === 'entregada',
                'border-[#1B3A5C]/20 bg-blue-50/20':  e.estado === 'en_camino',
                'border-black/[0.06]':                 e.estado === 'asignada'
              }">

              <!-- Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-gray-900">#{{ e.numero_pedido }}</span>
                    <StatusBadge :status="e.estado" />
                  </div>
                  <p v-if="e.cliente_nombre" class="text-sm text-gray-600 font-medium mt-0.5">{{ e.cliente_nombre }}</p>
                  <p v-if="e.direccion_entrega" class="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {{ e.direccion_entrega }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(e.fecha_entrega) }}</p>
                </div>
              </div>

              <!-- Action -->
              <button v-if="e.estado !== 'entregada'"
                @click="iniciarEntrega(e)"
                class="w-full btn-primary justify-center py-2.5"
                :class="e.estado === 'en_camino' ? 'bg-emerald-600 hover:bg-emerald-700' : ''">
                <template v-if="e.estado === 'en_camino'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Registrar Entrega
                </template>
                <template v-else>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
                  Iniciar Entrega
                </template>
              </button>
              <div v-else
                class="w-full flex items-center justify-center gap-2 py-2 text-emerald-600 text-sm font-semibold">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Entrega completada
              </div>
            </div>
          </div>
        </div>

        <!-- ── Chat shortcut ── -->
        <router-link to="/chat"
          class="flex items-center gap-3 bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4 hover:border-[#1B3A5C]/20 transition-colors">
          <div class="w-10 h-10 bg-[#1B3A5C]/10 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-[#1B3A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-gray-900">Chat del equipo</p>
            <p class="text-xs text-gray-400">Comunícate con administración</p>
          </div>
          <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </router-link>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge        from '../../components/shared/StatusBadge.vue'
import { useAuthStore }      from '../../stores/auth.js'
import { useWebSocketStore } from '../../stores/websocket.js'
import axios from 'axios'

const auth    = useAuthStore()
const wsStore = useWebSocketStore()
const router  = useRouter()
const toast   = inject('toast')

const enRuta          = ref(false)
const toggling        = ref(false)
const entregas        = ref([])
const loadingEntregas = ref(true)
const gpsActivo       = ref(false)
const watchId         = ref(null)

// Clave localStorage por usuario para no mezclar sesiones
const turnoKey = computed(() => `turno_conductor_${auth.user?.id || 'anon'}`)

const initials  = computed(() =>
  (auth.user?.nombre || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)
const todayLabel = computed(() =>
  new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { weekday: 'long', day: '2-digit', month: 'short' })
}

function toggleTurno() {
  toggling.value = true
  enRuta.value = !enRuta.value
  // Persistir estado del turno en localStorage
  localStorage.setItem(turnoKey.value, enRuta.value ? '1' : '0')
  if (enRuta.value) {
    toast.add({ type: 'success', title: 'Turno iniciado', message: 'Estás en ruta. El GPS se activará al iniciar una entrega.' })
  } else {
    stopGPS()
    toast.add({ type: 'info', title: 'Turno finalizado', message: 'Has cerrado sesión de trabajo.' })
  }
  toggling.value = false
}

function startGPS(pedidoId) {
  if (!navigator.geolocation) {
    toast.add({ type: 'warning', title: 'GPS no disponible', message: 'Este dispositivo no soporta geolocalización.' })
    return
  }
  if (watchId.value !== null) stopGPS()
  watchId.value = navigator.geolocation.watchPosition(
    ({ coords }) => {
      wsStore.send({
        type:      'location_update',
        lat:       coords.latitude,
        lng:       coords.longitude,
        pedido_id: pedidoId || null
      })
    },
    (err) => {
      console.warn('[GPS] Error:', err.message)
      if (err.code === 1) {
        gpsActivo.value = false
        toast.add({ type: 'warning', title: 'GPS bloqueado', message: 'Permite el acceso a tu ubicación para el tracking.' })
      }
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  )
  gpsActivo.value = true
}

function stopGPS() {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value   = null
    gpsActivo.value = false
  }
}

// Iniciar una entrega específica — llama al backend y actualiza estado en DB
async function iniciarEntrega(e) {
  if (e.estado !== 'en_camino') {
    try {
      await axios.put(`/api/entregas/${e.id}/iniciar`)
    } catch (err) {
      toast.add({ type: 'error', title: 'Error', message: 'No se pudo iniciar la entrega. Intenta de nuevo.' })
      return
    }
    // Actualizar estado local inmediatamente
    e.estado = 'en_camino'
    enRuta.value = true
    localStorage.setItem(turnoKey.value, '1')
    startGPS(e.pedido_id)
  }
  router.push(`/conductor/entrega/${e.id}`)
}

async function fetchEntregas() {
  loadingEntregas.value = true
  try {
    const { data } = await axios.get('/api/entregas/conductor/mis-entregas')
    entregas.value = Array.isArray(data) ? data : []
    // Restablecer turno desde DB (fuente de verdad) si hay entrega activa
    const activa = entregas.value.find(e => e.estado === 'en_camino')
    if (activa) {
      enRuta.value = true
      localStorage.setItem(turnoKey.value, '1')
      startGPS(activa.pedido_id)
    }
  } catch (err) {
    entregas.value = []
    const msg = err.response?.status === 401
      ? 'Sesión expirada. Por favor inicia sesión.'
      : 'No se pudieron cargar las entregas. Verifica tu conexión.'
    toast.add({ type: 'error', title: 'Error al cargar', message: msg })
  } finally {
    loadingEntregas.value = false
  }
}

onMounted(async () => {
  // Restaurar estado del turno desde localStorage mientras carga la BD
  if (localStorage.getItem(turnoKey.value) === '1') enRuta.value = true
  await fetchEntregas()
  // fetchEntregas es la fuente de verdad: si no hay en_camino, el turno es falso
  // (evita que quede "en ruta" si el admin cambió el estado manualmente)
  const hayActiva = entregas.value.some(e => e.estado === 'en_camino')
  if (!hayActiva) {
    enRuta.value = false
    localStorage.removeItem(turnoKey.value)
  }
})
onUnmounted(stopGPS)
</script>
