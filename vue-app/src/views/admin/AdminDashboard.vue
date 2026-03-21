<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <!-- ══ MAIN CONTENT — offset for sidebar ══ -->
    <main class="pt-header-lg lg:pt-0 lg:ml-60 pb-nav lg:pb-0 page-enter">
      <div class="max-w-6xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Header row ── -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p class="text-xs text-gray-400 font-medium uppercase tracking-widest mb-1">{{ greetingLabel }}</p>
            <h1 class="font-serif text-3xl font-bold text-gray-900 leading-tight">{{ firstName }}</h1>
            <p class="text-gray-400 text-sm mt-1 capitalize">{{ todayLabel }}</p>

            <!-- ── Live metrics pills ── -->
            <div class="flex items-center gap-2 flex-wrap mt-3">
              <div class="inline-flex items-center gap-1.5 bg-white rounded-full border border-black/[0.06] shadow-soft px-3.5 py-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs font-bold text-gray-900">{{ pedidosHoy }}</span>
                <span class="text-xs text-gray-400">pedidos hoy</span>
              </div>
              <div class="inline-flex items-center gap-1.5 bg-white rounded-full border border-black/[0.06] shadow-soft px-3.5 py-1.5">
                <Truck class="w-3 h-3 text-[#0D89CB]" :stroke-width="2.5" />
                <span class="text-xs font-bold text-[#0D89CB]">{{ conductoresEnRuta }}</span>
                <span class="text-xs text-gray-400">en ruta</span>
              </div>
              <div v-if="kpis.atrasados > 0"
                class="inline-flex items-center gap-1.5 bg-red-50 rounded-full border border-red-200 px-3.5 py-1.5">
                <AlertTriangle class="w-3 h-3 text-red-500" :stroke-width="2.5" />
                <span class="text-xs font-bold text-red-700">{{ kpis.atrasados }} atrasado{{ kpis.atrasados > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="kpis.medias > 0"
                class="inline-flex items-center gap-1.5 bg-amber-50 rounded-full border border-amber-200 px-3.5 py-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                <span class="text-xs font-bold text-amber-700">{{ kpis.medias }} media{{ kpis.medias > 1 ? 's' : '' }}</span>
              </div>
              <div v-if="kpis.urgentes > 0"
                class="inline-flex items-center gap-1.5 bg-red-50 rounded-full border border-red-200 px-3.5 py-1.5">
                <Flame class="w-3 h-3 text-red-500" :stroke-width="2.5" />
                <span class="text-xs font-bold text-red-700">{{ kpis.urgentes }} alto{{ kpis.urgentes > 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
          <router-link to="/admin/pedidos" class="btn-primary text-sm shadow-sm flex-shrink-0">
            <ClipboardList class="w-4 h-4" :stroke-width="1.75" />
            Ver Pedidos
          </router-link>
        </div>

        <!-- ── Alertas inteligentes — solo cuando hay problemas ── -->
        <Transition name="fade">
          <div v-if="alertas.length" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="a in alertas" :key="a.key"
              class="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              :class="a.bg">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse"
                :class="a.iconBg">
                <component :is="a.icon" class="w-4 h-4" :class="a.iconColor" :stroke-width="2.5" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold leading-tight" :class="a.textColor">{{ a.title }}</p>
                <p class="text-xs mt-0.5" :class="a.subColor">{{ a.sub }}</p>
              </div>
              <router-link to="/admin/pedidos"
                class="text-xs font-bold flex-shrink-0 hover:underline" :class="a.linkColor">
                Ver →
              </router-link>
            </div>
          </div>
        </Transition>

        <!-- ── KPI Strip ── -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div v-for="kpi in bigKpis" :key="kpi.label"
            class="bg-white rounded-2xl border border-black/[0.06] shadow-soft px-5 py-4 flex flex-col
                   hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-widest leading-none">{{ kpi.label }}</span>
            <div class="flex items-end justify-between gap-2 mt-2">
              <span class="font-serif text-3xl font-bold leading-none" :class="kpi.color">{{ kpi.value }}</span>
              <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="kpi.iconBg">
                <component :is="kpi.icon" class="w-4 h-4" :class="kpi.iconColor" :stroke-width="2" />
              </div>
            </div>
            <!-- Sparkline SVG — solo en "Total" -->
            <svg v-if="kpi.sparkline" viewBox="0 0 70 20" class="w-full h-5 mt-2.5" preserveAspectRatio="none">
              <polyline
                :points="kpi.sparkline"
                fill="none" stroke="currentColor"
                :class="kpi.sparkColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <!-- ── Progress bars ── -->
        <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft px-6 py-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="font-semibold text-gray-900">Progreso General</h2>
              <p class="text-xs text-gray-400 mt-0.5">{{ kpis.total }} pedidos en total</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-serif text-2xl font-bold text-gray-900">{{ completadoPct }}</span>
              <span class="text-sm font-normal text-gray-400">% completado</span>
            </div>
          </div>
          <!-- Tricolor bar -->
          <div class="flex gap-1 h-3 rounded-full overflow-hidden mb-5">
            <div class="bg-amber-400 transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.pendientes, 0.1) }"></div>
            <div class="bg-[#0D89CB] transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.enProceso, 0.1) }"></div>
            <div class="bg-emerald-400 transition-all duration-700 rounded-full" :style="{ flex: Math.max(kpis.completados, 0.1) }"></div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div v-for="bar in progressBars" :key="bar.label" class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full flex-shrink-0" :class="bar.dot"></div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium text-gray-500">{{ bar.label }}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-xs font-bold text-gray-700">{{ bar.count }}</span>
                    <span class="text-xs text-gray-400">({{ bar.pct }}%)</span>
                  </div>
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

          <!-- Card 2: Progreso por área + week bars -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h3 class="font-semibold text-gray-900">Por Área</h3>
                <p class="text-xs text-gray-400 mt-0.5">Completados</p>
              </div>
              <div class="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                <BarChart2 class="w-4 h-4 text-gray-400" :stroke-width="1.75" />
              </div>
            </div>
            <div class="space-y-3.5">
              <div v-for="area in areaStats" :key="area.name">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-sm font-medium text-gray-700 capitalize">{{ area.name }}</span>
                  <span class="text-xs text-gray-400 font-semibold">{{ area.completados }} / {{ kpis.total }}</span>
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
              <div class="flex items-center justify-between mb-3">
                <p class="text-xs text-gray-400">Pedidos — últimos 7 días</p>
                <span class="text-[11px] text-gray-300 font-medium">{{ weekBars.reduce((s,b)=>s+b.total,0) }} total</span>
              </div>
              <div class="flex items-end justify-between gap-1.5 h-20">
                <div v-for="(bar, i) in weekBars" :key="i" class="flex-1 flex flex-col items-center gap-1">
                  <span class="text-[11px] font-semibold leading-none"
                    :class="bar.total > 0 ? (bar.active ? 'text-[#0D89CB]' : 'text-gray-500') : 'text-transparent'">
                    {{ bar.total || 0 }}
                  </span>
                  <div class="w-full rounded-t transition-all duration-500"
                    :class="bar.active ? 'bg-gradient-to-t from-[#0D89CB] to-[#5BB8E8]' : 'bg-gray-100 hover:bg-gray-200'"
                    :style="{ height: Math.max((bar.total / maxBar) * 56, bar.total > 0 ? 6 : 2) + 'px' }">
                  </div>
                  <span class="text-[11px] font-medium"
                    :class="bar.active ? 'text-[#0D89CB] font-bold' : 'text-gray-400'">{{ bar.day }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 3: Estado circular + mini list -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-semibold text-gray-900">Estado General</h3>
                <p class="text-xs text-gray-400 mt-0.5">Pedidos del mes</p>
              </div>
            </div>
            <!-- Circular gauge -->
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
                    :class="p.prioridad === 'alto' ? 'bg-red-500' :
                            p.prioridad === 'medio'   ? 'bg-amber-400' : 'bg-emerald-400'">
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
            <div v-if="conductoresEnRuta === 0"
              class="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <div class="bg-white rounded-xl px-5 py-4 text-center shadow-sm border border-gray-100">
                <Truck class="w-8 h-8 text-gray-300 mx-auto mb-2" :stroke-width="1.5" />
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
                    <Package class="w-3.5 h-3.5 text-gray-400" :stroke-width="1.75" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-semibold text-gray-900 truncate">#{{ p.numero_pedido }}</span>
                      <span v-if="p.prioridad === 'alto'"
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
              <Trash2 class="w-7 h-7 text-red-500" :stroke-width="2" />
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
import PedidoModal   from '../../components/shared/PedidoModal.vue'
import { useAuthStore }    from '../../stores/auth.js'
import { usePedidosStore } from '../../stores/pedidos.js'
import { useGpsStore }     from '../../stores/gps.js'
import {
  ClipboardList, BarChart2, Truck, Trash2,
  AlertTriangle, Flame, XCircle,
  Package, Activity, CheckCircle2,
  AlertOctagon, TrendingDown
} from 'lucide-vue-next'

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
  { label:'Pendientes',  pct: pendientePct.value,  count: kpis.value.pendientes,  color:'bg-amber-400',   dot:'bg-amber-400'   },
  { label:'En proceso',  pct: procesoPct.value,    count: kpis.value.enProceso,   color:'bg-[#0D89CB]',   dot:'bg-[#0D89CB]'   },
  { label:'Completados', pct: completadoPct.value, count: kpis.value.completados, color:'bg-emerald-400', dot:'bg-emerald-400' },
])

// ── Week bars ──
const weekBars = computed(() => {
  const dias  = []
  const LABEL = ['D','L','M','M','J','V','S']
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
    const iso = d.toISOString().slice(0,10)
    let total = 0
    if (resumen.value?.porDia?.length) {
      const found = resumen.value.porDia.find(r => r.dia?.slice(0,10) === iso)
      total = Number(found?.total) || 0
    } else {
      total = pedidosStore.pedidos.filter(p =>
        p.fecha_creacion?.slice(0,10) === iso || p.created_at?.slice(0,10) === iso
      ).length
    }
    dias.push({ day: LABEL[d.getDay()], total, active: i === 0 })
  }
  return dias
})
const maxBar = computed(() => Math.max(...weekBars.value.map(b => b.total), 1))

// ── Pedidos creados hoy ──
const pedidosHoy = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  if (resumen.value?.porDia?.length) {
    const found = resumen.value.porDia.find(r => r.dia?.slice(0, 10) === today)
    return Number(found?.total) || 0
  }
  return weekBars.value.find(b => b.active)?.total || 0
})

