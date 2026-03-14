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
      </div>
      <!-- GPS status pill -->
      <div v-if="gpsStore.isTracking"
        class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
        GPS
      </div>
      <!-- User avatar dropdown -->
      <div class="relative" ref="userMenuRef">
        <button @click="userMenuOpen = !userMenuOpen"
          class="relative w-8 h-8 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {{ initials }}
        </button>
        <Transition name="slide">
          <div v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden z-50">
            <router-link to="/chat" @click="userMenuOpen = false"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Chat del equipo
            </router-link>
            <button @click="showCambiarPass = true; userMenuOpen = false"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Cambiar contraseña
            </button>
            <div class="border-t border-gray-100 my-1"></div>
            <button @click="cerrarSesion"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </Transition>
      </div>
    </header>

    <main class="pt-14 pb-6">
      <div class="max-lg mx-auto px-4 py-6 space-y-5">

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
              {{ toggling ? '...' : enRuta ? 'Finalizar' : 'Iniciar turno' }}
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

      </div>
    </main>
  <!-- ══ MODAL CAMBIAR CONTRASEÑA ══ -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showCambiarPass"
        class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="cerrarCambiarPass">
        <div class="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-4" @click.stop>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Cambiar contraseña</h3>
            <button @click="cerrarCambiarPass"
              class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
              <input v-model="passActual" type="password" autocomplete="current-password"
                placeholder="••••••••"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                @keyup.enter="guardarPassword"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
              <input v-model="passNueva" type="password" autocomplete="new-password"
                placeholder="Mínimo 6 caracteres"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                @keyup.enter="guardarPassword"/>
            </div>
            <p v-if="passError" class="text-xs text-red-500 font-medium">{{ passError }}</p>
          </div>
          <div class="flex gap-2 pt-1">
            <button @click="cerrarCambiarPass"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button @click="guardarPassword" :disabled="guardandoPass"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1B3A5C] hover:bg-[#152d47] disabled:opacity-50 transition-colors">
              {{ guardandoPass ? 'Guardando…' : 'Cambiar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import StatusBadge          from '../../components/shared/StatusBadge.vue'
import { useAuthStore }      from '../../stores/auth.js'
import { useWebSocketStore } from '../../stores/websocket.js'
import { useGpsStore }       from '../../stores/gps.js'
import axios from 'axios'

const auth     = useAuthStore()
const wsStore  = useWebSocketStore()
const gpsStore = useGpsStore()
const router   = useRouter()
const toast    = inject('toast')

const enRuta          = ref(false)
const toggling        = ref(false)
const entregas        = ref([])
const loadingEntregas = ref(true)

// ── Avatar dropdown ──
const userMenuRef   = ref(null)
const userMenuOpen  = ref(false)

// ── Cambiar contraseña ──
const showCambiarPass = ref(false)
const passActual      = ref('')
const passNueva       = ref('')
const passError       = ref('')
const guardandoPass   = ref(false)

function cerrarCambiarPass() {
  showCambiarPass.value = false
  passActual.value = ''
  passNueva.value  = ''
  passError.value  = ''
}

async function guardarPassword() {
  passError.value = ''
  if (!passActual.value || !passNueva.value)
    return (passError.value = 'Completa ambos campos')
  if (passNueva.value.length < 6)
    return (passError.value = 'La nueva contraseña debe tener mínimo 6 caracteres')
  guardandoPass.value = true
  try {
    await axios.patch('/api/auth/cambiar-password', {
      password_actual: passActual.value,
      nueva_password:  passNueva.value,
    })
    cerrarCambiarPass()
    toast.add({ type: 'success', title: '¡Listo!', message: 'Contraseña actualizada correctamente.' })
  } catch (err) {
    passError.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    guardandoPass.value = false
  }
}

async function cerrarSesion() {
  userMenuOpen.value = false
  await auth.logout()
  router.push('/')
}

function onClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target))
    userMenuOpen.value = false
}

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

