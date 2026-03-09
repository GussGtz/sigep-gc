<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-14 lg:pt-0 lg:ml-60 page-enter">
      <div class="max-w-5xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Encabezado ── -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="font-serif text-2xl font-bold text-gray-900">Mis Pedidos</h1>
            <p class="text-gray-400 text-sm mt-0.5">Bienvenido, {{ auth.user?.nombre }}</p>
          </div>
          <button
            @click="showCrear = true"
            class="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo Pedido
          </button>
        </div>

        <!-- ── KPIs ── -->
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <div class="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 text-center">
            <p class="text-2xl font-black text-gray-900">{{ pedidosStore.kpis.total }}</p>
            <p class="text-xs text-gray-400 mt-1">Total</p>
          </div>
          <div class="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 text-center">
            <p class="text-2xl font-black text-amber-500">{{ pedidosStore.kpis.enProceso }}</p>
            <p class="text-xs text-gray-400 mt-1">En Proceso</p>
          </div>
          <div class="bg-white rounded-2xl px-4 py-4 shadow-sm border border-gray-100 text-center">
            <p class="text-2xl font-black text-emerald-500">{{ pedidosStore.kpis.completados }}</p>
            <p class="text-xs text-gray-400 mt-1">Completados</p>
          </div>
          <div class="bg-white rounded-2xl px-4 py-4 shadow-sm border border-red-100 text-center">
            <p class="text-2xl font-black text-red-500">{{ pedidosStore.kpis.atrasados }}</p>
            <p class="text-xs text-gray-400 mt-1">Atrasados</p>
          </div>
          <div class="bg-white rounded-2xl px-4 py-4 shadow-sm border border-orange-100 text-center">
            <p class="text-2xl font-black text-orange-500">{{ pedidosStore.kpis.urgentes }}</p>
            <p class="text-xs text-gray-400 mt-1">Urgentes</p>
          </div>
        </div>

        <!-- ── Filtros rápidos ── -->
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="f in filtrosRapidos" :key="f.value"
            @click="filtroActivo = f.value; aplicarFiltro(f.value)"
            class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
            :class="filtroActivo === f.value
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'"
          >{{ f.label }}</button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="pedidosStore.loading" class="text-center py-12 text-gray-400">Cargando...</div>

        <!-- ── Lista de pedidos ── -->
        <div v-else class="space-y-3">
          <div
            v-for="p in pedidosStore.pedidosFiltrados"
            :key="p.id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-gray-300 transition-colors"
            :class="{ 'border-red-200 bg-red-50/30': p.retrasado }"
          >
            <!-- Cabecera del pedido -->
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <p class="font-bold text-gray-900">#{{ p.numero_pedido }}</p>
                  <span v-if="p.prioridad === 'urgente'"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 leading-none">
                    Urgente
                  </span>
                  <span v-if="p.retrasado"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 leading-none">
                    Atrasado
                  </span>
                  <span class="text-xs text-gray-300">·</span>
                  <p class="text-xs text-gray-500">Entrega: {{ formatDate(p.fecha_entrega) }}</p>
                </div>
                <div v-if="p.cliente_nombre || p.metros_cuadrados" class="flex items-center gap-2 mb-1.5">
                  <p v-if="p.cliente_nombre" class="text-xs text-gray-500 font-medium">{{ p.cliente_nombre }}</p>
                  <span v-if="p.cliente_nombre && p.metros_cuadrados" class="text-xs text-gray-300">·</span>
                  <p v-if="p.metros_cuadrados" class="text-xs text-gray-400">{{ parseFloat(p.metros_cuadrados).toFixed(2) }} m²</p>
                </div>
                <div class="flex gap-3 flex-wrap">
                  <div v-for="a in p.areas" :key="a.area" class="flex items-center gap-1.5">
                    <span class="text-xs text-gray-400 capitalize">{{ areaLabel(a.area) }}:</span>
                    <StatusBadge :status="a.estatus" />
                  </div>
                </div>
              </div>
              <button
                @click="toggleExpandido(p.id)"
                class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <svg class="w-4 h-4 transition-transform" :class="expandidos[p.id] ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <!-- Acciones Ventas -->
            <div class="flex gap-2 flex-wrap">
              <button
                v-if="getVentas(p) === 'pendiente'"
                @click="actualizarEstatus(p, 'en proceso')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >▶ Iniciar en Ventas</button>

              <button
                v-if="getVentas(p) === 'en proceso'"
                @click="actualizarEstatus(p, 'completado')"
                :disabled="updating[p.id]"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Marcar Ventas Listo</button>

              <button
                @click="abrirModal(p)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-xs font-semibold transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                Chat / Detalle
              </button>
            </div>

            <!-- Panel expandido: nota -->
            <Transition name="slide">
              <div v-if="expandidos[p.id]" class="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold">Nota de Ventas</p>
                <div class="flex gap-2">
                  <input
                    v-model="notas[p.id]"
                    type="text"
                    placeholder="Agregar nota para producción..."
                    class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 transition-colors"
                  />
                  <button
                    @click="guardarNota(p)"
                    :disabled="!notas[p.id]?.trim() || guardandoNota[p.id]"
                    class="bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >{{ guardandoNota[p.id] ? '...' : 'Guardar' }}</button>
                </div>
                <div v-if="getVentasNota(p)" class="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <svg class="w-3.5 h-3.5 inline mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  {{ getVentasNota(p) }}
                </div>
              </div>
            </Transition>
          </div>

          <div v-if="pedidosStore.pedidosFiltrados.length === 0" class="text-center py-12 text-gray-400 text-sm">
            Sin pedidos en esta categoría
          </div>
        </div>

      </div>
    </main>

    <!-- ── Modal crear pedido ── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCrear"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          @mousedown.self="showCrear = false">
          <div class="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]" @click.stop>
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 class="font-bold text-gray-900">Nuevo Pedido</h2>
              <button @click="showCrear = false" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form @submit.prevent="crearPedido" class="p-5 space-y-4 overflow-y-auto">

              <!-- Número + Fecha -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nº Pedido <span class="text-red-500">*</span></label>
                  <input v-model="nuevoPedido.numero_pedido"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                    placeholder="GC-2025-001" required />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Fecha Entrega <span class="text-red-500">*</span></label>
                  <input v-model="nuevoPedido.fecha_entrega" type="date"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required />
                </div>
              </div>

              <!-- Prioridad -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Prioridad</label>
                <div class="flex gap-3">
                  <label class="flex-1 flex items-center gap-2.5 border border-gray-200 rounded-xl px-4 py-2.5 cursor-pointer"
                    :class="nuevoPedido.prioridad === 'normal' ? 'border-gray-900 bg-gray-50' : 'hover:bg-gray-50'">
                    <input type="radio" v-model="nuevoPedido.prioridad" value="normal" class="accent-gray-900"/>
                    <span class="text-sm font-medium text-gray-700">Normal</span>
                  </label>
                  <label class="flex-1 flex items-center gap-2.5 border border-orange-200 rounded-xl px-4 py-2.5 cursor-pointer"
                    :class="nuevoPedido.prioridad === 'urgente' ? 'border-orange-500 bg-orange-50' : 'hover:bg-orange-50/50'">
                    <input type="radio" v-model="nuevoPedido.prioridad" value="urgente" class="accent-orange-500"/>
                    <span class="text-sm font-medium text-orange-700">Urgente</span>
                  </label>
                </div>
              </div>

              <!-- Cliente -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Cliente <span class="text-gray-400 font-normal">(opcional)</span></label>
                <input v-model="nuevoPedido.cliente_nombre"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                  placeholder="Nombre del cliente"/>
              </div>

              <!-- Dirección -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Dirección de entrega <span class="text-gray-400 font-normal">(opcional)</span></label>
                <input v-model="nuevoPedido.direccion_entrega"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                  placeholder="Calle, colonia, ciudad..."/>
              </div>

              <!-- Medidas -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Medidas <span class="text-gray-400 font-normal">(metros)</span></label>
                <div class="grid grid-cols-3 gap-3">
                  <input v-model="nuevoPedido.alto" type="number" min="0" step="0.01"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm placeholder-gray-400"
                    placeholder="Alto (m)"/>
                  <input v-model="nuevoPedido.ancho" type="number" min="0" step="0.01"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm placeholder-gray-400"
                    placeholder="Ancho (m)"/>
                  <input v-model="nuevoPedido.cantidad" type="number" min="1"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    placeholder="Piezas"/>
                </div>
                <div v-if="m2Preview" class="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                {{ m2Preview }} m² totales
              </div>
              </div>

              <!-- Especificaciones -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Especificaciones <span class="text-gray-400 font-normal">(opcional)</span></label>
                <textarea v-model="nuevoPedido.especificaciones" rows="2"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none placeholder-gray-400"
                  placeholder="Tipo de vidrio, color, acabado..."/>
              </div>

              <div v-if="crearError" class="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{{ crearError }}</div>
              <div class="flex gap-2.5 pt-1">
                <button type="button" @click="showCrear = false"
                  class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors">
                  Cancelar
                </button>
                <button type="submit" :disabled="creando"
                  class="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {{ creando ? 'Creando...' : 'Crear Pedido' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal detalle / chat ── -->
    <PedidoModal
      v-model="showModal"
      :pedido="pedidoSeleccionado"
      @updated="pedidosStore.fetchPedidos()"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
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