// ── Sparkline para la KPI "Total" (polyline SVG, datos de últimos 7 días) ──
const sparklinePoints = computed(() => {
  const bars = weekBars.value
  const max  = Math.max(...bars.map(b => b.total), 1)
  return bars.map((b, i) => {
    const x = ((i / (bars.length - 1)) * 68 + 1).toFixed(1)
    const y = (20 - (b.total / max) * 18 + 1).toFixed(1)
    return `${x},${y}`
  }).join(' ')
})

// ── Alertas inteligentes ──
const alertas = computed(() => {
  const list = []
  if (kpis.value.atrasados > 0) list.push({
    key: 'atrasados', icon: AlertTriangle,
    bg: 'bg-red-50 border border-red-100',
    iconBg: 'bg-red-100', iconColor: 'text-red-600',
    textColor: 'text-red-800', subColor: 'text-red-500', linkColor: 'text-red-600',
    title: `${kpis.value.atrasados} pedido${kpis.value.atrasados > 1 ? 's' : ''} atrasado${kpis.value.atrasados > 1 ? 's' : ''}`,
    sub: 'Requieren atención inmediata'
  })
  if (kpis.value.urgentes > 0) list.push({
    key: 'urgentes', icon: Flame,
    bg: 'bg-orange-50 border border-orange-100',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600',
    textColor: 'text-orange-800', subColor: 'text-orange-500', linkColor: 'text-orange-600',
    title: `${kpis.value.urgentes} pedido${kpis.value.urgentes > 1 ? 's' : ''} de prioridad alta`,
    sub: 'Requieren atención prioritaria'
  })
  if (incidenciasActivas.value > 0) list.push({
    key: 'incidencias', icon: XCircle,
    bg: 'bg-rose-50 border border-rose-100',
    iconBg: 'bg-rose-100', iconColor: 'text-rose-600',
    textColor: 'text-rose-800', subColor: 'text-rose-500', linkColor: 'text-rose-600',
    title: `${incidenciasActivas.value} incidencia${incidenciasActivas.value > 1 ? 's' : ''} activa${incidenciasActivas.value > 1 ? 's' : ''}`,
    sub: 'Entregas no completadas'
  })
  return list
})

