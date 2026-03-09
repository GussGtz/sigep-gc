<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="modal-overlay" @mousedown.self="$emit('update:modelValue', false)">
        <div class="modal-content w-full max-w-3xl" @click.stop>

          <!-- ── Header ── -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 class="font-serif text-xl font-bold text-gray-900">Pedido #{{ pedido?.numero_pedido }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">
                Creado el {{ formatDate(pedido?.fecha_creacion) }}
                <span v-if="pedido?.creado_por_nombre"> · por {{ pedido.creado_por_nombre }}</span>
              </p>
            </div>
            <button @click="$emit('update:modelValue', false)"
              class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- ── Tabs ── -->
          <div class="flex border-b border-gray-100 px-2">
            <button
              v-for="tab in tabs" :key="tab.id"
              @click="activeTab = tab.id"
              class="px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px"
              :class="activeTab === tab.id
                ? 'border-[#1B3A5C] text-[#1B3A5C]'
                : 'border-transparent text-gray-400 hover:text-gray-700'"
            >{{ tab.label }}</button>
          </div>

          <!-- ══ Tab: Detalles ══ -->
          <div v-if="activeTab === 'detalles'" class="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="label">Número de Pedido</p>
                <p class="text-gray-900 font-semibold text-sm">{{ pedido?.numero_pedido }}</p>
              </div>
              <div>
                <p class="label">Fecha de Entrega</p>
                <div class="flex items-center gap-2">
                  <p class="text-gray-900 font-semibold text-sm">{{ formatDate(pedido?.fecha_entrega) }}</p>
                  <span v-if="pedido?.retrasado"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 leading-none">
                    Atrasado
                  </span>
                </div>
              </div>
            </div>

            <!-- Info card -->
            <div v-if="pedido?.prioridad === 'urgente' || pedido?.cliente_nombre || pedido?.metros_cuadrados || pedido?.especificaciones || pedido?.direccion_entrega || pedido?.merma_m2 != null"
              class="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
              <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Información del pedido</h3>

              <div v-if="pedido?.prioridad === 'urgente'" class="flex items-center gap-3">
                <span class="label w-24">Prioridad</span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>
                  Urgente
                </span>
              </div>
              <div v-if="pedido?.cliente_nombre" class="flex items-start gap-3">
                <span class="label w-24 pt-0.5">Cliente</span>
                <p class="text-gray-800 text-sm font-medium flex-1">{{ pedido.cliente_nombre }}</p>
              </div>
              <div v-if="pedido?.direccion_entrega" class="flex items-start gap-3">
                <span class="label w-24 pt-0.5">Dirección</span>
                <p class="text-gray-700 text-sm flex-1">{{ pedido.direccion_entrega }}</p>
              </div>
              <div v-if="pedido?.alto || pedido?.metros_cuadrados" class="flex items-center gap-3">
                <span class="label w-24">Medidas</span>
                <div class="flex items-center gap-2 flex-wrap">
                  <span v-if="pedido?.alto && pedido?.ancho" class="text-gray-800 text-sm">
                    {{ parseFloat(pedido.alto).toFixed(2) }} m × {{ parseFloat(pedido.ancho).toFixed(2) }} m
                  </span>
                  <span v-if="pedido?.cantidad > 1" class="text-gray-500 text-xs">× {{ pedido.cantidad }} pzs</span>
                  <span v-if="pedido?.metros_cuadrados"
                    class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {{ parseFloat(pedido.metros_cuadrados).toFixed(2) }} m²
                  </span>
                </div>
              </div>
              <div v-if="pedido?.especificaciones" class="flex items-start gap-3">
                <span class="label w-24 pt-0.5">Specs</span>
                <p class="text-gray-600 text-sm flex-1 italic">{{ pedido.especificaciones }}</p>
              </div>
              <div v-if="pedido?.merma_m2 != null" class="flex items-start gap-3">
                <span class="label w-24 pt-0.5">Merma</span>
                <div class="flex-1">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    {{ pedido.merma_m2 }} m²
                  </span>
                  <p v-if="pedido?.merma_descripcion" class="text-gray-500 text-xs mt-1 italic">{{ pedido.merma_descripcion }}</p>
                </div>
              </div>
            </div>

            <div class="divider"/>

            <!-- Estado por área -->
            <h3 class="text-sm font-bold text-gray-700 uppercase tracking-widest">Estado por Área</h3>
            <div class="space-y-3">
              <div v-for="area in pedido?.areas" :key="area.area"
                class="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-100">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold text-gray-800 capitalize">{{ areaLabel(area.area) }}</span>
                  <StatusBadge :status="area.estatus" />
                </div>
                <div v-if="area.comentarios"
                  class="text-xs text-gray-500 bg-white rounded-xl px-3 py-2 border border-gray-100">
                  {{ area.comentarios }}
                </div>
                <div v-if="puedeActualizarArea(area.area)" class="flex gap-2">
                  <select v-model="localEstatus[area.area]" class="input-field text-xs flex-1">
                    <option value="pendiente">Pendiente</option>
                    <option value="en proceso">En Proceso</option>
                    <template v-if="area.area === 'produccion'">
                      <option value="en corte">En Corte</option>
                      <option value="pulido">Pulido</option>
                    </template>
                    <option value="completado">Completado</option>
                  </select>
                  <input v-model="localNota[area.area]" type="text"
                    placeholder="Nota (opcional)" class="input-field text-xs flex-1"/>
                  <button @click="updateArea(area.area)" :disabled="updating[area.area]"
                    class="btn-primary text-xs px-3 py-2 whitespace-nowrap">
                    {{ updating[area.area] ? '...' : 'Guardar' }}
                  </button>
                </div>
                <p v-if="area.fecha_actualizacion" class="text-[11px] text-gray-400">
                  Actualizado: {{ area.fecha_actualizacion }}
                </p>
              </div>
            </div>
          </div>

          <!-- ══ Tab: Comentarios ══ -->
          <div v-if="activeTab === 'comentarios'" class="h-[60vh]">
            <ComentariosPanel :orderId="pedido?.id" :orderNumber="pedido?.numero_pedido"/>
          </div>

          <!-- ══ Tab: Timeline ══ -->
          <div v-if="activeTab === 'timeline'" class="p-6 overflow-y-auto max-h-[60vh]">
            <div v-if="timeline.length === 0" class="text-center text-gray-400 py-8 text-sm">Sin eventos registrados</div>
            <div v-else class="space-y-0">
              <div v-for="(event, i) in timeline" :key="i" class="flex gap-3">
                <div class="flex flex-col items-center">
                  <div class="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" :class="event.color"></div>
                  <div v-if="i < timeline.length - 1" class="w-px flex-1 bg-gray-200 my-1.5"></div>
                </div>
                <div class="pb-4 min-w-0">
                  <p class="text-sm font-semibold text-gray-800">{{ event.title }}</p>
                  <p class="text-xs text-gray-400">{{ event.time }}</p>
                  <p v-if="event.nota" class="text-xs text-gray-500 mt-0.5 italic">{{ event.nota }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Footer (admin) ── -->
          <div v-if="isAdmin" class="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
            <button @click="$emit('delete', pedido?.id)" class="btn-danger text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Eliminar pedido
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useAuthStore }          from '../../stores/auth.js'
import { usePedidosStore }       from '../../stores/pedidos.js'
import { useNotificationsStore } from '../../stores/notifications.js'
import StatusBadge      from './StatusBadge.vue'
import ComentariosPanel from './ComentariosPanel.vue'