const showCrear          = ref(false)
const showModal          = ref(false)
const pedidoSeleccionado = ref(null)
const creando            = ref(false)
const crearError         = ref('')
const filtroActivo       = ref('todos')
const nuevoPedido        = ref({
  numero_pedido: '', fecha_entrega: '',
  cliente_nombre: '', direccion_entrega: '',
  alto: '', ancho: '', cantidad: 1,
  prioridad: 'normal', especificaciones: ''
})
const updating           = ref({})
const expandidos         = reactive({})
const notas              = reactive({})
const guardandoNota      = reactive({})

const m2Preview = computed(() => {
  const a = parseFloat(nuevoPedido.value.alto)
  const b = parseFloat(nuevoPedido.value.ancho)
  const c = parseInt(nuevoPedido.value.cantidad) || 1
  if (a > 0 && b > 0) return (a * b * c).toFixed(4)
  return null
})

const filtrosRapidos = [
  { label: 'Todos',       value: 'todos'       },
  { label: 'Activos',     value: 'activos'     },
  { label: 'Completados', value: 'completados' }
]

function areaLabel(area) {
  return { ventas: 'Ventas', contabilidad: 'Cont.', produccion: 'Prod.' }[area] || area
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}
function aplicarFiltro(f) {
  pedidosStore.setFiltro('completados', f === 'todos' ? null : f === 'completados')
}
function abrirModal(p)      { pedidoSeleccionado.value = p; showModal.value = true }
function toggleExpandido(id) { expandidos[id] = !expandidos[id] }

