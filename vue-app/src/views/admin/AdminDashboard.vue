<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <!-- ══ MAIN CONTENT — offset for sidebar ══ -->
    <main class="pt-14 lg:pt-0 lg:ml-60 pb-20 lg:pb-0 page-enter">
      <div class="max-w-6xl mx-auto px-5 py-8 space-y-7">

        <!-- ── Header row ── -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">{{ greetingLabel }}</p>
            <h1 class="font-serif text-3xl font-bold text-gray-900 leading-tight">{{ firstName }}</h1>
            <p class="text-gray-400 text-sm mt-1 capitalize">{{ todayLabel }}</p>
          </div>
          <router-link to="/admin/pedidos" class="btn-primary text-sm shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Ver Pedidos
          </router-link>
        </div>

        <!-- ── KPI Strip ── -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div v-for="kpi in bigKpis" :key="kpi.label"
            class="bg-white rounded-2xl border border-black/[0.06] shadow-soft px-5 py-4 flex flex-col gap-1
                   hover:shadow-card transition-shadow duration-200">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest">{{ kpi.label }}</span>
            <div class="flex items-end justify-between gap-2">
              <span class="font-serif text-3xl font-bold" :class="kpi.color">{{ kpi.value }}</span>
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5" :class="kpi.iconBg">
                <svg class="w-4 h-4" :class="kpi.iconColor" fill="currentColor" viewBox="0 0 20 20">
                  <path :d="kpi.iconPath"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Progress bars ── -->
        <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft px-6 py-5">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-gray-900">Progreso General</h2>
            <span class="font-serif text-2xl font-bold text-gray-900">{{ completadoPct }}<span class="text-base font-sans font-normal text-gray-400">%</span></span>
          </div>
          <!-- Tricolor bar -->
          <div class="flex gap-1 h-2 rounded-full overflow-hidden mb-5">
            <div class="bg-amber-400  transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.pendientes, 0.1) }"></div>
            <div class="bg-[#0D89CB] transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.enProceso, 0.1) }"></div>
            <div class="bg-emerald-400 transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.completados, 0.1) }"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="bar in progressBars" :key="bar.label" class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :class="bar.dot"></div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-gray-500">{{ bar.label }}</span>
                  <span class="text-xs font-bold text-gray-700">{{ bar.pct }}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div class="h-1.5 rounded-full transition-all duration-700" :class="bar.color" :style="{ width: bar.pct + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 3 main cards ── -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

          <!-- Card 1: Próxima entrega (dark accent) -->
          <div class="bg-[#0D89CB] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
            <div>
              <div class="flex items-start justify-between mb-3">
                <p class="text-white/60 text-[11px] uppercase tracking-widest font-semibold">Próxima Entrega</p>
                <span class="bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  {{ nextDelivery ? daysUntil(nextDelivery.fecha_entrega) : '—' }}
                </span>
              </div>
              <h3 class="font-serif text-2xl font-bold text-white">
                {{ nextDelivery ? '#' + nextDelivery.numero_pedido : 'Sin pedidos' }}
              </h3>
              <p class="text-white/50 text-xs mt-1">{{ nextDelivery ? formatDate(nextDelivery.fecha_entrega) : '—' }}</p>
            </div>
            <div class="space-y-2 border-t border-white/10 pt-3 mt-4">
              <div v-for="area in (nextDelivery?.areas || [])" :key="area.area"
                class="flex items-center justify-between">
                <span class="text-white/50 text-xs capitalize">{{ area.area }}</span>
                <span class="text-xs font-semibold capitalize" :class="areaStatusColor(area.estatus)">{{ area.estatus }}</span>
              </div>
              <p v-if="!nextDelivery" class="text-white/30 text-xs text-center">No hay pedidos pendientes</p>
            </div>
          </div>

          <!-- Card 2: Progreso por área -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="font-semibold text-gray-900">Por Área</h3>
                <p class="text-xs text-gray-400 mt-0.5">Completados</p>
              </div>
              <div class="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
            <div class="space-y-4">
              <div v-for="area in areaStats" :key="area.name">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-medium text-gray-700 capitalize">{{ area.name }}</span>
                  <span class="text-xs text-gray-400">{{ area.completados }} / {{ kpis.total }}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div class="h-2.5 rounded-full transition-all duration-700" :class="area.barColor"
                    :style="{ width: kpis.total > 0 ? (area.completados / kpis.total * 100) + '%' : '0%' }">
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity bars — 7 days -->
            <div class="mt-5 pt-4 border-t border-gray-100">
              <p class="text-xs text-gray-400 mb-3">Pedidos — últimos 7 días</p>
              <div class="flex items-end justify-between gap-1.5 h-16">
                <div v-for="(bar, i) in weekBars" :key="i" class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-[11px] font-semibold leading-none"
                    :class="bar.total > 0 ? 'text-gray-600' : 'text-transparent'">
                    {{ bar.total || 0 }}
                  </span>
                  <div class="w-full rounded transition-all duration-500"
                    :class="bar.active ? 'bg-[#0D89CB]' : 'bg-gray-200'"
                    :style="{ height: Math.max((bar.total / maxBar) * 44, bar.total > 0 ? 6 : 2) + 'px' }">
                  </div>
                  <span class="text-[11px] font-medium"
                    :class="bar.active ? 'text-[#0D89CB] font-bold' : 'text-gray-400'">{{ bar.day }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Estado circular -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-gray-900">Estado General</h3>
                <p class="text-xs text-gray-400 mt-0.5">Pedidos del mes</p>
              </div>
            </div>
            <!-- Circular -->
            <div class="flex items-center justify-center my-2">
              <div class="relative w-24 h-24">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f3f4f6" stroke-width="8"/>
                  <circle cx="40" cy="40" r="32" fill="none"
                    :stroke="completadoPct > 60 ? '#10b981' : completadoPct > 30 ? '#f59e0b' : '#ef4444'"
                    stroke-width="8" stroke-linecap="round"
                    :stroke-dasharray="`${completadoPct / 100 * 201} 201`"
                    style="transition: stroke-dasharray 0.7s ease"/>
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="font-serif text-lg font-bold text-gray-900">{{ completadoPct }}%</span>
                  <span class="text-xs text-gray-400">listo</span>
                </div>
              </div>
            </div>
            <!-- Mini list -->
            <div class="mt-3 divide-y divide-gray-50">
              <div v-for="p in pedidosStore.pedidos.slice(0, 4)" :key="p.id"
                @click="abrirModal(p)"
                class="flex items-center justify-between py-2.5
                       cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full flex-shrink-0"
                    :class="p.areas?.every(a => a.estatus === 'completado') ? 'bg-emerald-400' :
                            p.areas?.some(a => a.estatus === 'en proceso')  ? 'bg-[#0D89CB]'   : 'bg-amber-400'">
                  </div>
                  <span class="text-sm font-semibold text-gray-700">#{{ p.numero_pedido }}</span>
                </div>
                <span class="text-xs text-gray-400">{{ formatDate(p.fecha_entrega) }}</span>
              </div>
              <p v-if="pedidosStore.pedidos.length === 0" class="text-center py-2 text-gray-400 text-xs">Sin pedidos</p>
            </div>
          </div>
        </div>

        <!-- ── Monitoreo de entregas en tiempo real ── -->
        <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 class="font-semibold text-gray-900">Monitoreo de entregas</h3>
              <p class="text-xs text-gray-400 mt-0.5">Conductores en ruta · tiempo real</p>
            </div>
            <div class="flex items-center gap-4">
              <div v-if="conductoresEnRuta > 0" class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs font-medium text-gray-600">
                  {{ conductoresEnRuta }} conductor{{ conductoresEnRuta > 1 ? 'es' : '' }} activo{{ conductoresEnRuta > 1 ? 's' : '' }}
                </span>
              </div>
              <router-link to="/admin/conductores"
                class="text-xs font-semibold text-[#0D89CB] hover:underline flex items-center gap-1">
                Ver detalle →
              </router-link>
            </div>
          </div>
          <div class="relative">
            <div id="mapa-dashboard" class="w-full h-64 z-0"></div>
            <!-- Overlay sin conductores -->
            <div v-if="conductoresEnRuta === 0"
              class="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <div class="bg-white rounded-xl px-5 py-4 text-center shadow-sm border border-gray-100">
                <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                </svg>
                <p class="text-sm text-gray-500 font-medium">Sin conductores activos</p>
                <p class="text-xs text-gray-400 mt-1">Aparecerán aquí cuando tengan la app abierta</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Table + Upcoming ── -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">

          <!-- Pedidos recientes (3/5) -->
          <div class="lg:col-span-3 bg-white rounded-2xl border border-black/[0.06] shadow-soft overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-900">Pedidos Recientes</h3>
              <router-link to="/admin/pedidos"
                class="text-xs font-semibold text-[#0D89CB] hover:underline">Ver todos →</router-link>
            </div>
            <!-- Skeleton loader -->
            <div v-if="pedidosStore.loading" class="p-5 space-y-3">
              <div v-for="i in 5" :key="i" class="skeleton h-10 rounded-xl"></div>
            </div>
            <div v-else>
              <div class="grid grid-cols-[1fr_auto_auto] px-5 py-3 bg-gray-50/80 border-b border-gray-100 gap-4">
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedido</span>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entrega</span>
                <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pipeline</span>
              </div>
              <div v-for="p in pedidosStore.pedidos.slice(0, 7)" :key="p.id"
                @click="abrirModal(p)"
                class="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3.5 gap-4 hover:bg-gray-50 cursor-pointer
                       border-b border-gray-50 last:border-0 transition-colors"
                :class="{ 'bg-red-50/30': p.retrasado }">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg class="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                      <path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-semibold text-gray-900 truncate">#{{ p.numero_pedido }}</span>
                      <span v-if="p.prioridad === 'urgente'"
                        class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 leading-none flex-shrink-0">URG</span>
                    </div>
                    <p v-if="p.retrasado" class="text-[11px] text-red-500 font-medium leading-none mt-0.5">Atrasado</p>
                    <p v-else-if="p.cliente_nombre" class="text-[11px] text-gray-400 leading-none mt-0.5 truncate">{{ p.cliente_nombre }}</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500 whitespace-nowrap">{{ formatDate(p.fecha_entrega) }}</span>
                <!-- Pipeline V → C → P -->
                <div class="flex items-center gap-0.5 flex-shrink-0">
                  <template v-for="(a, i) in p.areas" :key="a.area">
                    <div
                      class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ring-1"
                      :class="{
                        'bg-emerald-50 text-emerald-700 ring-emerald-200': a.estatus === 'completado',
                        'bg-blue-50 text-blue-700 ring-blue-200':           a.estatus === 'en proceso',
                        'bg-gray-100 text-gray-400 ring-gray-200':          a.estatus === 'pendiente'
                      }"
                      :title="a.area + ': ' + a.estatus"
                    >{{ a.area[0].toUpperCase() }}</div>
                    <div v-if="i < p.areas.length - 1"
                      class="h-px w-2 flex-shrink-0"
                      :class="a.estatus === 'completado' ? 'bg-emerald-200' : 'bg-gray-200'">
                    </div>
                  </template>
                </div>
              </div>
              <div v-if="pedidosStore.pedidos.length === 0"
                class="py-12 text-center text-gray-400 text-sm">No hay pedidos registrados</div>
            </div>
          </div>

          <!-- Próximas entregas (2/5) — dark accent -->
          <div class="lg:col-span-2 bg-[#0D89CB] rounded-2xl overflow-hidden">
            <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 class="font-semibold text-white">Próximas Entregas</h3>
              <span class="text-[11px] text-white/40 bg-white/10 px-3 py-1 rounded-full font-medium capitalize">
                {{ currentMonth }}
              </span>
            </div>
            <div class="p-4 space-y-2.5 max-h-80 overflow-y-auto">
              <div v-if="upcomingDeliveries.length === 0"
                class="py-8 text-center text-white/30 text-sm">No hay entregas próximas</div>
              <div v-for="p in upcomingDeliveries" :key="p.id"
                @click="abrirModal(p)"
                class="flex items-center gap-3 p-3.5 bg-white/10 hover:bg-white/15 rounded-xl cursor-pointer transition-colors">
                <div class="flex-shrink-0 w-11 h-11 bg-yellow-400 rounded-xl flex flex-col items-center justify-center">
                  <span class="text-[11px] font-bold text-gray-900 leading-none">{{ dayOf(p.fecha_entrega) }}</span>
                  <span class="text-lg font-black text-gray-900 leading-none">{{ dayNum(p.fecha_entrega) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold text-white truncate">#{{ p.numero_pedido }}</p>
                  <div class="flex gap-1 mt-1.5 flex-wrap">
                    <span v-for="a in p.areas" :key="a.area"
                      class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md capitalize"
                      :class="badgeClass(a.estatus)">
                      {{ a.area }}
                    </span>
                  </div>
                </div>
                <span class="text-xs text-white/50 flex-shrink-0">{{ daysUntil(p.fecha_entrega) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <PedidoModal
      v-model="showModal"
      :pedido="pedidoSeleccionado"
      @delete="onDeleteRequest"
      @updated="pedidosStore.fetchPedidos()"
    />

    <!-- ══ CONFIRM DELETE MODAL ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmDelete"
          class="modal-overlay"
          @mousedown.self="showConfirmDelete = false">
          <div class="bg-white rounded-2xl shadow-modal border border-black/[0.06] w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Eliminar pedido</h3>
            <p class="text-sm text-gray-500 mb-6">Esta acción no puede deshacerse. ¿Confirmas la eliminación?</p>
            <div class="flex gap-3">
              <button @click="showConfirmDelete = false"
                class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button @click="confirmarEliminar"
                class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all duration-200">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, inject } from 'vue'
import axios from 'axios'
import AdminNavBar   from '../../components/admin/AdminNavBar.vue'
import StatusBadge   from '../../components/shared/StatusBadge.vue'
import PedidoModal   from '../../components/shared/PedidoModal.vue'
import { useAuthStore }    from '../../stores/auth.js'
import { usePedidosStore } from '../../stores/pedidos.js'
import { useGpsStore }     from '../../stores/gps.js'

const auth         = useAuthStore()
const pedidosStore = usePedidosStore()
const gpsStore     = useGpsStore()
const toast        = inject('toast')

// ── UI ──
const incidenciasActivas = ref(0)
const showModal          = ref(false)
const showConfirmDelete  = ref(false)
const pedidoSeleccionado = ref(null)
const pedidoAEliminar    = ref(null)
const resumen            = ref(null)

// ── User ──
const firstName     = computed(() => auth.user?.nombre?.split(' ')[0] || 'Admin')
const greetingLabel = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
})

// ── Dates ──
const todayLabel   = computed(() => new Date().toLocaleDateString('es', { weekday:'long', day:'numeric', month:'long', year:'numeric' }))
const currentMonth = computed(() => new Date().toLocaleDateString('es', { month:'long', year:'numeric' }))

// ── KPIs ──
const kpis          = computed(() => pedidosStore.kpis)
const completadoPct = computed(() => kpis.value.total ? Math.round(kpis.value.completados / kpis.value.total * 100) : 0)
const procesoPct    = computed(() => kpis.value.total ? Math.round(kpis.value.enProceso   / kpis.value.total * 100) : 0)
const pendientePct  = computed(() => kpis.value.total ? Math.round(kpis.value.pendientes  / kpis.value.total * 100) : 0)

const progressBars = computed(() => [
  { label:'Pendientes',  pct: pendientePct.value,  color:'bg-amber-400',   dot:'bg-amber-400'   },
  { label:'En proceso',  pct: procesoPct.value,    color:'bg-[#0D89CB]',   dot:'bg-[#0D89CB]'   },
  { label:'Completados', pct: completadoPct.value, color:'bg-emerald-400', dot:'bg-emerald-400' },
])

const bigKpis = computed(() => [
  { label:'Total',        value: kpis.value.total,       color:'text-gray-900',   iconBg:'bg-gray-100',    iconColor:'text-gray-500',    iconPath:'M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' },
  { label:'En Proceso',   value: kpis.value.enProceso,   color:'text-[#0D89CB]',  iconBg:'bg-blue-50',     iconColor:'text-[#0D89CB]',   iconPath:'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z' },
  { label:'Completados',  value: kpis.value.completados, color:'text-emerald-600', iconBg:'bg-emerald-50',  iconColor:'text-emerald-600', iconPath:'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' },
  { label:'Atrasados',    value: kpis.value.atrasados,   color:'text-red-600',    iconBg:'bg-red-50',      iconColor:'text-red-500',     iconPath:'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' },
  { label:'Urgentes',     value: kpis.value.urgentes,    color:'text-orange-600', iconBg:'bg-orange-50',   iconColor:'text-orange-500',  iconPath:'M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z' },
  { label:'Incidencias',  value: incidenciasActivas.value, color: incidenciasActivas.value > 0 ? 'text-rose-600' : 'text-gray-400', iconBg: incidenciasActivas.value > 0 ? 'bg-rose-50' : 'bg-gray-100', iconColor: incidenciasActivas.value > 0 ? 'text-rose-500' : 'text-gray-400', iconPath:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
])

// ── Area stats ──
const areaStats = computed(() => [
  { name:'ventas',       barColor:'bg-[#0D89CB]',     completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='ventas')?.estatus==='completado').length },
  { name:'produccion',   barColor:'bg-orange-400',  completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='produccion')?.estatus==='completado').length },
  { name:'contabilidad', barColor:'bg-emerald-400', completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='contabilidad')?.estatus==='completado').length },
])

