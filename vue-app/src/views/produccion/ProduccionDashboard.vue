<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-14 lg:pt-0 lg:ml-60 page-enter">

      <!-- ── Banner de bienvenida ── -->
      <div class="bg-white border-b border-gray-100 px-5 py-5 lg:px-8">
        <div class="max-w-5xl mx-auto">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Producción · Glass Caribe</p>
          <h1 class="font-serif text-xl font-bold text-gray-900 mt-0.5">Cola de producción</h1>
          <p class="text-xs text-gray-400 mt-0.5">{{ fechaHoy }}</p>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-4 py-5 lg:px-8 space-y-5 pb-8">

        <!-- ── Filtros de cola con contadores ── -->
        <div class="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 no-scrollbar">
          <button
            v-for="f in filtros" :key="f.value"
            @click="filtroActivo = f.value"
            class="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0 flex items-center gap-1.5"
            :class="filtroActivo === f.value
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'"
          >
            {{ f.label }}
            <span v-if="f.count !== undefined && f.count > 0"
              class="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              :class="filtroActivo === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'"
            >{{ f.count }}</span>
          </button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="pedidosStore.loading" class="flex flex-col items-center gap-3 py-16 text-gray-400">
          <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-sm">Cargando cola de producción...</span>
        </div>

        <!-- ── Lista de pedidos ── -->
        <div v-else class="space-y-3">

          <!-- Empty state -->
          <div v-if="pedidosFiltrados.length === 0" class="flex flex-col items-center gap-3 py-16">
            <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-500">Sin pedidos en esta etapa</p>
            <p class="text-xs text-gray-400">Prueba seleccionando otro filtro</p>
          </div>

          <div
            v-for="p in pedidosFiltrados"
            :key="p.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <!-- Franja superior de urgencia -->
            <div v-if="p.prioridad === 'urgente'" class="h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>

            <div class="p-4">
              <!-- Cabecera: número + badges + chat -->
              <div class="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-black text-gray-900 text-base">#{{ p.numero_pedido }}</p>
                    <span v-if="p.prioridad === 'urgente'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Urgente
                    </span>
                  </div>
                  <p class="text-xs text-gray-400 mt-0.5">
                    Entrega: <span class="font-medium text-gray-600">{{ formatDate(p.fecha_entrega) }}</span>
                    <span v-if="p.metros_cuadrados" class="ml-2">· {{ p.metros_cuadrados }} m²</span>
                  </p>
                </div>
                <button
                  @click="abrirModal(p)"
                  class="p-2 rounded-xl hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
                  title="Chat / Detalle"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </button>
              </div>

              <!-- Pipeline de producción: pasos visuales -->
              <div class="mb-4">
                <div class="flex items-center">
                  <template v-for="(step, idx) in FLUJO" :key="step">
                    <!-- Step dot -->
                    <div class="flex flex-col items-center gap-0.5 flex-shrink-0">
                      <div
                        class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                        :class="{
                          'bg-gray-900 text-white ring-2 ring-gray-900/20 scale-110': getProduccion(p) === step,
                          'bg-emerald-500 text-white': FLUJO.indexOf(getProduccion(p)) > idx,
                          'bg-gray-100 text-gray-400': FLUJO.indexOf(getProduccion(p)) < idx
                        }"
                      >
                        <svg v-if="FLUJO.indexOf(getProduccion(p)) > idx" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        <span v-else>{{ idx + 1 }}</span>
                      </div>
                      <span
                        class="text-[8px] font-semibold whitespace-nowrap hidden sm:block"
                        :class="{
                          'text-gray-900': getProduccion(p) === step,
                          'text-emerald-600': FLUJO.indexOf(getProduccion(p)) > idx,
                          'text-gray-300': FLUJO.indexOf(getProduccion(p)) < idx
                        }"
                      >{{ step === 'en proceso' ? 'Proceso' : step === 'en corte' ? 'Corte' : step.charAt(0).toUpperCase() + step.slice(1) }}</span>
                    </div>
                    <!-- Línea conectora (excepto en el último) -->
                    <div v-if="idx < FLUJO.length - 1"
                      class="flex-1 h-0.5 mx-1 transition-all"
                      :class="FLUJO.indexOf(getProduccion(p)) > idx ? 'bg-emerald-400' : 'bg-gray-100'"
                    ></div>
                  </template>
                </div>
              </div>

              <!-- Nota de Ventas (si existe) -->
              <div v-if="getVentasNota(p)" class="mb-3 flex items-start gap-2 text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-blue-700">
                <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
                <span><span class="font-bold">Ventas:</span> {{ getVentasNota(p) }}</span>
              </div>

              <!-- Merma registrada (si existe) -->
              <div v-if="p.merma_m2 != null" class="mb-3 flex items-center gap-2 text-xs bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-orange-700">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span><span class="font-bold">Merma:</span> {{ p.merma_m2 }} m²<span v-if="p.merma_descripcion"> — {{ p.merma_descripcion }}</span></span>
              </div>

              <!-- ── Botón CTA principal (full-width, color por etapa) ── -->
              <div class="space-y-2">
                <button
                  v-if="getProduccion(p) === 'pendiente'"
                  @click="actualizarEstatus(p, 'en proceso')"
                  :disabled="updating[p.id]"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                  Iniciar Producción
                </button>

                <button
                  v-if="getProduccion(p) === 'en proceso'"
                  @click="actualizarEstatus(p, 'en corte')"
                  :disabled="updating[p.id]"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-violet-200"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/></svg>
                  Pasar a Corte
                </button>

                <button
                  v-if="getProduccion(p) === 'en corte'"
                  @click="actualizarEstatus(p, 'pulido')"
                  :disabled="updating[p.id]"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-cyan-200"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                  Pasar a Pulido
                </button>

                <button
                  v-if="getProduccion(p) === 'pulido'"
                  @click="actualizarEstatus(p, 'completado')"
                  :disabled="updating[p.id]"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  Marcar Listo ✓
                </button>

                <div v-if="getProduccion(p) === 'completado'"
                  class="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 text-sm font-semibold">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Producción completada
                </div>

                <!-- Botones secundarios: Nota + Merma -->
                <div class="flex gap-2 pt-1">
                  <button
                    @click="toggleNota(p.id)"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 text-xs font-semibold transition-colors"
                    :class="notaAbierta[p.id] ? 'bg-gray-50 border-gray-300 text-gray-700' : ''"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    {{ getProduccionNota(p) ? 'Ver nota' : 'Nota' }}
                  </button>
                  <button
                    v-if="getProduccion(p) !== 'pendiente'"
                    @click="toggleMerma(p.id)"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-orange-100 text-orange-500 hover:bg-orange-50 text-xs font-semibold transition-colors"
                    :class="mermaAbierta[p.id] ? 'bg-orange-50 border-orange-300' : ''"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    {{ p.merma_m2 != null ? `Merma: ${p.merma_m2}m²` : 'Registrar merma' }}
                  </button>
                </div>
              </div>

              <!-- Nota inline -->
              <Transition name="slide">
                <div v-if="notaAbierta[p.id]" class="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div v-if="getProduccionNota(p)" class="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                    <svg class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    {{ getProduccionNota(p) }}
                  </div>
                  <div class="flex gap-2">
                    <input
                      v-model="notas[p.id]"
                      type="text"
                      :placeholder="getProduccionNota(p) ? 'Actualizar nota...' : 'Escribe una nota...'"
                      class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
                      @keydown.enter.prevent="guardarNota(p)"
                    />
                    <button
                      @click="guardarNota(p)"
                      :disabled="!notas[p.id]?.trim() || guardandoNota[p.id]"
                      class="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors"
                    >{{ guardandoNota[p.id] ? '...' : 'Guardar' }}</button>
                  </div>
                </div>
              </Transition>

              <!-- Merma inline -->
              <Transition name="slide">
                <div v-if="mermaAbierta[p.id]" class="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <p class="text-xs font-semibold text-orange-600 uppercase tracking-wider">Registrar Merma</p>
                  <div class="flex gap-2">
                    <input
                      v-model.number="mermas[p.id].m2"
                      type="number" min="0" step="0.01"
                      placeholder="m²"
                      class="w-24 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                    />
                    <input
                      v-model="mermas[p.id].desc"
                      type="text"
                      placeholder="Descripción (opcional)"
                      class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-400"
                      @keydown.enter.prevent="guardarMerma(p)"
                    />
                    <button
                      @click="guardarMerma(p)"
                      :disabled="mermas[p.id].m2 == null || guardandoMerma[p.id]"
                      class="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50 transition-colors"
                    >{{ guardandoMerma[p.id] ? '...' : 'Guardar' }}</button>
                  </div>
                </div>
              </Transition>

            </div>
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

const fechaHoy = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

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
.no-scrollbar::-webkit-scrollbar { display: none }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none }
</style>
