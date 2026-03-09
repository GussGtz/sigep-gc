<template>
  <div class="relative" ref="bellRef">
    <button
      @click="open = !open"
      class="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      <Transition name="fade">
        <span
          v-if="notifs.unreadCount > 0"
          class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
        >{{ notifs.unreadCount > 9 ? '9+' : notifs.unreadCount }}</span>
      </Transition>
    </button>

    <Transition name="slide">
      <div
        v-if="open"
        class="absolute right-0 top-full mt-1 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 class="font-semibold text-sm text-slate-100">Notificaciones</h3>
          <button
            v-if="notifs.unreadCount > 0"
            @click="notifs.markAllAsRead()"
            class="text-xs text-brand-400 hover:text-brand-300"
          >Marcar todas leídas</button>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <div v-if="notifs.notifications.length === 0" class="py-8 text-center text-slate-500 text-sm">
            Sin notificaciones
          </div>
          <div
            v-for="n in notifs.notifications.slice(0, 20)"
            :key="n.id"
            @click="notifs.markAsRead(n.id)"
            class="flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer transition-colors"
            :class="{ 'bg-brand-900/20': !n._read }"
          >
            <span class="flex-shrink-0 mt-0.5" v-html="typeIcon(n.type)"></span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-200 leading-relaxed">{{ n.message }}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ formatTime(n.createdAt) }}</p>
            </div>
            <div v-if="!n._read" class="w-2 h-2 rounded-full bg-brand-400 mt-1.5 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '../../stores/notifications.js'

const notifs  = useNotificationsStore()
const bellRef = ref(null)
const open    = ref(false)

function typeIcon(type) {
  const icons = {
    comment:       `<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
    status_change: `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`,
    delivery_done: `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  }
  return icons[type] || `<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`
}

function formatTime(ts) {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)    return 'Ahora mismo'
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('es')
}

function onClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>
