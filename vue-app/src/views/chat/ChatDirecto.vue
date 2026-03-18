<template>

  <!-- ══════════════════════════════════════════
       CONDUCTOR: Layout móvil a pantalla completa
  ══════════════════════════════════════════ -->
  <div v-if="usaMobileLayout" class="flex flex-col h-screen bg-[#F8F8F6]">

    <!-- Mobile header -->
    <header class="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/[0.06] flex items-center px-4 gap-3 shadow-soft">
      <button
        @click="volverAtras()"
        class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
        <ChevronLeft class="w-5 h-5" :stroke-width="2" />
      </button>
      <span class="font-serif font-bold text-gray-900 flex-1 truncate">
        {{ contactoActivo ? contactoActivo.nombre : 'Mensajes' }}
      </span>
      <!-- Badge no leídos (lista de contactos) -->
      <span v-if="!contactoActivo && chat.unreadTotal > 0"
        class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500 text-white flex-shrink-0">
        {{ chat.unreadTotal > 99 ? '99+' : chat.unreadTotal }}
      </span>
      <!-- Vaciar este chat (conversación activa) -->
      <button v-if="contactoActivo"
        @click="showConfirmVaciarChat = true"
        class="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        title="Vaciar conversación">
        <Trash2 class="w-[18px] h-[18px]" :stroke-width="2" />
      </button>
      <!-- Vaciar todos los chats (lista de contactos) -->
      <button v-if="!contactoActivo && chat.contactos.length > 0"
        @click="showConfirmVaciarTodo = true"
        class="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        title="Vaciar todo el historial">
        <Trash2 class="w-[18px] h-[18px]" :stroke-width="2" />
      </button>
    </header>

    <div class="flex-1 pt-header flex flex-col overflow-hidden">

      <!-- ── Vista: Lista de contactos ── -->
      <template v-if="!contactoActivo">
        <!-- Search -->
        <div class="px-4 py-3 bg-white border-b border-gray-100">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" :stroke-width="2" />
            <input v-model="busqueda" type="text" placeholder="Buscar contacto…"
              class="w-full pl-8 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200
                     rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D89CB]/20
                     placeholder-gray-400"/>
          </div>
        </div>
        <!-- Contacts list -->
        <div class="flex-1 overflow-y-auto pb-nav">
          <div v-if="contactosFiltrados.length === 0"
            class="py-10 text-center text-gray-400 text-sm">Sin resultados</div>
          <button
            v-for="c in contactosFiltrados" :key="c.id"
            @click="abrirConversacion(c)"
            class="w-full flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-50
                   text-left active:bg-gray-50 transition-colors">
            <div class="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                 :class="avatarColor(c.role_id)">
              {{ iniciales(c.nombre) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ c.nombre }}</p>
                <p v-if="c.ultimo_at" class="text-[11px] text-gray-400 flex-shrink-0 ml-1">
                  {{ formatTime(c.ultimo_at) }}
                </p>
              </div>
              <p class="text-xs text-gray-500 truncate mt-0.5">
                {{ c.ultimo_mensaje || rolLabel(c) }}
              </p>
            </div>
            <span v-if="c.unread_count > 0"
              class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold
                     flex items-center justify-center">
              {{ c.unread_count > 9 ? '9+' : c.unread_count }}
            </span>
          </button>
        </div>
      </template>

      <!-- ── Vista: Conversación ── -->
      <template v-else>
        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <template v-if="mensajesActuales.length === 0">
            <p class="text-center text-gray-400 text-sm py-8">
              Sin mensajes aún. ¡Inicia la conversación!
            </p>
          </template>
          <template v-for="(msg, i) in mensajesActuales" :key="msg.id ?? i">
            <div v-if="mostrarSeparador(msg, i)" class="flex items-center gap-3 py-1">
              <div class="flex-1 h-px bg-gray-200"></div>
              <span class="text-[11px] font-semibold text-gray-400 flex-shrink-0">
                {{ fechaLabel(msg.created_at) }}
              </span>
              <div class="flex-1 h-px bg-gray-200"></div>
            </div>
            <div class="flex gap-2" :class="esPropio(msg) ? 'flex-row-reverse' : 'flex-row'">
              <div v-if="!esPropio(msg)"
                class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-auto"
                :class="avatarColor(msg.de_role_id || contactoActivo.role_id)">
                {{ iniciales(msg.de_nombre || contactoActivo.nombre) }}
              </div>
              <div class="max-w-[75%]">
                <div class="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  :class="esPropio(msg)
                    ? 'bg-[#0D89CB] text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 border border-gray-100 rounded-tl-sm shadow-soft'">
                  {{ msg.mensaje }}
                </div>
                <p class="text-[10px] text-gray-400 mt-1"
                   :class="esPropio(msg) ? 'text-right' : 'text-left'">
                  {{ formatHour(msg.created_at) }}
                </p>
              </div>
            </div>
          </template>
        </div>
        <!-- Input -->
        <div class="px-4 pt-3 pb-input-bar bg-white border-t border-gray-200">
          <div class="flex items-end gap-2">
            <textarea
              v-model="texto"
              ref="textareaRef"
              rows="1"
              placeholder="Escribe un mensaje…"
              @keydown.enter.exact.prevent="enviar"
              @keydown.enter.shift.exact="texto += '\n'"
              @input="autoResize"
              class="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-gray-900/20 bg-gray-50
                     placeholder-gray-400 leading-relaxed max-h-32 overflow-y-auto"
            />
            <button @click="enviar"
              :disabled="!texto.trim()"
              class="flex-shrink-0 w-10 h-10 rounded-xl bg-[#0D89CB] text-white flex items-center justify-center
                     hover:bg-[#00659C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm">
              <Send class="w-4 h-4" :stroke-width="2" />
            </button>
          </div>
        </div>
      </template>

    </div>

    <!-- Bottom navigation — solo visible en lista de contactos -->
    <BottomNav v-if="!contactoActivo" />

    <!-- ══ CONFIRM: Vaciar este chat ══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmVaciarChat"
          class="fixed inset-0 bg-black/40 z-[80] flex items-end sm:items-center justify-center p-4"
          @mousedown.self="showConfirmVaciarChat = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle class="w-7 h-7 text-red-500" :stroke-width="1.75" />
            </div>
            <h3 class="font-bold text-gray-900 text-lg mb-1">Vaciar conversación</h3>
            <p class="text-sm text-gray-500 mb-6">
              Se eliminarán todos los mensajes con
              <strong class="text-gray-800">{{ contactoActivo?.nombre }}</strong>.
              Esta acción no puede deshacerse.
            </p>
            <div class="flex gap-3">
              <button @click="showConfirmVaciarChat = false"
                class="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="vaciarEsteChat"
                class="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors">
                Vaciar chat
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRM: Vaciar todo el historial ══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showConfirmVaciarTodo"
          class="fixed inset-0 bg-black/40 z-[80] flex items-end sm:items-center justify-center p-4"
          @mousedown.self="showConfirmVaciarTodo = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 class="w-7 h-7 text-red-500" :stroke-width="1.75" />
            </div>
            <h3 class="font-bold text-gray-900 text-lg mb-1">Vaciar todo el historial</h3>
            <p class="text-sm text-gray-500 mb-6">
              Se eliminarán <strong class="text-gray-800">todos tus mensajes</strong> enviados y recibidos con todos los contactos. Esta acción no puede deshacerse.
            </p>
            <div class="flex gap-3">
              <button @click="showConfirmVaciarTodo = false"
                class="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="vaciarTodoElChat"
                class="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 transition-colors">
                Vaciar todo
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>


</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, inject } from 'vue'
import { ChevronLeft, Trash2, Search, Send, MessageCircle } from 'lucide-vue-next'
import { useRouter }           from 'vue-router'
import { useAuthStore }        from '../../stores/auth.js'
import { useChatStore }        from '../../stores/chat.js'
import { useWebSocketStore }   from '../../stores/websocket.js'
import { fuzzyFilter }         from '../../utils/fuzzy.js'
import BottomNav               from '../../components/shared/BottomNav.vue'

