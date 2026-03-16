<template>
  <!-- ══ MOBILE TOP BAR (< lg) ══ -->
  <header class="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/[0.06]
                 flex items-center px-4 gap-3 shadow-soft">
    <button @click="drawerOpen = !drawerOpen"
      class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
      <Menu class="w-5 h-5" :stroke-width="1.75" />
    </button>

    <div class="flex items-center gap-2 flex-1">
      <img src="/icons/icon-square.svg" class="w-7 h-7 rounded-lg flex-shrink-0 object-contain" alt="Glass Caribe"/>
      <span class="font-bold text-gray-900 text-sm tracking-wide">Glass Caribe</span>
    </div>

    <!-- Mobile Chat — oculto en mobile, el bottom nav lo reemplaza -->
    <router-link to="/chat"
      class="hidden relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0">
      <MessageCircle class="w-5 h-5" :stroke-width="1.75" />
    </router-link>

    <!-- Mobile Bell -->
    <div class="relative" ref="mobileBellRef">
      <button @click="mobileBell = !mobileBell"
        class="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
        <Bell class="w-5 h-5" :stroke-width="1.75" />
        <span v-if="notifs.unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {{ notifs.unreadCount > 9 ? '9+' : notifs.unreadCount }}
        </span>
      </button>
      <Transition name="slide">
        <div v-if="mobileBell"
          class="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden z-50">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="font-semibold text-sm text-gray-900">Notificaciones</h3>
            <button v-if="notifs.unreadCount > 0" @click="notifs.markAllAsRead()"
              class="text-xs text-[#0D89CB] font-medium hover:underline">Marcar todas</button>
          </div>
          <div class="max-h-64 overflow-y-auto divide-y divide-gray-50">
            <p v-if="notifs.notifications.length === 0" class="py-8 text-center text-gray-400 text-xs">Sin notificaciones</p>
            <div v-for="n in notifs.notifications.slice(0,15)" :key="n.id"
              @click="notifs.markAsRead(n.id)"
              class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              :class="{ 'bg-blue-50/40': !n._read }">
              <span class="mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center">
                <MessageSquare v-if="n.type === 'comment'" class="w-4 h-4 text-blue-500" :stroke-width="2" />
                <RefreshCw v-else-if="n.type === 'status_change'" class="w-4 h-4 text-amber-500" :stroke-width="2" />
                <CheckCircle2 v-else-if="n.type === 'delivery_done'" class="w-4 h-4 text-emerald-500" :stroke-width="2" />
                <Bell v-else class="w-4 h-4 text-gray-400" :stroke-width="2" />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-700 leading-relaxed">{{ n.message }}</p>
                <p class="text-[11px] text-gray-400 mt-0.5">{{ formatTime(n.createdAt) }}</p>
              </div>
              <div v-if="!n._read" class="w-1.5 h-1.5 rounded-full bg-[#0D89CB] mt-2 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </header>

  <!-- ══ MOBILE DRAWER OVERLAY ══ -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="drawerOpen" class="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 lg:hidden"
        @click="drawerOpen = false">
        <aside class="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-modal flex flex-col"
          @click.stop>
          <div class="px-5 pt-6 pb-4 border-b border-black/[0.05]">
            <div class="flex items-center gap-3">
              <img src="/icons/icon-square.svg" class="w-9 h-9 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
              <p class="font-bold text-gray-900 text-base tracking-wide">Glass Caribe</p>
            </div>
          </div>
          <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <router-link v-for="tab in navTabs" :key="tab.to" :to="tab.to"
              @click="drawerOpen = false"
              class="sidebar-link relative"
              :class="isActive(tab.to) ? 'active' : ''">
              <span class="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                <LayoutGrid v-if="tab.icon === 'dashboard'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <ClipboardList v-else-if="tab.icon === 'clipboard'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <Archive v-else-if="tab.icon === 'archive'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <Truck v-else-if="tab.icon === 'truck'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <Users v-else-if="tab.icon === 'users'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <MessageCircle v-else-if="tab.icon === 'chat'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <Settings v-else-if="tab.icon === 'cog'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
                <ClipboardList v-else class="w-[18px] h-[18px]" :stroke-width="1.75" />
              </span>
              <span class="flex-1">{{ tab.label }}</span>
              <span v-if="tab.to === '/chat' && chat.unreadTotal > 0"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
                {{ chat.unreadTotal > 9 ? '9+' : chat.unreadTotal }}
              </span>
              <span v-if="tab.to === '/admin/usuarios' && pendingCount > 0"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
                {{ pendingCount > 9 ? '9+' : pendingCount }}
              </span>
            </router-link>
          </nav>
          <div class="px-4 py-4 border-t border-black/[0.05]">
            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-8 h-8 rounded-full bg-[#0D89CB] flex items-center justify-center text-white font-bold text-xs">
                {{ initials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-900 truncate">{{ auth.user?.nombre }}</p>
                <p class="text-[11px] text-gray-400 truncate">{{ roleLabel }}</p>
              </div>
            </div>
            <router-link to="/chat" @click="drawerOpen = false"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors mb-1">
              <MessageCircle class="w-4 h-4" :stroke-width="1.75" />
              Chat del equipo
              <span v-if="chat.unreadTotal > 0"
                class="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {{ chat.unreadTotal > 9 ? '9+' : chat.unreadTotal }}
              </span>
            </router-link>
            <button @click="showCambiarPass = true; drawerOpen = false"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors mb-1">
              <Lock class="w-4 h-4" :stroke-width="1.75" />
              Cambiar contraseña
            </button>
            <button v-if="pwa.showInstallOption" @click="instalarApp"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors mb-1">
              <Smartphone class="w-4 h-4" :stroke-width="1.75" />
              Instalar app
            </button>
            <button @click="handleLogout"
              class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut class="w-4 h-4" :stroke-width="1.75" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ MODAL CAMBIAR CONTRASEÑA ══ -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showCambiarPass"
        class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        @click.self="cerrarCambiarPass">
        <div class="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-4" @click.stop>
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">Cambiar contraseña</h3>
            <button @click="cerrarCambiarPass"
              class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X class="w-4 h-4" :stroke-width="2" />
            </button>
          </div>
          <!-- Form -->
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
              <input v-model="passActual" type="password" autocomplete="current-password"
                placeholder="••••••••"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D89CB]/20 focus:border-[#0D89CB] transition-all"
                @keyup.enter="guardarPassword"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
              <input v-model="passNueva" type="password" autocomplete="new-password"
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D89CB]/20 focus:border-[#0D89CB] transition-all"
                @keyup.enter="guardarPassword"/>
              <PasswordStrengthBar :password="passNueva" />
            </div>
            <p v-if="passError" class="text-xs text-red-500 font-medium">{{ passError }}</p>
          </div>
          <!-- Actions -->
          <div class="flex gap-2 pt-1">
            <button @click="cerrarCambiarPass"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button @click="guardarPassword" :disabled="guardandoPass || !passwordValida"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0D89CB] hover:bg-[#00659C] disabled:opacity-50 transition-colors">
              {{ guardandoPass ? 'Guardando…' : 'Cambiar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ══ DESKTOP SIDEBAR (≥ lg) ══ -->
  <aside class="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-black/[0.05] z-40 flex-col">

    <!-- Logo -->
    <div class="px-5 pt-6 pb-5 border-b border-black/[0.05]">
      <div class="flex items-center gap-3">
        <img src="/icons/icon-square.svg" class="w-9 h-9 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
        <p class="font-bold text-gray-900 text-base tracking-wide">Glass Caribe</p>
      </div>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <router-link v-for="tab in navTabs" :key="tab.to" :to="tab.to"
        class="sidebar-link relative"
        :class="isActive(tab.to) ? 'active' : ''">
        <span class="flex-shrink-0 flex items-center justify-center w-[18px] h-[18px]">
          <LayoutGrid    v-if="tab.icon === 'dashboard'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <ClipboardList v-else-if="tab.icon === 'clipboard'" class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <Archive       v-else-if="tab.icon === 'archive'"   class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <Truck         v-else-if="tab.icon === 'truck'"     class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <Users         v-else-if="tab.icon === 'users'"     class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <MessageCircle v-else-if="tab.icon === 'chat'"      class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <Settings      v-else-if="tab.icon === 'cog'"       class="w-[18px] h-[18px]" :stroke-width="1.75" />
          <ClipboardList v-else                               class="w-[18px] h-[18px]" :stroke-width="1.75" />
        </span>
        <span class="flex-1">{{ tab.label }}</span>
        <span v-if="tab.to === '/chat' && chat.unreadTotal > 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white leading-none">
          {{ chat.unreadTotal > 9 ? '9+' : chat.unreadTotal }}
        </span>
        <span v-if="tab.to === '/admin/usuarios' && pendingCount > 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white leading-none">
          {{ pendingCount > 9 ? '9+' : pendingCount }}
        </span>
        <!-- Left active bar -->
        <span v-if="isActive(tab.to)"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0D89CB]">
        </span>
      </router-link>
    </nav>

    <!-- Bottom: Bell + User -->
    <div class="px-3 pb-4 pt-3 border-t border-black/[0.05] space-y-1">

      <!-- Bell button -->
      <div class="relative" ref="desktopBellRef">
        <button @click="desktopBell = !desktopBell"
          class="w-full sidebar-link">
          <span class="relative w-5 h-5 flex-shrink-0 flex items-center justify-center">
            <Bell class="w-[18px] h-[18px]" :stroke-width="1.75" />
            <span v-if="notifs.unreadCount > 0"
              class="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
              {{ notifs.unreadCount > 9 ? '9+' : notifs.unreadCount }}
            </span>
          </span>
          <span>Notificaciones</span>
        </button>
        <Transition name="slide">
          <div v-if="desktopBell"
            class="absolute bottom-full left-0 mb-2 w-[300px] bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden z-50">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 class="font-semibold text-sm text-gray-900">Notificaciones</h3>
              <button v-if="notifs.unreadCount > 0" @click="notifs.markAllAsRead()"
                class="text-xs text-[#0D89CB] font-medium hover:underline">Marcar todas</button>
            </div>
            <div class="max-h-72 overflow-y-auto divide-y divide-gray-50">
              <p v-if="notifs.notifications.length === 0" class="py-8 text-center text-gray-400 text-xs">Sin notificaciones</p>
              <div v-for="n in notifs.notifications.slice(0,15)" :key="n.id"
                @click="notifs.markAsRead(n.id)"
                class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                :class="{ 'bg-blue-50/40': !n._read }">
                <span class="mt-0.5 flex-shrink-0 w-4 h-4 flex items-center justify-center">
                <MessageSquare v-if="n.type === 'comment'" class="w-4 h-4 text-blue-500" :stroke-width="2" />
                <RefreshCw v-else-if="n.type === 'status_change'" class="w-4 h-4 text-amber-500" :stroke-width="2" />
                <CheckCircle2 v-else-if="n.type === 'delivery_done'" class="w-4 h-4 text-emerald-500" :stroke-width="2" />
                <Bell v-else class="w-4 h-4 text-gray-400" :stroke-width="2" />
              </span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-700 leading-relaxed">{{ n.message }}</p>
                  <p class="text-[11px] text-gray-400 mt-0.5">{{ formatTime(n.createdAt) }}</p>
                </div>
                <div v-if="!n._read" class="w-1.5 h-1.5 rounded-full bg-[#0D89CB] mt-2 flex-shrink-0"></div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- User button -->
      <div class="relative" ref="desktopMenuRef">
        <button @click="desktopMenu = !desktopMenu"
          class="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
          <div class="w-8 h-8 rounded-full bg-[#0D89CB] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 text-left min-w-0">
            <p class="text-xs font-semibold text-gray-900 truncate leading-none">{{ auth.user?.nombre }}</p>
            <p class="text-[11px] text-gray-400 truncate leading-none mt-0.5">{{ roleLabel }}</p>
          </div>
          <svg class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/>
          </svg>
        </button>
        <Transition name="slide">
          <div v-if="desktopMenu"
            class="absolute bottom-full left-0 mb-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden z-50">
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ auth.user?.nombre }}</p>
              <p class="text-xs text-gray-500 truncate">{{ auth.user?.email }}</p>
            </div>
            <router-link to="/chat" @click="desktopMenu = false"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <MessageCircle class="w-4 h-4" :stroke-width="1.75" />
              Chat del equipo
              <span v-if="chat.unreadTotal > 0"
                class="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {{ chat.unreadTotal > 9 ? '9+' : chat.unreadTotal }}
              </span>
            </router-link>
            <button @click="showCambiarPass = true; desktopMenu = false"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Lock class="w-4 h-4" :stroke-width="1.75" />
              Cambiar contraseña
            </button>
            <button v-if="pwa.showInstallOption" @click="instalarApp"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Smartphone class="w-4 h-4" :stroke-width="1.75" />
              Instalar app
            </button>
            <button @click="handleLogout"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
              <LogOut class="w-4 h-4" :stroke-width="1.75" />
              Cerrar sesión
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </aside>

  <!-- ── Bottom Navigation (mobile only) ── -->
  <BottomNav />

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore }          from '../../stores/auth.js'
import { useNotificationsStore } from '../../stores/notifications.js'
import { useChatStore }          from '../../stores/chat.js'
import { useWebSocketStore }     from '../../stores/websocket.js'
import { usePwaStore }           from '../../stores/pwa.js'
import axios                     from 'axios'
import PasswordStrengthBar       from '../shared/PasswordStrengthBar.vue'
import BottomNav                 from '../shared/BottomNav.vue'
import {
  LayoutGrid, ClipboardList, Archive, Truck, Users, MessageCircle, Settings,
  Bell, Menu, X, Lock, Smartphone, LogOut,
  CheckCircle2, MessageSquare, RefreshCw
} from 'lucide-vue-next'

defineEmits(['toggleSidebar'])

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const notifs  = useNotificationsStore()
const chat    = useChatStore()
const wsStore = useWebSocketStore()

// ── Pendientes de aprobación ──────────────────────────────────────────────────
const pendingCount = ref(0)

async function fetchPendingCount() {
  if (auth.user?.role_id !== 1) return
  try {
    const { data } = await axios.get('/api/usuarios/pendientes')
    pendingCount.value = data.total
  } catch {}
}

const pwa   = usePwaStore()
const toast = inject('toast', { add: () => {} })

const drawerOpen    = ref(false)
const mobileBell    = ref(false)
const desktopBell   = ref(false)
const desktopMenu   = ref(false)

// ── Cambiar contraseña ──
const showCambiarPass = ref(false)
const passActual      = ref('')
const passNueva       = ref('')
const passError       = ref('')
const guardandoPass   = ref(false)

const passwordValida = computed(() => {
  const p = passNueva.value
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
})

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
  if (!passwordValida.value)
    return (passError.value = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número')
  guardandoPass.value = true
  try {
    const { default: axios } = await import('axios')
    await axios.patch('/api/auth/cambiar-password', {
      password_actual: passActual.value,
      nueva_password:  passNueva.value,
    })
    cerrarCambiarPass()
  } catch (err) {
    passError.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    guardandoPass.value = false
  }
}

const mobileBellRef  = ref(null)
const desktopBellRef = ref(null)
const desktopMenuRef = ref(null)

const navTabs = computed(() => {
  const role = auth.user?.role_id
  const dept = auth.user?.departamento
  if (role === 1) return [
    { to: '/admin',             label: 'Dashboard',   icon: 'dashboard'  },
    { to: '/admin/pedidos',     label: 'Pedidos',     icon: 'clipboard'  },
    { to: '/admin/inventario',  label: 'Inventario',  icon: 'archive'    },
    { to: '/admin/conductores', label: 'Conductores', icon: 'truck'      },
    { to: '/admin/usuarios',    label: 'Usuarios',    icon: 'users'      },
    { to: '/chat',              label: 'Chat',        icon: 'chat'       },
  ]
  if (dept === 'ventas')    return [{ to: '/ventas',    label: 'Mis Pedidos', icon: 'clipboard' }]
  if (dept === 'produccion') return [{ to: '/produccion', label: 'Producción',  icon: 'cog'       }]
  if (role === 3)            return [{ to: '/conductor', label: 'Mis Entregas', icon: 'truck'     }]
  return []
})

const roleLabel = computed(() => {
  if (auth.user?.role_id === 1) return 'Administrador'
  const dept = auth.user?.departamento
  return dept ? dept.charAt(0).toUpperCase() + dept.slice(1) : 'Colaborador'
})

const initials = computed(() =>
  (auth.user?.nombre || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

function isActive(path) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

function formatTime(ts) {
  if (!ts) return ''
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)    return 'Ahora'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return new Date(ts).toLocaleDateString('es')
}

async function handleLogout() {
  notifs.clear()
  await auth.logout()
  router.push('/login')
}

async function instalarApp() {
  drawerOpen.value  = false
  desktopMenu.value = false
  if (pwa.isIosSafari) {
    toast.add({ type: 'info', title: 'Instalar en iOS', message: 'Toca el ícono Compartir ↑ y luego "Agregar a inicio"' })
  } else {
    await pwa.install()
  }
}

function onClickOutside(e) {
  if (mobileBellRef.value  && !mobileBellRef.value.contains(e.target))  mobileBell.value  = false
  if (desktopBellRef.value && !desktopBellRef.value.contains(e.target)) desktopBell.value = false
  if (desktopMenuRef.value && !desktopMenuRef.value.contains(e.target)) desktopMenu.value = false
}
onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  fetchPendingCount()
  // Nuevo registro: incrementar badge
  wsStore.on('nuevo_registro', () => { pendingCount.value++ })
  // Activación/desactivación de usuario: refrescar count exacto
  wsStore.on('data_usuarios',  fetchPendingCount)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  wsStore.off('nuevo_registro')
  wsStore.off('data_usuarios')
})
</script>
