<template>
  <div class="relative" ref="bellRef">
    <button
      @click="open = !open"
      class="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
    >
      <Bell class="w-5 h-5" :stroke-width="1.75" />
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
            class="text-xs text-[#0D89CB] hover:text-[#C6E3F3] transition-colors"
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
            :class="{ 'bg-[#0D89CB]/10': !n._read }"
          >
            <!-- Notification type icon -->
            <span class="flex-shrink-0 mt-0.5">
              <MessageSquare v-if="n.type === 'comment'"       class="w-4 h-4 text-blue-400"    :stroke-width="1.75" />
              <RefreshCw     v-else-if="n.type === 'status_change'" class="w-4 h-4 text-amber-400"  :stroke-width="1.75" />
              <CheckCircle2  v-else-if="n.type === 'delivery_done'" class="w-4 h-4 text-emerald-400" :stroke-width="1.75" />
              <Bell          v-else                              class="w-4 h-4 text-slate-400"   :stroke-width="1.75" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-200 leading-relaxed">{{ n.message }}</p>
              <p class="text-[11px] text-slate-500 mt-0.5">{{ formatTime(n.createdAt) }}</p>
            </div>
            <div v-if="!n._read" class="w-2 h-2 rounded-full bg-[#0D89CB] mt-1.5 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-vue-next'
import { useNotificationsStore } from '../../stores/notifications.js'

const notifs  = useNotificationsStore()
const bellRef = ref(null)
const open    = ref(false)

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