// ── KPIs strip — Lucide icons, sparkline en Total ──
const bigKpis = computed(() => [
  {
    label: 'Total',
    value: kpis.value.total,
    color: 'text-gray-900',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-500',
    icon: Package,
    sparkline: sparklinePoints.value,
    sparkColor: 'text-gray-400'
  },
  {
    label: 'En Proceso',
    value: kpis.value.enProceso,
    color: 'text-[#0D89CB]',
    iconBg: 'bg-blue-50',
    iconColor: 'text-[#0D89CB]',
    icon: Activity
  },
  {
    label: 'Completados',
    value: kpis.value.completados,
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    icon: CheckCircle2
  },
  {
    label: 'Atrasados',
    value: kpis.value.atrasados,
    color: kpis.value.atrasados > 0 ? 'text-red-600' : 'text-gray-400',
    iconBg: kpis.value.atrasados > 0 ? 'bg-red-50' : 'bg-gray-100',
    iconColor: kpis.value.atrasados > 0 ? 'text-red-500' : 'text-gray-400',
    icon: TrendingDown
  },
  {
    label: 'Alto',
    value: kpis.value.urgentes,
    color: kpis.value.urgentes > 0 ? 'text-red-600' : 'text-gray-400',
    iconBg: kpis.value.urgentes > 0 ? 'bg-red-50' : 'bg-gray-100',
    iconColor: kpis.value.urgentes > 0 ? 'text-red-500' : 'text-gray-400',
    icon: Flame
  },
  {
    label: 'Incidencias',
    value: incidenciasActivas.value,
    color: incidenciasActivas.value > 0 ? 'text-rose-600' : 'text-gray-400',
    iconBg: incidenciasActivas.value > 0 ? 'bg-rose-50' : 'bg-gray-100',
    iconColor: incidenciasActivas.value > 0 ? 'text-rose-500' : 'text-gray-400',
    icon: AlertOctagon
  },
])

// ── Area stats ──
const areaStats = computed(() => [
  { name:'ventas',       barColor:'bg-[#0D89CB]',   completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='ventas')?.estatus==='completado').length },
  { name:'produccion',   barColor:'bg-orange-400',  completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='produccion')?.estatus==='completado').length },
  { name:'contabilidad', barColor:'bg-emerald-400', completados: pedidosStore.pedidos.filter(p => p.areas?.find(a => a.area==='contabilidad')?.estatus==='completado').length },
])

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

// ── Mapa monitoreo (dashboard) ──
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
  _dashPollTimer = setInterval(() => gpsStore.fetchUbicaciones(), 10_000)
  await nextTick()
  initDashMap()
  updateDashMarkers(gpsStore.ubicaciones)
})

onUnmounted(() => {
  if (_dashPollTimer) { clearInterval(_dashPollTimer); _dashPollTimer = null }
})
</script>
