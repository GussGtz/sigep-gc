<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-14 lg:pt-0 lg:ml-60 pb-20 lg:pb-0 page-enter">
      <div class="max-w-7xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Encabezado ── -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-serif text-2xl font-bold text-gray-900">Conductores</h1>
            <p class="text-sm text-gray-400 mt-0.5">Gestión de entregas y conductores asignados</p>
          </div>
          <button
            @click="abrirModalNuevo"
            class="btn-primary text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nueva Entrega
          </button>
        </div>

        <!-- ── KPI Cards ── -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            v-for="stat in stats" :key="stat.label"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ stat.label }}</span>
              <span class="w-8 h-8 rounded-xl flex items-center justify-center" :class="stat.iconBg">
                <svg class="w-4 h-4" :class="stat.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="stat.icon"/>
                </svg>
              </span>
            </div>
            <p class="text-3xl font-black text-gray-900">{{ stat.value }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ stat.sub }}</p>
          </div>
        </div>

        <!-- ── Barra de filtros ── -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Buscador -->
            <div class="relative flex-1">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
              </svg>
              <input
                v-model="busqueda"
                placeholder="Buscar por conductor o pedido..."
                class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 placeholder-gray-400"
              />
            </div>
            <!-- Estado -->
            <select
              v-model="filtroEstado"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 min-w-[160px]"
            >
              <option value="">Todos los estados</option>
              <option value="asignada">Asignada</option>
              <option value="en_camino">En Camino</option>
              <option value="entregada">Entregada</option>
              <option value="incidencia">Incidencia</option>
            </select>
            <!-- Limpiar -->
            <button
              v-if="busqueda || filtroEstado"
              @click="busqueda = ''; filtroEstado = ''"
              class="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        <!-- ── Tabla de entregas ── -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <!-- Cabecera tabla -->
          <div class="grid grid-cols-6 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</div>
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Conductor</div>
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente / Destino</div>
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</div>
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</div>
            <div class="col-span-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="py-16 flex flex-col items-center gap-3 text-gray-400">
            <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-sm">Cargando entregas...</span>
          </div>

          <!-- Vacío -->
          <div v-else-if="entregasFiltradas.length === 0" class="py-16 flex flex-col items-center gap-3">
            <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Sin entregas registradas</p>
            <p class="text-xs text-gray-300">Prueba ajustando los filtros</p>
          </div>

          <!-- Filas -->
          <template v-else>
            <div
              v-for="e in entregasPagina" :key="e.id"
              @click="abrirDetalle(e)"
              class="grid grid-cols-6 gap-2 items-center px-5 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
            >
              <!-- Número pedido -->
              <div class="col-span-1">
                <span class="text-sm font-bold text-gray-900">#{{ e.numero_pedido || e.id }}</span>
              </div>
              <!-- Conductor -->
              <div class="col-span-1 flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {{ iniciales(e.conductor_nombre) }}
                </div>
                <span class="text-sm text-gray-700 font-medium truncate">{{ e.conductor_nombre || '—' }}</span>
              </div>
              <!-- Cliente / Destino -->
              <div class="col-span-1">
                <p class="text-sm text-gray-700 font-medium truncate">{{ e.cliente_nombre || '—' }}</p>
                <p class="text-xs text-gray-400 truncate">{{ e.direccion_entrega || '' }}</p>
              </div>
              <!-- Fecha -->
              <div class="col-span-1">
                <span class="text-sm text-gray-600">{{ formatFecha(e.fecha_entrega || e.created_at) }}</span>
              </div>
              <!-- Estado -->
              <div class="col-span-1 flex items-center gap-2 flex-wrap">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold" :class="estadoClase(e.estado)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="estadoDot(e.estado)"></span>
                  {{ estadoLabel(e.estado) }}
                </span>
                <button v-if="e.estado === 'incidencia'"
                  @click.stop="abrirDetalle(e)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold hover:bg-emerald-200 transition-colors">
                  ↺ Reasignar
                </button>
              </div>
              <!-- Acciones -->
              <div class="col-span-1 flex justify-end gap-1">
                <button
                  @click.stop="cambiarEstado(e)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
                  title="Cambiar estado"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
                <button
                  @click.stop="confirmarEliminar(e)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all"
                  title="Eliminar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </template>

          <!-- Paginación -->
          <div v-if="totalPaginas > 1" class="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p class="text-xs text-gray-400">
              {{ (paginaActual - 1) * porPagina + 1 }}–{{ Math.min(paginaActual * porPagina, entregasFiltradas.length) }}
              de {{ entregasFiltradas.length }} entregas
            </p>
            <div class="flex gap-2">
              <button
                @click="paginaActual--"
                :disabled="paginaActual === 1"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >← Anterior</button>
              <button
                @click="paginaActual++"
                :disabled="paginaActual === totalPaginas"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >Siguiente →</button>
            </div>
          </div>
        </div>

        <!-- ── Mapa GPS en tiempo real ── -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 class="font-bold text-gray-900 text-sm">GPS en tiempo real</h3>
              <p class="text-xs text-gray-400 mt-0.5">Conductores activos (últimos 5 min)</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs text-gray-500">{{ conductoresGPS }} en ruta</span>
              </div>
              <button v-if="conductoresGPS > 0" @click="centerMap"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#1B3A5C] bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-100">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Centrar
              </button>
            </div>
          </div>
          <!-- Contenedor del mapa + overlay — relative para posicionamiento correcto -->
          <div class="relative">
            <div id="mapa-conductores" class="w-full h-72 z-0"></div>
            <!-- Overlay "sin conductores": cubre SOLO el mapa, no el header -->
            <div v-if="conductoresGPS === 0"
              class="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
              <div class="bg-white rounded-xl px-5 py-4 text-center shadow-sm border border-gray-100">
                <svg class="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                </svg>
                <p class="text-sm text-gray-500 font-medium">Sin conductores activos</p>
                <p class="text-xs text-gray-400 mt-0.5">Los conductores aparecerán aquí cuando inicien su turno</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Card: Lista de conductores ── -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-bold text-gray-900 text-sm">Conductores registrados</h3>
            <span class="text-xs text-gray-400">
              {{ conductores.filter(c => c.en_turno).length }} en turno · {{ conductores.length }} total
            </span>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-if="conductores.length === 0" class="py-8 text-center text-sm text-gray-400">
              Sin conductores registrados
            </div>
            <div
              v-for="c in conductores" :key="c.id"
              class="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              :class="c.en_turno ? 'bg-emerald-50/40' : ''"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2"
                  :class="c.en_turno ? 'bg-emerald-600 ring-emerald-300' : 'bg-gray-900 ring-transparent'"
                >
                  {{ iniciales(c.nombre) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-gray-900">{{ c.nombre }}</p>
                    <span v-if="c.en_turno"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      <span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      En turno
                    </span>
                  </div>
                  <p class="text-xs text-gray-400">{{ c.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500">
                  {{ entregasDeConductor(c.id) }} entrega{{ entregasDeConductor(c.id) !== 1 ? 's' : '' }}
                </span>
                <span class="w-2 h-2 rounded-full" :class="c.activo ? 'bg-emerald-400' : 'bg-gray-300'"></span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ══ Modal nueva entrega ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          @mousedown.self="cerrarModal"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" @click.stop>
            <!-- Header modal -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 class="font-black text-gray-900 text-lg">Nueva Entrega</h2>
              <button @click="showModal = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body modal -->
            <form @submit.prevent="crearEntrega" class="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

              <!-- ── Pedido: Smart Search Combobox ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Pedido
                </label>
                <div class="relative" ref="pedidoDropdownRef">
                  <!-- Input -->
                  <div class="relative">
                    <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                    </svg>
                    <input
                      v-model="pedidoBusqueda"
                      @focus="showDropdownPedido = true"
                      @blur="setTimeout(() => showDropdownPedido = false, 150)"
                      @input="pedidoSeleccionado = null; nuevaEntrega.pedido_id = ''"
                      :placeholder="pedidoSeleccionado ? '' : 'Buscar por #número, cliente o dirección…'"
                      :readonly="!!pedidoSeleccionado"
                      class="w-full pl-9 pr-9 py-3 text-sm border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                      :class="pedidoSeleccionado
                        ? 'border-[#1B3A5C] bg-[#1B3A5C]/5 font-semibold text-[#1B3A5C] cursor-default'
                        : 'border-gray-200 placeholder-gray-400'"
                    />
                    <!-- Spinner -->
                    <div v-if="loadingPedidos && !pedidoSeleccionado"
                      class="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg class="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                    <!-- Clear -->
                    <button v-else-if="pedidoSeleccionado || pedidoBusqueda"
                      type="button" @click="limpiarPedidoSeleccionado"
                      class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                      <svg class="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Dropdown results -->
                  <Transition name="slide">
                    <div v-if="showDropdownPedido && !pedidoSeleccionado"
                      class="absolute z-30 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                      <!-- Header -->
                      <div class="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span class="text-xs font-semibold text-gray-400">
                          {{ pedidoBusqueda.trim() ? `${pedidosFiltrados.length} resultado(s)` : 'Pedidos recientes' }}
                        </span>
                        <span v-if="!pedidoBusqueda.trim()" class="text-xs text-gray-300">{{ pedidosDisponibles.length }} total</span>
                      </div>
                      <!-- Empty state -->
                      <div v-if="pedidosFiltrados.length === 0" class="py-8 text-center">
                        <svg class="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <p class="text-sm text-gray-400">Sin resultados</p>
                        <p class="text-xs text-gray-300 mt-0.5">Prueba otro término</p>
                      </div>
                      <!-- List -->
                      <div class="max-h-52 overflow-y-auto divide-y divide-gray-50">
                        <div v-for="p in pedidosFiltrados" :key="p.id"
                          @mousedown.prevent="seleccionarPedido(p)"
                          class="flex items-start gap-3 px-4 py-3 hover:bg-[#1B3A5C]/5 cursor-pointer transition-colors group">
                          <!-- Priority badge -->
                          <span class="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                            :class="{
                              'bg-red-100 text-red-700':    p.prioridad === 'urgente',
                              'bg-amber-100 text-amber-700': p.prioridad === 'alta',
                              'bg-gray-100 text-gray-500':   !['urgente','alta'].includes(p.prioridad)
                            }">
                            {{ p.prioridad === 'urgente' ? '🔴 Urgente' : p.prioridad === 'alta' ? '🟡 Alta' : '⚪ Normal' }}
                          </span>
                          <!-- Info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-0.5">
                              <span class="text-sm font-bold text-gray-900">#{{ p.numero_pedido }}</span>
                              <span class="text-xs text-gray-400">{{ formatFecha(p.fecha_entrega) }}</span>
                              <span v-if="p.retrasado" class="text-[10px] font-bold text-red-500">⚠ Retrasado</span>
                            </div>
                            <p v-if="p.cliente_nombre" class="text-sm text-gray-700 truncate">{{ p.cliente_nombre }}</p>
                            <p v-if="p.direccion_entrega" class="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                              <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                              </svg>
                              {{ p.direccion_entrega }}
                            </p>
                          </div>
                          <!-- Arrow -->
                          <svg class="w-4 h-4 text-gray-200 group-hover:text-[#1B3A5C] flex-shrink-0 mt-1 transition-colors"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Selected pedido card -->
                <Transition name="slide">
                  <div v-if="pedidoSeleccionado"
                    class="mt-2 p-3.5 bg-[#1B3A5C]/5 rounded-xl border border-[#1B3A5C]/20 space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-[#1B3A5C] text-sm">#{{ pedidoSeleccionado.numero_pedido }}</span>
                      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase"
                        :class="{
                          'bg-red-100 text-red-700': pedidoSeleccionado.prioridad === 'urgente',
                          'bg-amber-100 text-amber-700': pedidoSeleccionado.prioridad === 'alta',
                          'bg-gray-100 text-gray-500': !['urgente','alta'].includes(pedidoSeleccionado.prioridad)
                        }">
                        {{ pedidoSeleccionado.prioridad || 'normal' }}
                      </span>
                    </div>
                    <p v-if="pedidoSeleccionado.cliente_nombre" class="text-sm text-gray-800 font-medium">
                      {{ pedidoSeleccionado.cliente_nombre }}
                    </p>
                    <p v-if="pedidoSeleccionado.direccion_entrega" class="text-xs text-gray-500 flex items-center gap-1">
                      <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      {{ pedidoSeleccionado.direccion_entrega }}
                    </p>
                    <div v-if="pedidoSeleccionado.metros_cuadrados" class="text-xs text-gray-400">
                      {{ pedidoSeleccionado.metros_cuadrados }} m²
                      <template v-if="pedidoSeleccionado.alto && pedidoSeleccionado.ancho">
                        · {{ pedidoSeleccionado.alto }}×{{ pedidoSeleccionado.ancho }} cm
                      </template>
                      <template v-if="pedidoSeleccionado.cantidad">
                        · {{ pedidoSeleccionado.cantidad }} pieza(s)
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- ── Conductor: Visual card selector ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Conductor</label>
                <div class="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  <div v-if="conductores.length === 0" class="py-4 text-center text-sm text-gray-400">
                    Sin conductores registrados
                  </div>
                  <div v-for="c in conductores" :key="c.id"
                    @click="nuevaEntrega.conductor_id = c.id"
                    class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none"
                    :class="nuevaEntrega.conductor_id === c.id
                      ? 'border-[#1B3A5C] bg-[#1B3A5C]/5 ring-1 ring-[#1B3A5C]/20'
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'">
                    <!-- Avatar -->
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2"
                      :class="c.en_turno ? 'bg-emerald-600 ring-emerald-200' : 'bg-gray-700 ring-transparent'">
                      {{ iniciales(c.nombre) }}
                    </div>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <p class="text-sm font-semibold text-gray-900">{{ c.nombre }}</p>
                        <span v-if="c.en_turno"
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          <span class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                          En turno
                        </span>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5">
                        {{ entregasDeConductor(c.id) }} entrega(s) asignada(s)
                      </p>
                    </div>
                    <!-- Check -->
                    <Transition name="fade">
                      <div v-if="nuevaEntrega.conductor_id === c.id"
                        class="w-5 h-5 rounded-full bg-[#1B3A5C] flex items-center justify-center flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>
                      </div>
                    </Transition>
                  </div>
                </div>
              </div>

              <!-- ── Fecha de entrega ── -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Fecha de entrega
                  <span v-if="pedidoSeleccionado?.fecha_entrega"
                    class="ml-1 normal-case font-normal text-[10px] text-[#1B3A5C]">(del pedido)</span>
                </label>
                <input
                  v-model="nuevaEntrega.fecha_entrega"
                  type="date"
                  class="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 text-gray-700"
                />
              </div>

              <div v-if="modalError" class="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100">{{ modalError }}</div>
              <div class="flex gap-3 pt-1">
                <button type="button" @click="cerrarModal"
                  class="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" :disabled="guardando"
                  class="flex-1 py-3 text-sm font-semibold text-white bg-[#1B3A5C] rounded-xl hover:bg-[#152d47] disabled:opacity-50 transition-colors">
                  {{ guardando ? 'Asignando…' : 'Asignar entrega' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Modal detalle entrega ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDetalle && entregaSeleccionada"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          @mousedown.self="showDetalle = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" @click.stop>
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 class="font-black text-gray-900 text-lg">Entrega #{{ entregaSeleccionada.numero_pedido || entregaSeleccionada.id }}</h2>
                <p class="text-xs text-gray-400 mt-0.5">{{ formatFecha(entregaSeleccionada.fecha_entrega || entregaSeleccionada.created_at) }}</p>
              </div>
              <button @click="showDetalle = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <!-- Estado actual -->
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span class="text-sm font-semibold text-gray-600">Estado actual</span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold" :class="estadoClase(entregaSeleccionada.estado)">
                  <span class="w-1.5 h-1.5 rounded-full" :class="estadoDot(entregaSeleccionada.estado)"></span>
                  {{ estadoLabel(entregaSeleccionada.estado) }}
                </span>
              </div>
              <!-- Info -->
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-gray-50 rounded-xl">
                  <p class="text-xs text-gray-400 mb-1">Conductor</p>
                  <p class="text-sm font-semibold text-gray-900">{{ entregaSeleccionada.conductor_nombre || '—' }}</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-xl">
                  <p class="text-xs text-gray-400 mb-1">Cliente</p>
                  <p class="text-sm font-semibold text-gray-900">{{ entregaSeleccionada.cliente_nombre || '—' }}</p>
                </div>
                <div class="col-span-2 p-3 bg-gray-50 rounded-xl">
                  <p class="text-xs text-gray-400 mb-1">Dirección</p>
                  <p class="text-sm font-semibold text-gray-900">{{ entregaSeleccionada.direccion_entrega || '—' }}</p>
                </div>
              </div>
              <!-- Foto de evidencia (cargada lazy al abrir) -->
              <div v-if="entregaSeleccionada.foto_base64" class="space-y-2">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto de Evidencia</p>
                <img
                  :src="entregaSeleccionada.foto_base64"
                  class="w-full max-h-52 object-cover rounded-xl border border-gray-100 cursor-zoom-in"
                  @click="fotoAmpliada = entregaSeleccionada.foto_base64"
                  title="Click para ampliar"
                />
              </div>

              <!-- Motivo de incidencia + Reasignar -->
              <div v-if="entregaSeleccionada.estado === 'incidencia'" class="p-4 bg-red-50 rounded-xl border border-red-100 space-y-2">
                <p class="text-xs font-semibold text-red-600 uppercase tracking-wider">Motivo de incidencia</p>
                <p class="text-sm text-red-700">{{ entregaSeleccionada.notas || 'Sin motivo especificado' }}</p>
                <button
                  @click="iniciarReasignacion"
                  class="mt-1 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  Reasignar a otro conductor
                </button>
              </div>

              <!-- Cambiar estado -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actualizar estado</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="est in estadosOpciones" :key="est.value"
                    @click="actualizarEstado(entregaSeleccionada, est.value)"
                    :disabled="entregaSeleccionada.estado === est.value || actualizando"
                    class="py-2.5 text-xs font-semibold rounded-xl border transition-colors"
                    :class="entregaSeleccionada.estado === est.value
                      ? 'bg-gray-900 text-white border-gray-900 cursor-default'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                  >
                    {{ est.label }}
                  </button>
                </div>
              </div>
              <button @click="showDetalle = false" class="w-full py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRM ELIMINAR ENTREGA ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmDelete" class="modal-overlay" @mousedown.self="showConfirmDelete = false">
          <div class="bg-white rounded-2xl shadow-modal border border-black/[0.06] w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Eliminar entrega</h3>
            <p class="text-sm text-gray-500 mb-6">Esta acción no puede deshacerse.</p>
            <div class="flex gap-3">
              <button @click="showConfirmDelete = false" class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button @click="ejecutarEliminar"
                class="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Lightbox foto ampliada ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="fotoAmpliada"
          class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          @click="fotoAmpliada = null">
          <img :src="fotoAmpliada"
            class="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
            @click.stop />
          <button @click="fotoAmpliada = null"
            class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20
                   flex items-center justify-center text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import AdminNavBar  from '../../components/admin/AdminNavBar.vue'
import { useGpsStore } from '../../stores/gps.js'
import axios from 'axios'

const toast  = inject('toast', { add: () => {} })
const gpsStore = useGpsStore()

// ── Mapa Leaflet ────────────────────────────────────────────────────────────
let map            = null
let _mapPositioned = false   // ¿ya se centró automáticamente al menos una vez?
const markers = {}           // conductorId → L.marker

const conductoresGPS = computed(() => Object.keys(gpsStore.ubicaciones).length)

function initMap() {
  if (typeof window.L === 'undefined') return
  if (map) return
  map = window.L.map('mapa-conductores', {
    center: [20.96, -89.62],
    zoom:   12,
    zoomControl: true
  })
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)
}

function updateMarkers(ubicaciones) {
  if (!map || typeof window.L === 'undefined') return

  // Eliminar marcadores de conductores que ya no están activos
  for (const id of Object.keys(markers)) {
    if (!ubicaciones[id]) {
      map.removeLayer(markers[id])
      delete markers[id]
    }
  }

  // Crear o actualizar marcadores
  for (const [id, u] of Object.entries(ubicaciones)) {
    const firstName = (u.nombre || '').split(' ')[0]
    const ic = window.L.divIcon({
      className: '',
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <div style="background:#1B3A5C;border-radius:10px;width:38px;height:38px;
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
        <div style="background:rgba(27,58,92,.9);color:#fff;font-size:9px;font-weight:700;
          padding:1px 6px;border-radius:4px;white-space:nowrap;
          max-width:72px;overflow:hidden;text-overflow:ellipsis;font-family:sans-serif">
          ${firstName}
        </div>
      </div>`,
      iconSize:   [38, 56],
      iconAnchor: [19, 56]
    })

    const popup = `<b>${u.nombre}</b><br>
      ${u.numero_pedido ? 'Pedido #' + u.numero_pedido + '<br>' : ''}
      <small>${formatFechaGPS(u.updated_at)}</small>`

    if (markers[id]) {
      markers[id].setLatLng([u.lat, u.lng])
        .setIcon(ic)
        .setPopupContent(popup)
    } else {
      markers[id] = window.L.marker([u.lat, u.lng], { icon: ic })
        .addTo(map)
        .bindPopup(popup)
    }
  }

  // Centrar automáticamente SOLO la primera vez que hay conductores activos
  // (o cuando pasan de 0 a tener al menos 1). Después de eso el admin mueve
  // libremente el mapa sin que salte.
  const latlngs = Object.values(ubicaciones).map(u => [u.lat, u.lng])
  if (!_mapPositioned && latlngs.length > 0) {
    if (latlngs.length === 1) {
      map.setView(latlngs[0], 14)
    } else {
      map.fitBounds(latlngs, { padding: [40, 40] })
    }
    _mapPositioned = true
  }
  // Cuando ya no hay nadie activo, resetear para volver a centrar la próxima vez
  if (latlngs.length === 0) _mapPositioned = false
}

/** Centrado manual desde el botón "Centrar" */
function centerMap() {
  if (!map) return
  const latlngs = Object.values(gpsStore.ubicaciones).map(u => [u.lat, u.lng])
  if (latlngs.length === 1) {
    map.setView(latlngs[0], 14)
  } else if (latlngs.length > 1) {
    map.fitBounds(latlngs, { padding: [40, 40] })
  }
}

function formatFechaGPS(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

/* ── Estado ── */
const entregas           = ref([])
const conductores        = ref([])
const loading            = ref(true)
const busqueda           = ref('')
const filtroEstado       = ref('')
const paginaActual       = ref(1)
const porPagina          = 10
const showModal          = ref(false)
const showDetalle        = ref(false)
const entregaSeleccionada = ref(null)
const guardando          = ref(false)
const actualizando       = ref(false)
const modalError         = ref('')
const nuevaEntrega = ref({
  pedido_id:     '',
  numero_pedido: '',
  conductor_id:  '',
  fecha_entrega: ''
})

// ── Smart search pedido ────────────────────────────────────────────────────
const pedidoDropdownRef    = ref(null)
const pedidosDisponibles   = ref([])
const pedidoBusqueda       = ref('')
const pedidoSeleccionado   = ref(null)
const showDropdownPedido   = ref(false)
const loadingPedidos       = ref(false)

const pedidosFiltrados = computed(() => {
  // Excluir pedidos que ya tienen entrega activa (asignada o en_camino)
  const activosIds = new Set(
    entregas.value
      .filter(e => ['asignada', 'en_camino'].includes(e.estado))
      .map(e => e.pedido_id)
  )
  const q = pedidoBusqueda.value.trim().toLowerCase()
  let list = pedidosDisponibles.value.filter(p => {
    if (activosIds.has(p.id)) return false
    // Solo permitir asignar si producción está completada
    const prod = p.areas?.find(a => a.area === 'produccion')
    if (!prod || prod.estatus !== 'completado') return false
    return true
  })
  if (q) {
    list = list.filter(p =>
      (p.numero_pedido   || '').toLowerCase().includes(q) ||
      (p.cliente_nombre  || '').toLowerCase().includes(q) ||
      (p.direccion_entrega || '').toLowerCase().includes(q) ||
      (p.prioridad       || '').toLowerCase().includes(q)
    )
  }
  return list.slice(0, 8)
})

const estadosOpciones = [
  { value: 'asignada',    label: 'Asignada'   },
  { value: 'en_camino',   label: 'En Camino'  },
  { value: 'entregada',   label: 'Entregada'  },
  { value: 'incidencia',  label: 'Incidencia' },
]

/* ── KPIs ── */
const stats = computed(() => [
  {
    label: 'Total Entregas',
    value: entregas.value.length,
    sub: 'registradas',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600'
  },
  {
    label: 'Asignadas',
    value: entregas.value.filter(e => e.estado === 'asignada').length,
    sub: 'por salir',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'bg-orange-100', iconColor: 'text-orange-600'
  },
  {
    label: 'En Camino',
    value: entregas.value.filter(e => e.estado === 'en_camino').length,
    sub: 'en ruta ahora',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600'
  },
  {
    label: 'Entregadas',
    value: entregas.value.filter(e => e.estado === 'entregada').length,
    sub: 'completadas',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'
  },
])

/* ── Filtrado ── */
const entregasFiltradas = computed(() => {
  let list = entregas.value
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    list = list.filter(e =>
      (e.numero_pedido?.toString() || '').includes(q) ||
      (e.conductor_nombre || '').toLowerCase().includes(q) ||
      (e.cliente_nombre || '').toLowerCase().includes(q)
    )
  }
  if (filtroEstado.value) list = list.filter(e => e.estado === filtroEstado.value)
  return list
})

const totalPaginas  = computed(() => Math.ceil(entregasFiltradas.value.length / porPagina))
const entregasPagina = computed(() => {
  const start = (paginaActual.value - 1) * porPagina
  return entregasFiltradas.value.slice(start, start + porPagina)
})

/* ── Helpers visuales ── */
function estadoLabel(e) {
  return { asignada: 'Asignada', en_camino: 'En Camino', entregada: 'Entregada', incidencia: 'Incidencia' }[e] || e
}
function estadoClase(e) {
  return {
    asignada:   'bg-amber-50 text-amber-700',
    en_camino:  'bg-blue-50 text-blue-700',
    entregada:  'bg-emerald-50 text-emerald-700',
    incidencia: 'bg-red-50 text-red-700',
  }[e] || 'bg-gray-100 text-gray-600'
}
function estadoDot(e) {
  return {
    asignada:   'bg-amber-400',
    en_camino:  'bg-blue-400',
    entregada:  'bg-emerald-400',
    incidencia: 'bg-red-400',
  }[e] || 'bg-gray-400'
}
function formatFecha(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function entregasDeConductor(id) {
  return entregas.value.filter(e => e.conductor_id === id).length
}

/* ── Fetch ── */
async function fetchEntregas() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/entregas')
    entregas.value = data
  } catch {
    entregas.value = []
  } finally {
    loading.value = false
  }
}
async function fetchConductores() {
  try {
    const { data } = await axios.get('/api/usuarios?role_id=3')
    conductores.value = data
  } catch {
    conductores.value = []
  }
}

/* ── Pedido smart search ── */
async function fetchPedidos() {
  loadingPedidos.value = true
  try {
    const { data } = await axios.get('/api/pedidos')
    // Ordenar por fecha_creacion desc (ya vienen así del backend), tomar los primeros 80
    pedidosDisponibles.value = Array.isArray(data) ? data.slice(0, 80) : []
  } catch {
    pedidosDisponibles.value = []
  } finally {
    loadingPedidos.value = false
  }
}

function seleccionarPedido(p) {
  pedidoSeleccionado.value  = p
  pedidoBusqueda.value      = `#${p.numero_pedido}${p.cliente_nombre ? ' — ' + p.cliente_nombre : ''}`
  showDropdownPedido.value  = false
  nuevaEntrega.value.pedido_id     = p.id
  nuevaEntrega.value.numero_pedido = p.numero_pedido
  // Autofill fecha si el pedido la tiene y aún no se llenó
  if (p.fecha_entrega) nuevaEntrega.value.fecha_entrega = p.fecha_entrega
}

function limpiarPedidoSeleccionado() {
  pedidoSeleccionado.value         = null
  pedidoBusqueda.value             = ''
  showDropdownPedido.value         = true
  nuevaEntrega.value.pedido_id     = ''
  nuevaEntrega.value.numero_pedido = ''
  nuevaEntrega.value.fecha_entrega = ''
}

function cerrarModal() {
  showModal.value          = false
  pedidoSeleccionado.value = null
  pedidoBusqueda.value     = ''
  showDropdownPedido.value = false
  modalError.value         = ''
}

/* ── Acciones ── */
function abrirModalNuevo() {
  nuevaEntrega.value = { pedido_id: '', numero_pedido: '', conductor_id: '', fecha_entrega: '' }
  pedidoSeleccionado.value = null
  pedidoBusqueda.value     = ''
  showDropdownPedido.value = false
  modalError.value         = ''
  showModal.value          = true
  fetchPedidos()
}
async function abrirDetalle(e) {
  entregaSeleccionada.value = { ...e }
  showDetalle.value = true
  // Cargar foto en background (no está en el listado por optimización de payload)
  try {
    const { data } = await axios.get(`/api/entregas/${e.id}`)
    entregaSeleccionada.value = { ...entregaSeleccionada.value, ...data }
  } catch { /* sin foto, no bloquear */ }
}
function cambiarEstado(e) {
  abrirDetalle(e)
}

async function iniciarReasignacion() {
  const pedidoId    = entregaSeleccionada.value?.pedido_id
  const conductorId = entregaSeleccionada.value?.conductor_id
  showDetalle.value = false
  nuevaEntrega.value = { pedido_id: '', numero_pedido: '', conductor_id: '', fecha_entrega: '' }
  pedidoSeleccionado.value = null
  pedidoBusqueda.value = ''
  showDropdownPedido.value = false
  modalError.value = ''
  await fetchPedidos()
  // Pre-seleccionar el pedido de la incidencia (no está bloqueado porque es incidencia, no asignada/en_camino)
  if (pedidoId) {
    const pedido = pedidosDisponibles.value.find(p => p.id === pedidoId)
    if (pedido) seleccionarPedido(pedido)
  }
  // Pre-seleccionar el mismo conductor (el usuario puede cambiarlo si quiere asignar a otro)
  if (conductorId) nuevaEntrega.value.conductor_id = conductorId
  showModal.value = true
}

async function crearEntrega() {
  modalError.value = ''
  if (!nuevaEntrega.value.pedido_id) {
    modalError.value = 'Selecciona un pedido de la lista'
    return
  }
  if (!nuevaEntrega.value.conductor_id) {
    modalError.value = 'Selecciona un conductor'
    return
  }
  guardando.value = true
  try {
    await axios.post('/api/entregas', {
      pedido_id:     nuevaEntrega.value.pedido_id,
      conductor_id:  nuevaEntrega.value.conductor_id,
      fecha_entrega: nuevaEntrega.value.fecha_entrega || null
    })
    toast.add?.({ type: 'success', title: 'Entrega asignada', message: `Pedido #${nuevaEntrega.value.numero_pedido} asignado correctamente` })
    cerrarModal()
    await fetchEntregas()
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Error al asignar entrega'
  } finally {
    guardando.value = false
  }
}

async function actualizarEstado(entrega, nuevoEstado) {
  actualizando.value = true
  try {
    await axios.patch(`/api/entregas/${entrega.id}/estado`, { estado: nuevoEstado })
    const idx = entregas.value.findIndex(e => e.id === entrega.id)
    if (idx !== -1) entregas.value[idx].estado = nuevoEstado
    entregaSeleccionada.value.estado = nuevoEstado
    toast.add?.({ type: 'success', message: 'Estado actualizado' })
  } catch {
    toast.add?.({ type: 'error', message: 'Error al actualizar estado' })
  } finally {
    actualizando.value = false
  }
}

const fotoAmpliada       = ref(null)
const showConfirmDelete  = ref(false)
const entregaAEliminar   = ref(null)

function confirmarEliminar(e) {
  entregaAEliminar.value = e
  showConfirmDelete.value = true
}

async function ejecutarEliminar() {
  const e = entregaAEliminar.value
  if (!e) return
  try {
    await axios.delete(`/api/entregas/${e.id}`)
    entregas.value = entregas.value.filter(x => x.id !== e.id)
    showConfirmDelete.value = false
    entregaAEliminar.value = null
    toast.add({ type: 'success', title: 'Entrega eliminada', message: `Entrega #${e.numero_pedido || e.id} eliminada.` })
  } catch {
    showConfirmDelete.value = false
    toast.add({ type: 'error', title: 'Error', message: 'No se pudo eliminar la entrega.' })
  }
}

onMounted(async () => {
  await Promise.all([fetchEntregas(), fetchConductores()])
  // Inicializar mapa (Leaflet cargado via CDN en index.html)
  await new Promise(r => setTimeout(r, 100))  // pequeño delay para que el DOM esté listo
  initMap()
  // Cargar posiciones iniciales
  await gpsStore.fetchUbicaciones()
  updateMarkers(gpsStore.ubicaciones)
})

// Actualizar marcadores en tiempo real cuando lleguen updates por WS
watch(() => gpsStore.ubicaciones, (u) => updateMarkers(u), { deep: true })

onUnmounted(() => {
  if (map) { map.remove(); map = null }
  _mapPositioned = false
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