const router  = useRouter()
const auth    = useAuthStore()
const chat    = useChatStore()
const wsStore = useWebSocketStore()
const toast   = inject('toast', { add: () => {} })

// Todos los roles usan el layout PWA mobile
const usaMobileLayout = computed(() => true)

function volverAtras() {
  if (contactoActivo.value) {
    contactoActivo.value = null
  } else if (auth.user?.role_id === 1) {
    router.push('/admin')
  } else if (auth.user?.role_id === 3) {
    router.push('/conductor')
  } else if (auth.user?.departamento === 'ventas') {
    router.push('/ventas')
  } else if (auth.user?.departamento === 'produccion') {
    router.push('/produccion')
  } else if (auth.user?.departamento === 'contabilidad') {
    router.push('/contabilidad')
  } else {
    router.push('/')
  }
}

const busqueda          = ref('')
const texto             = ref('')
const messagesContainer = ref(null)
const textareaRef       = ref(null)
const contactoActivo    = ref(null)

// ── Contactos filtrados por fuzzy ──────────────────────────────────────────
const contactosFiltrados = computed(() =>
  fuzzyFilter(chat.contactos, busqueda.value, ['nombre', 'email'])
)

// ── Mensajes de la conversación activa ────────────────────────────────────
const mensajesActuales = computed(() => {
  if (!contactoActivo.value) return []
  return chat.conversaciones[contactoActivo.value.id] || []
})