// ── Toggle turno: llama al backend y activa/desactiva GPS ──────────────────
async function toggleTurno() {
  toggling.value = true
  try {
    const { data } = await axios.patch('/api/usuarios/turno/toggle')
    enRuta.value = data.en_turno

    // Sincronizar en auth store / localStorage
    if (auth.user) {
      auth.user.en_turno = data.en_turno
      localStorage.setItem('sgpv_user', JSON.stringify(auth.user))
    }

    if (enRuta.value) {
      // Buscar entrega activa para pasar el pedido_id al GPS
      const activa = entregas.value.find(e => e.estado === 'en_camino')
      gpsStore.startTracking(wsStore, activa?.pedido_id ?? null)
      toast.add({ type: 'success', title: 'Turno iniciado', message: 'El GPS está activo. El admin puede ver tu posición.' })
    } else {
      gpsStore.stopTracking()
      toast.add({ type: 'info', title: 'Turno finalizado', message: 'Has cerrado sesión de trabajo.' })
    }
  } catch {
    toast.add({ type: 'error', title: 'Error', message: 'No se pudo cambiar el estado del turno.' })
  } finally {
    toggling.value = false
  }
}

// ── Iniciar entrega específica ─────────────────────────────────────────────
async function iniciarEntrega(e) {
  if (e.estado !== 'en_camino') {
    try {
      await axios.put(`/api/entregas/${e.id}/iniciar`)
    } catch {
      toast.add({ type: 'error', title: 'Error', message: 'No se pudo iniciar la entrega. Intenta de nuevo.' })
      return
    }
    e.estado = 'en_camino'

    // Activar turno en DB si no estaba activo
    if (!enRuta.value) {
      try {
        const { data } = await axios.patch('/api/usuarios/turno/toggle')
        enRuta.value = data.en_turno
        if (auth.user) {
          auth.user.en_turno = data.en_turno
          localStorage.setItem('sgpv_user', JSON.stringify(auth.user))
        }
      } catch {}
    }

    // Actualizar pedido_id en el GPS (el watch sigue corriendo, solo cambia el ID)
    if (gpsStore.isTracking) {
      gpsStore.updatePedidoId(e.pedido_id)
    } else {
      gpsStore.startTracking(wsStore, e.pedido_id)
    }
  }

  // Navegar a la página de entrega — el GPS NO se detiene al desmontar
  router.push(`/conductor/entrega/${e.id}`)
}

// ── Cargar entregas ────────────────────────────────────────────────────────
async function fetchEntregas() {
  loadingEntregas.value = true
  try {
    const { data } = await axios.get('/api/entregas/conductor/mis-entregas')
    entregas.value = Array.isArray(data) ? data : []
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

// ── Montar: restaurar estado desde DB ────────────────────────────────────
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  // Desregistrar handler de tiempo real al salir de la vista
  wsStore.off('data_entregas')
})

onMounted(async () => {
  document.addEventListener('mousedown', onClickOutside)
  // enRuta viene del perfil del usuario (auth.user.en_turno se llena desde /me en el router guard)
  enRuta.value = auth.user?.en_turno === true

  // ── Tiempo real: cuando el admin asigne/modifique una entrega,
  //    el servidor emite data_entregas y el dashboard se actualiza automáticamente ──
  wsStore.on('data_entregas', fetchEntregas)

  await fetchEntregas()

  // Si el turno está activo, asegurar que el GPS esté corriendo
  if (enRuta.value && !gpsStore.isTracking) {
    const activa = entregas.value.find(e => e.estado === 'en_camino')
    gpsStore.startTracking(wsStore, activa?.pedido_id ?? null)
  }
  // Si hay entrega en_camino pero el GPS ya corre, sólo actualizar el pedido_id
  else if (enRuta.value && gpsStore.isTracking) {
    const activa = entregas.value.find(e => e.estado === 'en_camino')
    if (activa) gpsStore.updatePedidoId(activa.pedido_id)
  }
})

// ⚠️ NO hay onUnmounted(stopGPS) — el GPS continúa al navegar a ConductorEntrega
// Solo se detiene cuando el conductor pulsa "Finalizar turno" o hace logout
</script>
