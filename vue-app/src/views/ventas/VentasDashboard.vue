<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <!-- ── Header fijo ── -->
    <header class="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/[0.06] flex items-center px-4 gap-3 shadow-soft">
      <div class="flex items-center gap-2 flex-1">
        <img src="/icons/logo.jpg" class="w-7 h-7 rounded-lg object-contain" alt="Glass Caribe"/>
        <span class="font-bold text-gray-900 text-sm tracking-wide">Glass Caribe</span>
      </div>
      <!-- User avatar dropdown -->
      <div class="relative" ref="userMenuRef">
        <button @click="userMenuOpen = !userMenuOpen"
          class="w-8 h-8 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
          {{ initials }}
        </button>
        <Transition name="slide">
          <div v-if="userMenuOpen"
            class="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-float overflow-hidden z-50">
            <router-link to="/chat" @click="userMenuOpen = false"
              class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Chat del equipo
            </router-link>
            <button @click="showCambiarPass = true; userMenuOpen = false"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              Cambiar contraseña
            </button>
            <div class="border-t border-gray-100 my-1"></div>
            <button @click="cerrarSesion"
              class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Cerrar sesión
            </button>
          </div>
        </Transition>
      </div>
    </header>

    <main class="pt-14 page-enter">

      <!-- ── Banner de bienvenida ── -->
      <div class="bg-white border-b border-gray-100 px-5 py-5 lg:px-8">
        <div class="max-w-5xl mx-auto">
          <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">Ventas · Glass Caribe</p>
          <h1 class="font-serif text-xl font-bold text-gray-900 mt-0.5">{{ auth.user?.nombre?.split(' ')[0] }}, aquí están tus pedidos</h1>
          <p class="text-xs text-gray-400 mt-0.5">{{ fechaHoy }}</p>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-4 py-5 lg:px-8 space-y-5 pb-24 sm:pb-8">

        <!-- ── KPIs ── -->
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          <div class="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-gray-100 text-center">
            <div class="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-1.5">
              <svg class="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <p class="text-xl font-black text-gray-900">{{ pedidosStore.kpis.total }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5 leading-tight">Total</p>
          </div>
          <div class="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-amber-100 text-center">
            <div class="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-1.5">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-xl font-black text-amber-500">{{ pedidosStore.kpis.enProceso }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5 leading-tight">En Proceso</p>
          </div>
          <div class="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-emerald-100 text-center">
            <div class="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1.5">
              <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-xl font-black text-emerald-500">{{ pedidosStore.kpis.completados }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5 leading-tight">Listos</p>
          </div>
          <div class="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-red-100 text-center">
            <div class="w-7 h-7 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-1.5">
              <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-xl font-black text-red-500">{{ pedidosStore.kpis.atrasados }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5 leading-tight">Atrasados</p>
          </div>
          <div class="bg-white rounded-2xl px-3 py-3.5 shadow-sm border border-orange-100 text-center">
            <div class="w-7 h-7 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-1.5">
              <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <p class="text-xl font-black text-orange-500">{{ pedidosStore.kpis.urgentes }}</p>
            <p class="text-[10px] text-gray-400 mt-0.5 leading-tight">Urgentes</p>
          </div>
        </div>

        <!-- ── Filtros rápidos ── -->
        <div class="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 no-scrollbar">
          <button
            v-for="f in filtrosRapidos" :key="f.value"
            @click="filtroActivo = f.value; aplicarFiltro(f.value)"
            class="px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border flex-shrink-0"
            :class="filtroActivo === f.value
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'"
          >{{ f.label }}</button>
        </div>

        <!-- ── Loading ── -->
        <div v-if="pedidosStore.loading" class="flex flex-col items-center gap-3 py-16 text-gray-400">
          <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span class="text-sm">Cargando pedidos...</span>
        </div>

        <!-- ── Lista de pedidos ── -->
        <div v-else class="space-y-3">

          <!-- Empty state -->
          <div v-if="pedidosStore.pedidosFiltrados.length === 0" class="flex flex-col items-center gap-3 py-16">
            <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-500">Sin pedidos aquí</p>
            <p class="text-xs text-gray-400">El administrador creará los pedidos</p>
          </div>

          <div
            v-for="p in pedidosStore.pedidosFiltrados"
            :key="p.id"
            class="bg-white rounded-2xl shadow-sm border transition-colors overflow-hidden"
            :class="p.retrasado ? 'border-red-200' : 'border-gray-100 hover:border-gray-200'"
          >
            <!-- Franja de alerta atrasado -->
            <div v-if="p.retrasado" class="bg-red-500 px-4 py-1.5 flex items-center gap-2">
              <svg class="w-3.5 h-3.5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              <span class="text-xs font-bold text-white">Pedido atrasado — entrega vencida</span>
            </div>

            <div class="p-4">
              <!-- Cabecera: número + badges + chat icon -->
              <div class="flex items-start justify-between gap-2 mb-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="font-black text-gray-900 text-base">#{{ p.numero_pedido }}</p>
                    <span v-if="p.prioridad === 'urgente'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 leading-none">
                      <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      Urgente
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                    <span v-if="p.cliente_nombre" class="font-medium text-gray-600 truncate">{{ p.cliente_nombre }}</span>
                    <span v-if="p.cliente_nombre && p.metros_cuadrados" class="text-gray-300">·</span>
                    <span v-if="p.metros_cuadrados">{{ parseFloat(p.metros_cuadrados).toFixed(2) }} m²</span>
                    <span class="text-gray-300">·</span>
                    <span>{{ formatDate(p.fecha_entrega) }}</span>
                  </div>
                </div>
                <!-- Botón Chat siempre visible -->
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

              <!-- Pipeline visual: Ventas → Contabilidad → Producción -->
              <div class="flex items-center gap-1 mb-4">
                <template v-for="(a, idx) in p.areas" :key="a.area">
                  <div class="flex items-center gap-1 flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 flex-1">
                      <div
                        class="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                        :class="{
                          'bg-emerald-500': a.estatus === 'completado',
                          'bg-amber-400':   a.estatus === 'en proceso',
                          'bg-gray-200':    a.estatus === 'pendiente'
                        }"
                      >
                        <svg v-if="a.estatus === 'completado'" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                        <div v-else-if="a.estatus === 'en proceso'" class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                        <div v-else class="w-2 h-2 rounded-full bg-gray-400"></div>
                      </div>
                      <span class="text-[10px] font-semibold truncate"
                        :class="{
                          'text-emerald-600': a.estatus === 'completado',
                          'text-amber-600':   a.estatus === 'en proceso',
                          'text-gray-400':    a.estatus === 'pendiente'
                        }">
                        {{ areaLabel(a.area) }}
                      </span>
                    </div>
                    <!-- Línea conectora (excepto en el último) -->
                    <div v-if="idx < p.areas.length - 1" class="h-px flex-1 bg-gray-200 mx-1"></div>
                  </div>
                </template>
              </div>

              <!-- Acciones Ventas -->
              <div class="flex gap-2">
                <button
                  v-if="getVentas(p) === 'pendiente'"
                  @click="actualizarEstatus(p, 'en proceso')"
                  :disabled="updating[p.id]"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-blue-200"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>
                  Iniciar en Ventas
                </button>

                <button
                  v-if="getVentas(p) === 'en proceso'"
                  @click="actualizarEstatus(p, 'completado')"
                  :disabled="updating[p.id]"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm shadow-emerald-200"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  Marcar Listo
                </button>

                <span v-if="getVentas(p) === 'completado'"
                  class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-400 text-sm font-semibold">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Ventas completada
                </span>
              </div>

              <!-- Nota de ventas: siempre visible si existe, con opción de editar -->
              <div class="mt-3 pt-3 border-t border-gray-50">
                <div v-if="getVentasNota(p) && !expandidos[p.id]" class="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                  <svg class="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  <p class="text-xs text-blue-700 flex-1">{{ getVentasNota(p) }}</p>
                  <button @click="toggleExpandido(p.id)" class="text-[10px] font-semibold text-blue-500 hover:text-blue-700 flex-shrink-0 ml-1">Editar</button>
                </div>
                <div v-else class="flex items-center gap-2">
                  <button
                    v-if="!expandidos[p.id]"
                    @click="toggleExpandido(p.id)"
                    class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors py-1"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Agregar nota para producción
                  </button>
                </div>

                <Transition name="slide">
                  <div v-if="expandidos[p.id]" class="mt-2 space-y-2">
                    <div class="flex gap-2">
                      <input
                        v-model="notas[p.id]"
                        type="text"
                        :placeholder="getVentasNota(p) || 'Escribe una nota para producción...'"
                        class="flex-1 text-xs bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 placeholder-gray-400"
                        @keydown.enter.prevent="guardarNota(p)"
                      />
                      <button
                        @click="guardarNota(p)"
                        :disabled="!notas[p.id]?.trim() || guardandoNota[p.id]"
                        class="bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-colors"
                      >{{ guardandoNota[p.id] ? '...' : 'Guardar' }}</button>
                      <button @click="expandidos[p.id] = false; notas[p.id] = ''" class="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ── Modal detalle / chat ── -->
    <PedidoModal
      v-model="showModal"
      :pedido="pedidoSeleccionado"
      @updated="pedidosStore.fetchPedidos()"
    />

    <!-- ── Modal cambiar contraseña ── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCambiarPass"
          class="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          @click.self="cerrarCambiarPass">
          <div class="bg-white rounded-2xl shadow-modal w-full max-w-sm p-6 space-y-4" @click.stop>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900">Cambiar contraseña</h3>
              <button @click="cerrarCambiarPass"
                class="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Contraseña actual</label>
                <input v-model="passActual" type="password" autocomplete="current-password"
                  placeholder="••••••••"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                  @keyup.enter="guardarPassword"/>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
                <input v-model="passNueva" type="password" autocomplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-all"
                  @keyup.enter="guardarPassword"/>
              </div>
              <p v-if="passError" class="text-xs text-red-500 font-medium">{{ passError }}</p>
            </div>
            <div class="flex gap-2 pt-1">
              <button @click="cerrarCambiarPass"
                class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="guardarPassword" :disabled="guardandoPass"
                class="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1B3A5C] hover:bg-[#152d47] disabled:opacity-50 transition-colors">
                {{ guardandoPass ? 'Guardando…' : 'Cambiar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import StatusBadge  from '../../components/shared/StatusBadge.vue'
import PedidoModal  from '../../components/shared/PedidoModal.vue'
import { useAuthStore }          from '../../stores/auth.js'
import { usePedidosStore }       from '../../stores/pedidos.js'
import { useNotificationsStore } from '../../stores/notifications.js'

const auth         = useAuthStore()
const pedidosStore = usePedidosStore()
const notifs       = useNotificationsStore()
const toast        = inject('toast', { add: () => {} })
const router       = useRouter()

const fechaHoy = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })

