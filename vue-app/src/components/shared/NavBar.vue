<template>
  <nav class="fixed top-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700/50">
    <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

      <!-- Logo + título -->
      <div class="flex items-center gap-3 min-w-0">
        <button v-if="showSidebar" @click="$emit('toggleSidebar')" class="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white lg:hidden">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div class="flex items-center gap-2">
          <img src="/icons/logo.jpg" class="w-7 h-7 rounded-lg flex-shrink-0 object-contain" alt="Glass Caribe"/>
          <span class="font-bold text-white text-sm hidden sm:block tracking-wide">Glass Caribe</span>
        </div>
        <span v-if="title" class="text-slate-400 text-sm truncate hidden md:block">/ {{ title }}</span>
      </div>

      <!-- Centro: navegación principal (desktop) -->
      <div class="hidden lg:flex items-center gap-1">
        <slot name="nav" />
      </div>

      <!-- Derecha: notificaciones + usuario -->
      <div class="flex items-center gap-2">
        <NotificationBell />

        <div class="relative" ref="menuRef">
          <button
            @click="menuOpen = !menuOpen"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <div class="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
              {{ initials }}
            </div>
            <div class="hidden sm:block text-left">
              <p class="text-xs font-medium text-slate-100 leading-none">{{ auth.user?.nombre }}</p>
              <p class="text-xs text-slate-400 leading-none mt-0.5">{{ auth.rolLabel }}</p>
            </div>
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <Transition name="slide">
            <div v-if="menuOpen" class="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div class="px-4 py-3 border-b border-slate-700">
                <p class="text-sm font-semibold text-slate-100 truncate">{{ auth.user?.nombre }}</p>
                <p class="text-xs text-slate-400 truncate">{{ auth.user?.email }}</p>
              </div>
              <button @click="handleLogout" class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth.js'
import { useNotificationsStore } from '../../stores/notifications.js'
import NotificationBell from './NotificationBell.vue'

defineProps({
  title:       { type: String,  default: '' },
  showSidebar: { type: Boolean, default: false }
})
defineEmits(['toggleSidebar'])

const auth    = useAuthStore()
const notifs  = useNotificationsStore()
const router  = useRouter()
const menuRef = ref(null)
const menuOpen = ref(false)

const initials = computed(() => {
  const name = auth.user?.nombre || ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

async function handleLogout() {
  notifs.clear()
  await auth.logout()
  router.push('/login')
}

function onClickOutside(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) menuOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