function getVentas(p)    { return p.areas?.find(a => a.area === 'ventas')?.estatus    || 'pendiente' }
function getVentasNota(p){ return p.areas?.find(a => a.area === 'ventas')?.comentarios || '' }

async function actualizarEstatus(p, nuevoEstatus) {
  updating.value[p.id] = true
  try {
    await pedidosStore.actualizarEstatus(p.id, 'ventas', nuevoEstatus)
    setTimeout(() => notifs.fetchFromDB(), 800)
    toast.add({ type: 'success', message: 'Estado de Ventas actualizado' })
  } catch {
    toast.add({ type: 'error', message: 'Error al actualizar' })
  } finally {
    updating.value[p.id] = false
  }
}

async function guardarNota(p) {
  const nota = notas[p.id]?.trim()
  if (!nota) return
  guardandoNota[p.id] = true
  try {
    await pedidosStore.actualizarEstatus(p.id, 'ventas', getVentas(p), nota)
    toast.add({ type: 'success', message: 'Nota guardada' })
    notas[p.id] = ''
  } catch {
    toast.add({ type: 'error', message: 'Error al guardar nota' })
  } finally {
    guardandoNota[p.id] = false
  }
}

async function crearPedido() {
  crearError.value = ''
  creando.value    = true
  try {
    await pedidosStore.crearPedido(nuevoPedido.value)
    showCrear.value   = false
    toast.add({ type: 'success', message: 'Pedido creado' })
    nuevoPedido.value = {
      numero_pedido: '', fecha_entrega: '',
      cliente_nombre: '', direccion_entrega: '',
      alto: '', ancho: '', cantidad: 1,
      prioridad: 'normal', especificaciones: ''
    }
    setTimeout(() => notifs.fetchFromDB(), 800)
  } catch (e) {
    crearError.value = e.response?.data?.message || 'Error al crear'
  } finally {
    creando.value = false
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
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