// ── Avatar dropdown ──
const userMenuRef  = ref(null)
const userMenuOpen = ref(false)

// ── Cambiar contraseña ──
const showCambiarPass = ref(false)
const passActual      = ref('')
const passNueva       = ref('')
const passError       = ref('')
const guardandoPass   = ref(false)

const initials = computed(() =>
  (auth.user?.nombre || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
)

function cerrarCambiarPass() {
  showCambiarPass.value = false
  passActual.value = ''
  passNueva.value  = ''
  passError.value  = ''
}

async function guardarPassword() {
  passError.value = ''
  if (!passActual.value || !passNueva.value)
    return (passError.value = 'Completa ambos campos')
  if (passNueva.value.length < 6)
    return (passError.value = 'La nueva contraseña debe tener mínimo 6 caracteres')
  guardandoPass.value = true
  try {
    await axios.patch('/api/auth/cambiar-password', {
      password_actual: passActual.value,
      nueva_password:  passNueva.value,
    })
    cerrarCambiarPass()
    toast.add({ type: 'success', title: '¡Listo!', message: 'Contraseña actualizada correctamente.' })
  } catch (err) {
    passError.value = err.response?.data?.message || 'Error al cambiar contraseña'
  } finally {
    guardandoPass.value = false
  }
}

async function cerrarSesion() {
  userMenuOpen.value = false
  await auth.logout()
  router.push('/')
}

function onClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target))
    userMenuOpen.value = false
}

const showModal          = ref(false)
const pedidoSeleccionado = ref(null)
const filtroActivo       = ref('todos')
const updating           = ref({})
const expandidos         = reactive({})
const notas              = reactive({})
const guardandoNota      = reactive({})

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

onMounted(() => {
  pedidosStore.fetchPedidos()
  notifs.startPolling()
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all .2s ease }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px) }
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
.no-scrollbar::-webkit-scrollbar { display: none }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none }
</style>