// ── Auto-scroll al último mensaje ─────────────────────────────────────────
watch(mensajesActuales, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

function scrollToBottom() {
  const el = messagesContainer.value
  if (el) el.scrollTop = el.scrollHeight
}

// ── Abrir conversación ─────────────────────────────────────────────────────
async function abrirConversacion(contacto) {
  contactoActivo.value = contacto
  await chat.fetchConversacion(contacto.id)
  await nextTick()
  scrollToBottom()
}

// ── Enviar mensaje ─────────────────────────────────────────────────────────
function enviar() {
  if (!texto.value.trim() || !contactoActivo.value) return
  chat.enviarMensaje(wsStore, contactoActivo.value.id, texto.value)
  texto.value = ''
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  })
}

// ── Auto-resize textarea ────────────────────────────────────────────────────
function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
}

// ── Helpers visuales ───────────────────────────────────────────────────────
function esPropio(msg) {
  return msg.de_usuario_id === auth.user?.id
}

function iniciales(nombre) {
  return (nombre || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function avatarColor(roleId) {
  return {
    1: 'bg-gray-900',
    2: 'bg-blue-600',
    3: 'bg-emerald-600'
  }[roleId] || 'bg-gray-400'
}

function rolLabel(c) {
  if (c.role_id === 1) return 'Administrador'
  if (c.departamento) return c.departamento.charAt(0).toUpperCase() + c.departamento.slice(1)
  if (c.role_id === 3) return 'Conductor'
  return 'Colaborador'
}

function formatTime(ts) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)    return 'ahora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(ts).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function formatHour(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

function fechaLabel(ts) {
  if (!ts) return ''
  const d    = new Date(ts)
  const hoy  = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (d.toDateString() === hoy.toDateString())  return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es', { day: '2-digit', month: 'long' })
}

function mostrarSeparador(msg, index) {
  if (index === 0) return true
  const prev = mensajesActuales.value[index - 1]
  if (!prev) return false
  return new Date(msg.created_at).toDateString() !== new Date(prev.created_at).toDateString()
}

// ── Vaciar conversaciones ──────────────────────────────────────────────────
const showConfirmVaciarChat = ref(false)
const showConfirmVaciarTodo = ref(false)

async function vaciarEsteChat() {
  if (!contactoActivo.value) return
  try {
    await chat.limpiarConversacion(contactoActivo.value.id)
    showConfirmVaciarChat.value = false
    toast.add({ type: 'success', message: 'Conversación eliminada' })
  } catch {
    showConfirmVaciarChat.value = false
    toast.add({ type: 'error', message: 'Error al limpiar la conversación' })
  }
}

async function vaciarTodoElChat() {
  try {
    await chat.limpiarTodas()
    showConfirmVaciarTodo.value = false
    toast.add({ type: 'success', title: 'Mensajes eliminados', message: 'Se eliminó todo el historial de mensajes.' })
  } catch {
    showConfirmVaciarTodo.value = false
    toast.add({ type: 'error', message: 'Error al eliminar el historial' })
  }
}

// ── Montar: cargar contactos ────────────────────────────────────────────────
onMounted(() => {
  chat.fetchContactos()
})
</script>

