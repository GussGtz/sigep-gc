<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-14 lg:pt-0 lg:ml-60 page-enter">
      <div class="max-w-5xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Encabezado ── -->
        <div>
          <h1 class="font-serif text-2xl font-bold text-gray-900">Cola de Producción</h1>
          <p class="text-gray-400 text-sm mt-0.5">Bienvenido, {{ auth.user?.nombre }}</p>
        </div>

        <!-- ── Filtros de cola ── -->
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="f in filtros" :key="f.value"
            @click="filtroActivo = f.value"
            class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            :class="filtroActivo === f.value
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'"
          >
            {{ f.label }}
            <span v-if="f.count !== undefined" class="ml-1 font-bold">{{ f.count }}</span>
          </button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="pedidosStore.loading" class="text-center py-12 text-gray-400">Cargando...</div>

        <!-- ── Lista de pedidos ── -->
        <div v-else class="space-y-3">
          <div
            v-for="p in pedidosFiltrados"
            :key="p.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-gray-300 transition-colors"
          >
            <!-- Cabecera -->
            <div class="flex items-start justify-between gap-3 mb-3">
              <div>
                <div class="flex items-center gap-2">
                  <p class="font-bold text-gray-900">#{{ p.numero_pedido }}</p>
                  <span v-if="p.prioridad === 'urgente'"
                    class="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>Urgente</span>
                </div>
                <p class="text-xs text-gray-500 mt-0.5">
                  Entrega: {{ formatDate(p.fecha_entrega) }}
                  <span v-if="p.metros_cuadrados" class="ml-2 text-gray-400">· {{ p.metros_cuadrados }} m²</span>
                </p>
              </div>
              <StatusBadge :status="getProduccion(p)" />
            </div>

            <!-- Estado de todas las áreas -->
            <div class="flex gap-3 flex-wrap mb-4">
              <div v-for="a in p.areas" :key="a.area" class="flex items-center gap-1.5">
                <span class="text-xs text-gray-400 capitalize">{{ areaLabel(a.area) }}:</span>
                <StatusBadge :status="a.estatus" />
              </div>
            </div>

            <!-- Nota de ventas (si existe) -->
            <div v-if="getVentasNota(p)" class="mb-4 flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-blue-700">
              <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span><span class="font-semibold">Ventas:</span> {{ getVentasNota(p) }}</span>
            </div>

            <!-- Merma registrada (si existe) -->
            <div v-if="p.merma_m2 != null" class="mb-4 flex items-start gap-2 text-xs bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-orange-700">
              <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span><span class="font-semibold">Merma:</span> {{ p.merma_m2 }} m²
              <span v-if="p.merma_descripcion"> — {{ p.merma_descripcion }}</span></span>
            </div>

            <!-- ── Acciones de Producción ── -->
            <div class="flex gap-2 flex-wrap">
              <!-- Iniciar producción -->
              <button
                v-if="getProduccion(p) === 'pendiente'"
                @click="actualizarEstatus(p, 'en proceso')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >▶ Iniciar Producción</button>

              <!-- Pasar a En Corte -->
              <button
                v-if="getProduccion(p) === 'en proceso'"
                @click="actualizarEstatus(p, 'en corte')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
                Pasar a Corte</button>

              <!-- Pasar a Pulido -->
              <button
                v-if="getProduccion(p) === 'en corte'"
                @click="actualizarEstatus(p, 'pulido')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-200 hover:bg-cyan-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                Pasar a Pulido</button>

              <!-- Marcar Listo -->
              <button
                v-if="getProduccion(p) === 'pulido'"
                @click="actualizarEstatus(p, 'completado')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Marcar Listo</button>

              <!-- Botón Nota -->
              <button
                @click="toggleNota(p.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-xs font-semibold transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Nota</button>

              <!-- Botón Merma -->
              <button
                v-if="getProduccion(p) !== 'pendiente'"
                @click="toggleMerma(p.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-orange-50 text-orange-500 hover:text-orange-700 text-xs font-semibold transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Merma</button>

              <!-- Chat / Modal -->
              <button
                @click="abrirModal(p)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-xs font-semibold transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Chat
              </button>
            </div>

            <!-- Nota inline -->
            <Transition name="slide">
              <div v-if="notaAbierta[p.id]" class="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Nota de Producción</p>
                <div class="flex gap-2">
                  <input
                    v-model="notas[p.id]"
                    type="text"
                    placeholder="Escribe una nota..."
                    class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 transition-colors"
                    @keydown.enter.prevent="guardarNota(p)"
                  />
                  <button
                    @click="guardarNota(p)"
                    :disabled="!notas[p.id]?.trim() || guardandoNota[p.id]"
                    class="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >{{ guardandoNota[p.id] ? '...' : 'Guardar' }}</button>
                </div>
                <div v-if="getProduccionNota(p)" class="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  {{ getProduccionNota(p) }}
                </div>
              </div>
            </Transition>

            <!-- Merma inline -->
            <Transition name="slide">
              <div v-if="mermaAbierta[p.id]" class="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Registrar Merma</p>
                <div class="flex gap-2 flex-wrap">
                  <input
                    v-model.number="mermas[p.id].m2"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="m² de merma"
                    class="w-32 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                  />
                  <input
                    v-model="mermas[p.id].desc"
                    type="text"
                    placeholder="Descripción (opcional)"
                    class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                    @keydown.enter.prevent="guardarMerma(p)"
                  />
                  <button
                    @click="guardarMerma(p)"
                    :disabled="mermas[p.id].m2 == null || guardandoMerma[p.id]"
                    class="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >{{ guardandoMerma[p.id] ? '...' : 'Guardar' }}</button>
                </div>
              </div>
            </Transition>

          </div>

          <div v-if="pedidosFiltrados.length === 0" class="text-center py-12 text-gray-400 text-sm">
            Sin pedidos en esta categoría
          </div>
        </div>

      </div>
    </main>

    <PedidoModal
      v-model="showModal"
      :pedido="pedidoSeleccionado"
      @updated="pedidosStore.fetchPedidos()"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, inject } from 'vue'
