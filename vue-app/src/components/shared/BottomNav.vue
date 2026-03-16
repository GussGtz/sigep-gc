<script setup>
import { ref, computed, inject } from 'vue'
import { useRouter, useRoute }   from 'vue-router'
import { Home, ClipboardList, Truck, MessageCircle, User, Users, Archive, ChevronRight, Lock, Smartphone, LogOut, X } from 'lucide-vue-next'
import { useAuthStore }          from '../../stores/auth.js'
import { useChatStore }          from '../../stores/chat.js'
import { usePwaStore }           from '../../stores/pwa.js'
import axios                     from 'axios'
import PasswordStrengthBar       from './PasswordStrengthBar.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const chat   = useChatStore()
const pwa    = usePwaStore()
const toast  = inject('toast', { add: () => {} })

// ── Profile sheet ────────────────────────────────────────────────────────────
const profileOpen = ref(false)

// ── Password change modal ────────────────────────────────────────────────────
const showPwModal   = ref(false)
const passActual    = ref('')
const passNueva     = ref('')
const passError     = ref('')
const guardandoPass = ref(false)

const passwordValida = computed(() => {
  const p = passNueva.value
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
})

function abrirPwModal () {
  profileOpen.value = false
  showPwModal.value = true
}
function cerrarPwModal () {
  showPwModal.value = false
  passActual.value  = ''
  passNueva.value   = ''
  passError.value   = ''
}
async function guardarPassword () {
  passError.value = ''
  if (!passActual.value || !passNueva.value)
    return (passError.value = 'Completa ambos campos')
  if (!passwordValida.value)
    return (passError.value = 'Mín. 8 caracteres, 1 mayúscula y 1 número')
  guardandoPass.value = true
  try {
    await axios.patch('/api/auth/cambiar-password', {
      password_actual: passActual.value,
      nueva_password:  passNueva.value,
    })
    cerrarPwModal()
    toast.add({ type: 'success', title: '¡Listo!', message: 'Contraseña actualizada correctamente.' })
  } catch (err) {
    passError.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    guardandoPass.value = false
  }
}

// ── Logout ───────────────────────────────────────────────────────────────────
async function handleLogout () {
  profileOpen.value = false
  await auth.logout()
  router.push('/')
}

// ── PWA install ──────────────────────────────────────────────────────────────
async function instalarApp () {
  profileOpen.value = false
  await pwa.install()
}