// ── Week bars (API o fallback desde pedidos locales) ──
const weekBars = computed(() => {
  const dias = []
  const LABEL = ['D','L','M','M','J','V','S']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const iso = d.toISOString().slice(0,10)
    let total = 0
    if (resumen.value?.porDia?.length) {
      // Datos del endpoint /api/pedidos/resumen
      const found = resumen.value.porDia.find(r => r.dia?.slice(0,10) === iso)
      total = Number(found?.total) || 0
    } else {
      // Fallback: contar desde pedidos cargados en store (usa fecha_entrega)
      total = pedidosStore.pedidos.filter(p =>
        p.fecha_creacion?.slice(0,10) === iso ||
        p.created_at?.slice(0,10) === iso
      ).length
    }
    dias.push({ day: LABEL[d.getDay()], total, active: i === 0 })
  }
  return dias
})
const maxBar = computed(() => Math.max(...weekBars.value.map(b => b.total), 1))

// ── Deliveries ──
const upcomingDeliveries = computed(() => {
  const today = new Date(); today.setHours(0,0,0,0)
  return [...pedidosStore.pedidos]
    .filter(p => new Date(p.fecha_entrega) >= today)
    .sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
    .slice(0, 6)
})
const nextDelivery = computed(() => upcomingDeliveries.value[0] || null)

