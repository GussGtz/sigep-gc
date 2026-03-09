<template>
  <div class="flex flex-col h-full">

    <!-- ── Lista de mensajes ── -->
    <div ref="scrollEl" class="flex-1 overflow-y-auto p-4 space-y-3">

      <div v-if="loading" class="text-center text-slate-500 py-8 text-sm">
        Cargando comentarios...
      </div>

      <div v-else-if="comentarios.length === 0" class="flex flex-col items-center justify-center py-10 text-slate-500">
        <svg class="w-10 h-10 mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <p class="text-sm">Sin comentarios aún</p>
        <p class="text-xs text-slate-600 mt-1">Sé el primero en comentar</p>
      </div>

      <!-- Burbujas de chat -->
      <template v-else>
        <template v-for="(c, i) in comentarios" :key="c.id">
          <!-- Separador de fecha -->
          <div
            v-if="i === 0 || !mismoDia(comentarios[i - 1].createdAt, c.createdAt)"
            class="flex items-center gap-3 my-2"
          >
            <div class="flex-1 h-px bg-slate-700/50"></div>
            <span class="text-[10px] text-slate-500 px-2">{{ formatDia(c.createdAt) }}</span>
            <div class="flex-1 h-px bg-slate-700/50"></div>
          </div>

          <!-- Burbuja -->
          <div class="group flex items-start gap-2.5" :class="esMio(c) ? 'flex-row-reverse' : 'flex-row'">
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
              :class="areaColor(c.area)"
            >
              {{ iniciales(c.usuario_nombre) }}
            </div>
            <!-- Contenido -->
            <div :class="esMio(c) ? 'items-end' : 'items-start'" class="flex flex-col max-w-[75%]">
              <!-- Nombre + badge área -->
              <div class="flex items-center gap-1.5 mb-1" :class="esMio(c) ? 'flex-row-reverse' : 'flex-row'">
                <span class="text-[11px] font-semibold text-slate-300">{{ c.usuario_nombre }}</span>
                <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" :class="areaBadge(c.area)">
                  {{ areaLabel(c.area) }}
                </span>
              </div>
              <!-- Burbuja del mensaje -->
              <div
                class="px-3 py-2 rounded-2xl text-sm leading-relaxed break-words"
                :class="esMio(c)
                  ? 'bg-brand-600 text-white rounded-tr-sm'
                  : 'bg-slate-700/80 text-slate-100 rounded-tl-sm'"
              >
                {{ c.mensaje }}
              </div>
              <!-- Hora -->
              <span class="text-[10px] text-slate-500 mt-0.5 px-1">{{ formatHora(c.createdAt) }}</span>
            </div>

            <!-- Botón eliminar (admin, solo en mensajes ajenos) -->
            <button
              v-if="isAdmin && !esMio(c)"
              @click="eliminarComentario(c.id)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all self-center"
              title="Eliminar"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </template>
      </template>
    </div>

    <!-- ── Input para escribir ── -->
    <div v-if="puedeComentarEl" class="border-t border-slate-700 p-3">
      <div class="flex items-center gap-2">
        <!-- Avatar propio -->
        <div
          class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
          :class="areaColor(miArea)"
        >
          {{ iniciales(auth.user?.nombre) }}
        </div>
        <!-- Campo de texto -->
        <div class="flex-1 flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-2">
          <input
            v-model="nuevoMensaje"
            type="text"
            :placeholder="`Escribir como ${areaLabel(miArea)}...`"
            class="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
            :disabled="enviando"
            @keydown.enter.prevent="enviar"
          />
          <button
            @click="enviar"
            :disabled="!nuevoMensaje.trim() || enviando"
            class="text-brand-400 hover:text-brand-300 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Conductor/sin permiso: solo lectura -->
    <div v-else class="border-t border-slate-700 px-4 py-3 text-center text-xs text-slate-500">
      Solo lectura
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, inject } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth.js'
import { useNotificationsStore } from '../../stores/notifications.js'

const props = defineProps({
  orderId:     { type: [String, Number], required: true },
  orderNumber: { type: String, default: '' }
})

const auth   = useAuthStore()
const notifs = useNotificationsStore()
const toast  = inject('toast', { add: () => {} })

const comentarios  = ref([])
const nuevoMensaje = ref('')
const loading      = ref(true)
const enviando     = ref(false)
const scrollEl     = ref(null)

/* ── Área del usuario actual ── */
const miArea = computed(() => {
  const u = auth.user
  if (!u) return null
  if (u.role_id === 1) return 'admin'
  if (u.role_id === 3) return 'conductor'
  return u.departamento || 'colaborador'
})

const isAdmin = computed(() => auth.isAdmin)
const puedeComentarEl = computed(() => auth.isAuthenticated && auth.user?.role_id !== 3)

/* ── Helpers visuales ── */
function areaLabel(area) {
  return { admin: 'Admin', ventas: 'Ventas', contabilidad: 'Cont.', produccion: 'Prod.', conductor: 'Conductor', colaborador: 'Colab.' }[area] || area
}
function areaColor(area) {
  return { admin: 'bg-gray-700', ventas: 'bg-emerald-700', contabilidad: 'bg-purple-700', produccion: 'bg-amber-700', conductor: 'bg-blue-700', colaborador: 'bg-slate-600' }[area] || 'bg-slate-600'
}
function areaBadge(area) {
  return { admin: 'bg-gray-700/60 text-gray-300', ventas: 'bg-emerald-900/60 text-emerald-300', contabilidad: 'bg-purple-900/60 text-purple-300', produccion: 'bg-amber-900/60 text-amber-300', conductor: 'bg-blue-900/60 text-blue-300', colaborador: 'bg-slate-700 text-slate-400' }[area] || 'bg-slate-700 text-slate-400'
}
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function esMio(c) { return auth.user && c.usuario_id === auth.user.id }
function mismoDia(a, b) {
  if (!a || !b) return false
  return new Date(a).toDateString() === new Date(b).toDateString()
}
function formatDia(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const hoy = new Date()
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}
function formatHora(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

/* ── Scroll al fondo ── */
async function scrollToBottom() {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}

/* ── Fetch comentarios ── */
async function fetchComentarios() {
  loading.value = true
  try {
    const { data } = await axios.get(`/api/comentarios/${props.orderId}`)
    comentarios.value = data.map(c => ({ ...c, createdAt: c.created_at }))
    await scrollToBottom()
  } catch {
    comentarios.value = []
  } finally {
    loading.value = false
  }
}

/* ── Enviar mensaje ── */
async function enviar() {
  if (!nuevoMensaje.value.trim() || enviando.value) return
  enviando.value = true
  const texto = nuevoMensaje.value.trim()
  try {
    const { data } = await axios.post(`/api/comentarios/${props.orderId}`, { mensaje: texto })
    comentarios.value.push({ ...data, createdAt: data.created_at })
    nuevoMensaje.value = ''
    await scrollToBottom()
    // Re-fetch de notificaciones para que el usuario vea la notificación BD
    setTimeout(() => notifs.fetchFromDB(), 800)
  } catch {
    toast?.add({ type: 'error', message: 'Error al enviar comentario' })
  } finally {
    enviando.value = false
  }
}

/* ── Eliminar (solo admin) ── */
async function eliminarComentario(id) {
  try {
    await axios.delete(`/api/comentarios/${id}`)
    comentarios.value = comentarios.value.filter(c => c.id !== id)
  } catch {
    toast?.add({ type: 'error', message: 'Error al eliminar comentario' })
  }
}

onMounted(fetchComentarios)
watch(() => props.orderId, fetchComentarios)
</script>