// ── User info ────────────────────────────────────────────────────────────────
const initials = computed(() =>
  (auth.user?.nombre || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)
const userName  = computed(() => auth.user?.nombre || '')
const roleLabel = computed(() => {
  if (auth.isAdmin)        return 'Administrador'
  if (auth.isVentas)       return 'Ventas'
  if (auth.isContabilidad) return 'Contabilidad'
  if (auth.isProduccion)   return 'Producción'
  if (auth.isConductor)    return 'Conductor'
  return ''
})

// ── Nav items per role ───────────────────────────────────────────────────────
const navItems = computed(() => {
  if (auth.isAdmin) {
    return [
      { key: 'inicio',      label: 'Inicio',      to: '/admin',             icon: 'home'      },
      { key: 'pedidos',     label: 'Pedidos',     to: '/admin/pedidos',     icon: 'clipboard' },
      { key: 'conductores', label: 'Conductores', to: '/admin/conductores', icon: 'truck'     },
      { key: 'chat',        label: 'Chat',        to: '/chat',              icon: 'chat', badge: true },
      { key: 'perfil',      label: 'Perfil',      action: 'profile',        icon: 'user'      },
    ]
  }
  const deptHome = { ventas: '/ventas', contabilidad: '/contabilidad', produccion: '/produccion' }
  const homeRoute = auth.isConductor
    ? '/conductor'
    : (deptHome[auth.user?.departamento] ?? '/ventas')
  return [
    { key: 'inicio', label: 'Inicio', to: homeRoute,      icon: 'home'              },
    { key: 'chat',   label: 'Chat',   to: '/chat',         icon: 'chat', badge: true },
    { key: 'perfil', label: 'Perfil', action: 'profile',   icon: 'user'              },
  ]
})

function isActive (item) {
  if (item.action === 'profile') return profileOpen.value
  if (!item.to) return false
  if (item.to === '/admin') return route.path === '/admin'
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

function handleTap (item) {
  if (item.action === 'profile') {
    profileOpen.value = !profileOpen.value
  } else if (item.to) {
    profileOpen.value = false
    router.push(item.to)
  }
}

function navTo (path) {
  profileOpen.value = false
  router.push(path)
}
</script>

<template>
  <!-- ─────────────────────────────────────────────────────────────────────────
       BOTTOM NAV BAR — solo mobile (< 768px)
  ──────────────────────────────────────────────────────────────────────────── -->
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur-xl border-t border-gray-100"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex h-[58px]">
      <button
        v-for="item in navItems"
        :key="item.key"
        @click="handleTap(item)"
        class="flex-1 relative flex flex-col items-center justify-center gap-0.5 touch-manipulation select-none transition-colors"
        :class="isActive(item) ? 'text-[#0D89CB]' : 'text-gray-400 active:text-gray-600'"
      >
        <!-- Active pill indicator at top -->
        <span
          class="absolute top-0 inset-x-0 flex justify-center pointer-events-none"
        >
          <span
            class="h-[3px] rounded-full bg-[#0D89CB] transition-all duration-200"
            :class="isActive(item) ? 'w-8 opacity-100' : 'w-0 opacity-0'"
          ></span>
        </span>

        <!-- Icon wrapper with subtle active bg -->
        <div
          class="relative p-1.5 rounded-xl transition-colors"
          :class="isActive(item) ? 'bg-[#0D89CB]/[0.07]' : ''"
        >
          <!-- HOME -->
          <Home v-if="item.icon === 'home'" class="w-[22px] h-[22px]" :stroke-width="1.75" />

          <!-- CLIPBOARD (Pedidos) -->
          <ClipboardList v-else-if="item.icon === 'clipboard'" class="w-[22px] h-[22px]" :stroke-width="1.75" />

          <!-- TRUCK (Conductores) -->
          <Truck v-else-if="item.icon === 'truck'" class="w-[22px] h-[22px]" :stroke-width="1.75" />

          <!-- CHAT -->
          <MessageCircle v-else-if="item.icon === 'chat'" class="w-[22px] h-[22px]" :stroke-width="1.75" />

          <!-- USER (Perfil) -->
          <User v-else-if="item.icon === 'user'" class="w-[22px] h-[22px]" :stroke-width="1.75" />

          <!-- Unread badge (chat) -->
          <span
            v-if="item.badge && chat.unreadTotal > 0"
            class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-[3px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
          >
            {{ chat.unreadTotal > 9 ? '9+' : chat.unreadTotal }}
          </span>
        </div>

        <!-- Label -->
        <span class="text-[10px] font-medium leading-none tracking-wide">{{ item.label }}</span>
      </button>
    </div>
  </nav>

  <!-- ─────────────────────────────────────────────────────────────────────────
       PROFILE SHEET + OVERLAY — Teleport to body
  ──────────────────────────────────────────────────────────────────────────── -->
  <Teleport to="body">

    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="profileOpen"
        class="fixed inset-0 bg-black/40 z-[68] md:hidden"
        @click="profileOpen = false"
      ></div>
    </Transition>

    <!-- Sheet -->
    <Transition name="bn-slide-up">
      <div
        v-if="profileOpen"
        class="fixed bottom-0 inset-x-0 z-[69] md:hidden bg-white rounded-t-[28px] shadow-2xl max-w-lg mx-auto overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- Handle bar -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-9 h-1 bg-gray-200 rounded-full"></div>
        </div>

        <!-- User info card -->
        <div class="flex items-center gap-3.5 mx-4 mb-4 p-3.5 bg-[#F8F8F6] rounded-2xl">
          <div class="w-12 h-12 rounded-2xl bg-[#0D89CB] flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
            {{ initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-900 truncate text-[15px] leading-tight">{{ userName }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ roleLabel }}</p>
          </div>
        </div>

        <!-- Admin: extra navigation links -->
        <template v-if="auth.isAdmin">
          <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 mb-1.5">Navegación</p>
          <div class="mx-3 mb-3 space-y-0.5">
            <button
              @click="navTo('/admin/usuarios')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700"
            >
              <Users class="w-5 h-5 text-gray-400 flex-shrink-0" :stroke-width="1.75" />
              <span class="text-sm font-medium">Usuarios</span>
              <ChevronRight class="w-4 h-4 text-gray-300 ml-auto" :stroke-width="2" />
            </button>
            <button
              @click="navTo('/admin/inventario')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700"
            >
              <Archive class="w-5 h-5 text-gray-400 flex-shrink-0" :stroke-width="1.75" />
              <span class="text-sm font-medium">Inventario</span>
              <ChevronRight class="w-4 h-4 text-gray-300 ml-auto" :stroke-width="2" />
            </button>
          </div>
          <div class="mx-4 h-px bg-gray-100 mb-3"></div>
        </template>

        <!-- Account options -->
        <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 mb-1.5">Cuenta</p>
        <div class="mx-3 mb-3 space-y-0.5">
          <button
            @click="abrirPwModal"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700"
          >
            <Lock class="w-5 h-5 text-gray-400 flex-shrink-0" :stroke-width="1.75" />
            <span class="text-sm font-medium">Cambiar contraseña</span>
          </button>
          <button
            v-if="pwa.showInstallOption"
            @click="instalarApp"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-gray-700"
          >
            <Smartphone class="w-5 h-5 text-gray-400 flex-shrink-0" :stroke-width="1.75" />
            <span class="text-sm font-medium">Instalar app</span>
          </button>
        </div>

        <!-- Logout -->
        <div class="mx-3 mb-4">
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            <LogOut class="w-5 h-5 flex-shrink-0" :stroke-width="1.75" />
            <span class="text-sm font-semibold">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- ─── Password Change Modal ─────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="showPwModal"
        class="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 md:hidden"
        @click.self="cerrarPwModal"
      >
        <div class="bg-white w-full rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div>
              <h3 class="font-semibold text-gray-900">Cambiar contraseña</h3>
              <p class="text-xs text-gray-400 mt-0.5">Actualiza tu contraseña de acceso</p>
            </div>
            <button
              @click="cerrarPwModal"
              class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X class="w-5 h-5" :stroke-width="2" />
            </button>
          </div>

          <!-- Form -->
          <div class="px-5 py-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
              <input
                v-model="passActual"
                type="password"
                autocomplete="current-password"
                placeholder="Tu contraseña actual"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D89CB]/20 focus:border-[#0D89CB] transition-all"
                @keyup.enter="guardarPassword"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
              <input
                v-model="passNueva"
                type="password"
                autocomplete="new-password"
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D89CB]/20 focus:border-[#0D89CB] transition-all"
                @keyup.enter="guardarPassword"
              />
              <PasswordStrengthBar :password="passNueva" />
            </div>
            <p v-if="passError" class="text-xs text-red-500 font-medium">{{ passError }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 px-5 pb-6 pt-1">
            <button
              @click="cerrarPwModal"
              class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="guardarPassword"
              :disabled="guardandoPass || !passwordValida"
              class="flex-1 px-4 py-2.5 rounded-xl bg-[#0D89CB] text-white text-sm font-semibold hover:bg-[#00659C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ guardandoPass ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </Teleport>
</template>