// ── Helpers ──
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })
}
function dayOf(d)  { return d ? new Date(d).toLocaleDateString('es',{weekday:'short'}).toUpperCase().slice(0,3) : '' }
function dayNum(d) { return d ? new Date(d).getDate() : '' }
function daysUntil(d) {
  if (!d) return '—'
  const diff = Math.ceil((new Date(d).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff < 0)  return 'Vencido'
  return `${diff}d`
}
function areaStatusColor(s) {
  return { completado:'text-emerald-400', 'en proceso':'text-yellow-300', pendiente:'text-white/40' }[s] || 'text-white/40'
}
function badgeClass(s) {
  return { completado:'bg-emerald-500/20 text-emerald-300', 'en proceso':'bg-white/20 text-white/80', pendiente:'bg-amber-500/20 text-amber-300' }[s] || 'bg-white/10 text-white/50'
}

// ── Incidencias ──
async function fetchIncidencias() {
  try {
    const { data } = await axios.get('/api/entregas')
    incidenciasActivas.value = data.filter(e => e.estado === 'incidencia').length
  } catch { /* silencioso */ }
}

// ── Mapa monitoreo (dashboard) ───────────────────────────────────────────────
let dashMap = null
let dashMapPositioned = false
const dashMarkers = {}
let _dashPollTimer = null

const conductoresEnRuta = computed(() => Object.keys(gpsStore.ubicaciones).length)

function truckIcon(nombre) {
  const firstName = (nombre || '').split(' ')[0]
  return window.L.divIcon({
    className: '',
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="background:#0D89CB;border-radius:10px;width:38px;height:38px;
        display:flex;align-items:center;justify-content:center;
        border:2.5px solid #10b981;box-shadow:0 3px 10px rgba(0,0,0,.4)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <div style="background:rgba(13,137,203,.9);color:#fff;font-size:9px;font-weight:700;
        padding:1px 6px;border-radius:4px;white-space:nowrap;
        max-width:72px;overflow:hidden;text-overflow:ellipsis;font-family:sans-serif">
        ${firstName}
      </div>
    </div>`,
    iconSize:   [38, 56],
    iconAnchor: [19, 56]
  })
}

function initDashMap() {
  if (typeof window.L === 'undefined' || dashMap) return
  dashMap = window.L.map('mapa-dashboard', {
    center:             [20.96, -89.62],
    zoom:               12,
    zoomControl:        true,
    attributionControl: false
  })
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(dashMap)
}

function updateDashMarkers(ubicaciones) {
  if (!dashMap || typeof window.L === 'undefined') return
  for (const id of Object.keys(dashMarkers)) {
    if (!ubicaciones[id]) { dashMap.removeLayer(dashMarkers[id]); delete dashMarkers[id] }
  }
  for (const [id, u] of Object.entries(ubicaciones)) {
    const ic = truckIcon(u.nombre)
    const popup = `<b>${u.nombre}</b>${u.numero_pedido ? '<br>Pedido #' + u.numero_pedido : ''}`
    if (dashMarkers[id]) {
      dashMarkers[id].setLatLng([u.lat, u.lng]).setIcon(ic).setPopupContent(popup)
    } else {
      dashMarkers[id] = window.L.marker([u.lat, u.lng], { icon: ic }).addTo(dashMap).bindPopup(popup)
    }
  }
  const latlngs = Object.values(ubicaciones).map(u => [u.lat, u.lng])
  if (!dashMapPositioned && latlngs.length > 0) {
    latlngs.length === 1 ? dashMap.setView(latlngs[0], 14) : dashMap.fitBounds(latlngs, { padding: [40, 40] })
    dashMapPositioned = true
  }
  if (latlngs.length === 0) dashMapPositioned = false
}

watch(() => gpsStore.ubicaciones, (u) => updateDashMarkers(u), { deep: true })

// ── Actions ──
function abrirModal(p) { pedidoSeleccionado.value = p; showModal.value = true }
function onDeleteRequest(id) { pedidoAEliminar.value = id; showConfirmDelete.value = true }

async function confirmarEliminar() {
  if (!pedidoAEliminar.value) return
  try {
    await pedidosStore.eliminarPedido(pedidoAEliminar.value)
    showModal.value = false
    showConfirmDelete.value = false
    pedidoAEliminar.value = null
    toast.add({ type: 'success', title: 'Pedido eliminado', message: 'El registro fue eliminado correctamente.' })
  } catch {
    showConfirmDelete.value = false
    toast.add({ type: 'error', title: 'Error', message: 'No se pudo eliminar el pedido.' })
  }
}

async function fetchResumen() {
  try { const { data } = await axios.get('/api/pedidos/resumen'); resumen.value = data }
  catch { /* no-op */ }
}

onMounted(async () => {
  pedidosStore.fetchPedidos()
  fetchResumen()
  fetchIncidencias()
  gpsStore.fetchUbicaciones()
  // Poll GPS each 10 s while on dashboard
  _dashPollTimer = setInterval(() => gpsStore.fetchUbicaciones(), 10_000)
  await nextTick()
  initDashMap()
  updateDashMarkers(gpsStore.ubicaciones)
})

onUnmounted(() => {
  if (_dashPollTimer) { clearInterval(_dashPollTimer); _dashPollTimer = null }
})
</script>