import AdminNavBar  from '../../components/admin/AdminNavBar.vue'
import StatusBadge  from '../../components/shared/StatusBadge.vue'
import PedidoModal  from '../../components/shared/PedidoModal.vue'
import { useAuthStore }          from '../../stores/auth.js'
import { usePedidosStore }       from '../../stores/pedidos.js'
import { useNotificationsStore } from '../../stores/notifications.js'

const auth         = useAuthStore()
const pedidosStore = usePedidosStore()
const notifs       = useNotificationsStore()
const toast        = inject('toast', { add: () => {} })

const filtroActivo       = ref('todos')
const showModal          = ref(false)
const pedidoSeleccionado = ref(null)
const updating           = ref({})
const notaAbierta        = reactive({})
const notas              = reactive({})
const guardandoNota      = reactive({})
const mermaAbierta       = reactive({})
const mermas             = reactive({})
const guardandoMerma     = reactive({})

/* ── Flujo de estados de Producción ── */
const FLUJO = ['pendiente', 'en proceso', 'en corte', 'pulido', 'completado']

/* ── Filtros con conteos ── */
const filtros = computed(() => [
  { label: 'Todos',       value: 'todos'                                         },
  { label: 'Pendiente',   value: 'pendiente',  count: count('pendiente')  },
  { label: 'En Proceso',  value: 'en proceso', count: count('en proceso') },
  { label: 'En Corte',    value: 'en corte',   count: count('en corte')   },
  { label: 'Pulido',      value: 'pulido',     count: count('pulido')     },
  { label: 'Completado',  value: 'completado', count: count('completado') }
])

function count(estatus) {
  return pedidosStore.pedidos.filter(p => getProduccion(p) === estatus).length
}

const pedidosFiltrados = computed(() => {
  if (filtroActivo.value === 'todos') return pedidosStore.pedidos
  return pedidosStore.pedidos.filter(p => getProduccion(p) === filtroActivo.value)
})

/* ── Helpers de área ── */
function getProduccion(p)    { return p.areas?.find(a => a.area === 'produccion')?.estatus    || 'pendiente' }
function getProduccionNota(p){ return p.areas?.find(a => a.area === 'produccion')?.comentarios || '' }
function getVentasNota(p)    { return p.areas?.find(a => a.area === 'ventas')?.comentarios     || '' }
function areaLabel(area)     { return { ventas: 'Ventas', contabilidad: 'Cont.', produccion: 'Prod.' }[area] || area }
function formatDate(d)       { if (!d) return '—'; return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short' }) }
function abrirModal(p)       { pedidoSeleccionado.value = p; showModal.value = true }
function toggleNota(id)      { notaAbierta[id] = !notaAbierta[id] }

function toggleMerma(id) {
  mermaAbierta[id] = !mermaAbierta[id]
  if (!mermas[id]) mermas[id] = { m2: null, desc: '' }
}

/* ── Actualizar estado de Producción ── */
async function actualizarEstatus(p, nuevoEstatus) {
  updating.value[p.id] = true
  try {
    await pedidosStore.actualizarEstatus(p.id, 'produccion', nuevoEstatus)
    const labels = {
      'en proceso': 'Producción iniciada',
      'en corte':   'Pasado a Corte',
      'pulido':     'Pasado a Pulido',
      'completado': `Pedido #${p.numero_pedido} completado`
    }
    toast.add({ type: nuevoEstatus === 'completado' ? 'success' : 'info', message: labels[nuevoEstatus] || 'Actualizado' })
    setTimeout(() => notifs.fetchFromDB(), 800)
  } catch {
    toast.add({ type: 'error', message: 'Error al actualizar' })
  } finally {
    updating.value[p.id] = false
  }
}

/* ── Guardar nota de Producción ── */
async function guardarNota(p) {
  const nota = notas[p.id]?.trim()
  if (!nota) return
  guardandoNota[p.id] = true
  try {
    await pedidosStore.actualizarEstatus(p.id, 'produccion', getProduccion(p), nota)
    toast.add({ type: 'success', message: 'Nota guardada' })
    notas[p.id]       = ''
    notaAbierta[p.id] = false
    await pedidosStore.fetchPedidos()
  } catch {
    toast.add({ type: 'error', message: 'Error al guardar nota' })
  } finally {
    guardandoNota[p.id] = false
  }
}

/* ── Guardar Merma ── */
async function guardarMerma(p) {
  const m = mermas[p.id]
  if (m?.m2 == null || m.m2 < 0) return
  guardandoMerma[p.id] = true
  try {
    await pedidosStore.registrarMerma(p.id, m.m2, m.desc)
    toast.add({ type: 'success', message: `Merma de ${m.m2} m² registrada` })
    mermaAbierta[p.id] = false
    mermas[p.id] = { m2: null, desc: '' }
  } catch {
    toast.add({ type: 'error', message: 'Error al registrar merma' })
  } finally {
    guardandoMerma[p.id] = false
  }
}

onMounted(() => {
  pedidosStore.fetchPedidos()
  notifs.startPolling()
})
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all .2s ease }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px) }
</style>