const props = defineProps({
  modelValue: Boolean,
  pedido:     Object
})
const emit = defineEmits(['update:modelValue', 'delete', 'updated'])

const auth    = useAuthStore()
const pedidos = usePedidosStore()
const notifs  = useNotificationsStore()
const toast   = inject('toast', { add: () => {} })

const activeTab    = ref('detalles')
const localEstatus = ref({})
const localNota    = ref({})
const updating     = ref({})

const tabs = [
  { id: 'detalles',    label: 'Detalles'  },
  { id: 'comentarios', label: 'Chat'      },
  { id: 'timeline',    label: 'Historial' }
]

const isAdmin = computed(() => auth.isAdmin)

/* ── ¿Puede actualizar esta área específica? ──
   Admin → todas las áreas
   Colaborador → SOLO su propia área (departamento)
   Conductor   → ninguna
─────────────────────────────────────────── */
function puedeActualizarArea(area) {
  if (!auth.isAuthenticated || auth.isConductor) return false
  if (auth.isAdmin) return true
  return auth.user?.departamento === area
}

/* ── Sincronizar estado local al abrir el modal ── */
watch(() => props.pedido, (p) => {
  if (!p) return
  localEstatus.value = {}
  localNota.value    = {}
  p.areas?.forEach(a => {
    localEstatus.value[a.area] = a.estatus
    localNota.value[a.area]    = a.comentarios || ''
  })
}, { immediate: true })

/* ── Reset de tab al cerrar ── */
watch(() => props.modelValue, (v) => {
  if (!v) setTimeout(() => { activeTab.value = 'detalles' }, 300)
})

/* ── Timeline desde los datos del pedido ── */
const timeline = computed(() => {
  if (!props.pedido) return []
  const events = []
  events.push({
    title: 'Pedido creado',
    time:  formatDate(props.pedido.fecha_creacion),
    color: 'bg-[#1B3A5C]'
  })
  props.pedido.areas?.forEach(a => {
    if (a.estatus !== 'pendiente') {
      events.push({
        title: `${areaLabel(a.area)} → ${estatusLabel(a.estatus)}`,
        time:  a.fecha_actualizacion || '—',
        nota:  a.comentarios || null,
        color: a.estatus === 'completado' ? 'bg-emerald-500' : 'bg-amber-500'
      })
    }
  })
  return events
})

function areaLabel(area) {
  return { ventas: 'Ventas', contabilidad: 'Contabilidad', produccion: 'Producción' }[area] || area
}
function estatusLabel(est) {
  return { pendiente: 'Pendiente', 'en proceso': 'En Proceso', completado: 'Completado' }[est] || est
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Actualizar estado de área ── */
async function updateArea(area) {
  if (updating.value[area]) return
  updating.value[area] = true
  try {
    await pedidos.actualizarEstatus(props.pedido.id, area, localEstatus.value[area], localNota.value[area])

    // Notificación optimista local + re-fetch de BD
    const msg = `Pedido #${props.pedido.numero_pedido}: ${areaLabel(area)} → ${estatusLabel(localEstatus.value[area])}`
    notifs.create({ type: 'status_change', orderId: String(props.pedido.id), orderNumber: props.pedido.numero_pedido, message: msg })
    setTimeout(() => notifs.fetchFromDB(), 800)

    toast.add?.({ type: 'success', message: 'Estado actualizado' })
    emit('updated')
  } catch (e) {
    toast.add?.({ type: 'error', message: e.response?.data?.message || 'Error al actualizar' })
  } finally {
    updating.value[area] = false
  }
}
</script>
