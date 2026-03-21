<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-header-lg lg:pt-0 lg:ml-60 pb-nav lg:pb-0 page-enter">
      <div class="max-w-7xl mx-auto px-5 py-8 space-y-5">

        <!-- Header -->
        <div class="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 class="font-serif text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
            <p class="text-gray-400 text-sm mt-0.5">{{ pedidosStore.pedidosFiltrados.length }} resultado(s)</p>
          </div>
          <div class="flex gap-2.5 flex-wrap">
            <!-- Export dropdown -->
            <div class="relative">
              <button
                @click="showExportMenu = !showExportMenu"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-semibold transition-colors">
                <Download class="w-4 h-4" :stroke-width="1.75" />
                Exportar ▾
              </button>
              <Transition name="fade">
                <div v-if="showExportMenu" class="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <button @click="exportarCSV(); showExportMenu = false"
                    class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <FileText class="w-4 h-4 text-gray-400" :stroke-width="1.75" />
                    Exportar CSV
                  </button>
                  <button @click="exportarPDF(); showExportMenu = false"
                    class="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <FileText class="w-4 h-4 text-gray-400" :stroke-width="1.75" />
                    Imprimir PDF
                  </button>
                </div>
              </Transition>
            </div>

            <button @click="confirmarEliminarCompletados" class="btn-secondary text-sm">
              <Trash2 class="w-4 h-4" :stroke-width="1.75" />
              Limpiar completados
            </button>
            <button @click="showImport = true" class="btn-secondary text-sm">
              <Upload class="w-4 h-4" :stroke-width="1.75" />
              Importar Excel
            </button>
            <button @click="showCrear = true" class="btn-primary text-sm">
              <Plus class="w-4 h-4" :stroke-width="2" />
              Nuevo Pedido
            </button>
          </div>
        </div>

        <!-- Mini stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <div v-for="stat in miniStats" :key="stat.label"
            class="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="stat.iconBg">
              <svg class="w-5 h-5" :class="stat.iconColor" fill="currentColor" viewBox="0 0 20 20">
                <path :d="stat.iconPath"/>
              </svg>
            </div>
            <div>
              <p class="text-2xl font-black text-gray-900 leading-none">{{ stat.value }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
          <!-- Buscar -->
          <div class="flex-1 min-w-[160px]">
            <label class="block text-xs font-semibold text-gray-500 mb-1.5">Buscar pedido</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" :stroke-width="1.75" />
              <input
                v-model="busqueda"
                @input="pedidosStore.setFiltro('texto', busqueda)"
                class="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                placeholder="Número de pedido..."
              />
            </div>
          </div>

          <!-- Estado -->
          <div class="w-40">
            <label class="block text-xs font-semibold text-gray-500 mb-1.5">Estado</label>
            <select v-model="filtroEstatus" @change="pedidosStore.setFiltro('estatus', filtroEstatus)"
              class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En Proceso</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          <!-- Vista -->
          <div class="w-36">
            <label class="block text-xs font-semibold text-gray-500 mb-1.5">Vista</label>
            <select v-model="filtroCompletados" @change="pedidosStore.setFiltro('completados', filtroCompletados)"
              class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option :value="null">Todos</option>
              <option :value="false">Activos</option>
              <option :value="true">Completados</option>
            </select>
          </div>

          <!-- Prioridad -->
          <div class="w-36">
            <label class="block text-xs font-semibold text-gray-500 mb-1.5">Prioridad</label>
            <select v-model="filtroPrioridad" @change="pedidosStore.setFiltro('prioridad', filtroPrioridad)"
              class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
              <option value="">Todas</option>
              <option value="alto">🔴 Alto</option>
              <option value="medio">🟡 Medio</option>
              <option value="bajo">🟢 Bajo</option>
            </select>
          </div>

          <!-- Limpiar -->
          <button
            @click="limpiarFiltros"
            class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-medium transition-colors">
            <X class="w-4 h-4" :stroke-width="1.75" />
            Limpiar
          </button>
        </div>

        <!-- Mobile: Tarjetas -->
        <div class="md:hidden space-y-3">
          <div v-if="pedidosStore.loading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="skeleton h-24 rounded-2xl"></div>
          </div>
          <div v-else-if="pedidosPagina.length === 0"
            class="bg-white rounded-2xl border border-gray-100 text-center py-12 text-gray-400 text-sm">
            Sin pedidos con los filtros aplicados
          </div>
          <div v-else v-for="p in pedidosPagina" :key="p.id"
            @click="abrirModal(p)"
            class="bg-white rounded-2xl border shadow-soft overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
            :class="p.retrasado ? 'border-red-200' : 'border-gray-100'">
            <!-- Franja de prioridad -->
            <div class="h-1 w-full"
              :class="{
                'bg-red-500':     p.prioridad === 'alto',
                'bg-amber-400':   p.prioridad === 'medio',
                'bg-emerald-400': p.prioridad === 'bajo' || !p.prioridad
              }"></div>
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-gray-900">#{{ p.numero_pedido }}</span>
                    <span v-if="p.retrasado"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-800 text-white">Atrasado</span>
                  </div>
                  <p v-if="p.cliente_nombre" class="text-xs text-gray-500 mt-0.5">{{ p.cliente_nombre }}</p>
                </div>
                <button @click.stop="onDeleteRequest(p.id)"
                  class="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash2 class="w-4 h-4" :stroke-width="1.75" />
                </button>
              </div>
              <!-- Prioridad + fecha -->
              <div class="flex items-center justify-between text-xs mb-3">
                <span class="inline-flex items-center gap-1.5 font-semibold"
                  :class="{
                    'text-red-600':     p.prioridad === 'alto',
                    'text-amber-600':   p.prioridad === 'medio',
                    'text-emerald-600': p.prioridad === 'bajo' || !p.prioridad
                  }">
                  <span class="w-2 h-2 rounded-full flex-shrink-0"
                    :class="{
                      'bg-red-500':     p.prioridad === 'alto',
                      'bg-amber-400':   p.prioridad === 'medio',
                      'bg-emerald-400': p.prioridad === 'bajo' || !p.prioridad
                    }"></span>
                  {{ p.prioridad === 'alto' ? 'Alto' : p.prioridad === 'medio' ? 'Medio' : 'Bajo' }}
                </span>
                <span class="text-gray-400">Entrega: <strong class="text-gray-600">{{ formatDate(p.fecha_entrega) }}</strong></span>
              </div>
              <div class="flex items-center gap-2 flex-wrap">
                <StatusBadge v-for="a in p.areas" :key="a.area" :status="a.estatus" />
              </div>
            </div>
          </div>
          <!-- Paginación mobile -->
          <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
            <p class="text-xs text-gray-400">{{ (page-1)*perPage + 1 }}–{{ Math.min(page*perPage, pedidosStore.pedidosFiltrados.length) }} de {{ pedidosStore.pedidosFiltrados.length }}</p>
            <div class="flex gap-2">
              <button @click="page--" :disabled="page===1"
                class="px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-40">← Ant</button>
              <button @click="page++" :disabled="page===totalPages"
                class="px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600 border-gray-200 hover:bg-gray-50 disabled:opacity-40">Sig →</button>
            </div>
          </div>
        </div>

        <!-- Tabla escritorio -->
        <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          <!-- Loading -->
          <div v-if="pedidosStore.loading" class="flex items-center justify-center py-16 text-gray-400 gap-2">
            <Loader2 class="w-5 h-5 animate-spin text-gray-300" :stroke-width="2" />
            Cargando pedidos...
          </div>

          <div v-else>
            <!-- Header tabla -->
            <div class="grid grid-cols-8 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <span class="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedido</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prioridad</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Creación</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entrega</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ventas</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contabilidad</span>
              <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Producción</span>
            </div>

            <!-- Vacío -->
            <div v-if="pedidosPagina.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
              <Archive class="w-12 h-12 text-gray-200 mb-3" :stroke-width="1.5" />
              <p class="text-sm font-medium">Sin pedidos con los filtros aplicados</p>
            </div>

            <!-- Filas -->
            <div
              v-for="p in pedidosPagina" :key="p.id"
              @click="abrirModal(p)"
              class="grid grid-cols-8 items-center px-5 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
              :class="{ 'bg-red-50/40 hover:bg-red-50/60': p.retrasado }">

              <!-- Pedido -->
              <div class="col-span-2 flex items-center gap-3">
                <div class="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                  <ClipboardList class="w-4 h-4 text-gray-500" :stroke-width="1.75" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-sm font-bold text-gray-900">#{{ p.numero_pedido }}</span>
                    <span v-if="p.retrasado"
                      class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-800 text-white leading-none">
                      Atrasado
                    </span>
                  </div>
                  <p v-if="p.cliente_nombre" class="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{{ p.cliente_nombre }}</p>
                  <p v-if="p.metros_cuadrados" class="text-xs text-gray-400 leading-none">{{ parseFloat(p.metros_cuadrados).toFixed(2) }} m²</p>
                </div>
              </div>

              <!-- Prioridad -->
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :class="{
                    'bg-red-500':     p.prioridad === 'alto',
                    'bg-amber-400':   p.prioridad === 'medio',
                    'bg-emerald-400': p.prioridad === 'bajo' || !p.prioridad
                  }"></span>
                <span class="text-xs font-semibold"
                  :class="{
                    'text-red-600':     p.prioridad === 'alto',
                    'text-amber-600':   p.prioridad === 'medio',
                    'text-emerald-600': p.prioridad === 'bajo' || !p.prioridad
                  }">
                  {{ p.prioridad === 'alto' ? 'Alto' : p.prioridad === 'medio' ? 'Medio' : 'Bajo' }}
                </span>
              </div>

              <span class="text-xs text-gray-400">{{ formatDate(p.fecha_creacion) }}</span>
              <span class="text-sm text-gray-600 font-medium">{{ formatDate(p.fecha_entrega) }}</span>
              <div><StatusBadge :status="getArea(p,'ventas')" /></div>
              <div><StatusBadge :status="getArea(p,'contabilidad')" /></div>
              <div class="flex items-center justify-end gap-2">
                <StatusBadge :status="getArea(p,'produccion')" />
                <button
                  @click.stop="onDeleteRequest(p.id)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-all">
                  <Trash2 class="w-3.5 h-3.5" :stroke-width="1.75" />
                </button>
              </div>
            </div>

            <!-- Paginación -->
            <div v-if="totalPages > 1"
              class="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
              <p class="text-xs text-gray-400">
                {{ (page-1)*perPage + 1 }}–{{ Math.min(page*perPage, pedidosStore.pedidosFiltrados.length) }}
                de {{ pedidosStore.pedidosFiltrados.length }} pedidos
              </p>
              <div class="flex gap-1.5">
                <button @click="page--" :disabled="page===1"
                  class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Anterior
                </button>
                <button @click="page++" :disabled="page===totalPages"
                  class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ══ MODAL CREAR PEDIDO ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCrear"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          @mousedown.self="showCrear = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 class="text-lg font-bold text-gray-900">Nuevo Pedido</h2>
              <button @click="showCrear = false"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
            <form @submit.prevent="crearPedido" class="p-6 space-y-4 overflow-y-auto" novalidate>

              <!-- Número + Fecha -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nº Pedido <span class="text-red-500">*</span>
                  </label>
                  <input v-model="nuevoPedido.numero_pedido"
                    @input="formErrors.numero_pedido = ''"
                    class="w-full border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 transition-colors"
                    :class="formErrors.numero_pedido ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-gray-300'"
                    placeholder="GC-2025-001"/>
                  <p v-if="formErrors.numero_pedido" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle class="w-3 h-3 flex-shrink-0" :stroke-width="2" />
                    {{ formErrors.numero_pedido }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                    Fecha de Entrega <span class="text-red-500">*</span>
                  </label>
                  <input v-model="nuevoPedido.fecha_entrega" type="date"
                    @change="formErrors.fecha_entrega = ''"
                    class="w-full border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                    :class="formErrors.fecha_entrega ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-gray-300'"/>
                  <p v-if="formErrors.fecha_entrega" class="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle class="w-3 h-3 flex-shrink-0" :stroke-width="2" />
                    {{ formErrors.fecha_entrega }}
                  </p>
                </div>
              </div>

              <!-- Prioridad — semáforo -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Prioridad</label>
                <div class="flex gap-2">
                  <label class="flex-1 flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
                    :class="nuevoPedido.prioridad === 'bajo' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'">
                    <input type="radio" v-model="nuevoPedido.prioridad" value="bajo" class="accent-emerald-600"/>
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span class="text-sm font-medium text-gray-700">Bajo</span>
                  </label>
                  <label class="flex-1 flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
                    :class="nuevoPedido.prioridad === 'medio' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:bg-amber-50/50'">
                    <input type="radio" v-model="nuevoPedido.prioridad" value="medio" class="accent-amber-500"/>
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                    <span class="text-sm font-medium text-amber-700">Medio</span>
                  </label>
                  <label class="flex-1 flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors"
                    :class="nuevoPedido.prioridad === 'alto' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-red-50/50'">
                    <input type="radio" v-model="nuevoPedido.prioridad" value="alto" class="accent-red-500"/>
                    <span class="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0"></span>
                    <span class="text-sm font-medium text-red-700">Alto</span>
                  </label>
                </div>
              </div>

              <!-- Cliente -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cliente <span class="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <input v-model="nuevoPedido.cliente_nombre"
                  class="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                  placeholder="Nombre del cliente"/>
              </div>

              <!-- Dirección -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Dirección de entrega <span class="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <input v-model="nuevoPedido.direccion_entrega"
                  class="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400"
                  placeholder="Calle, colonia, ciudad..."/>
              </div>

              <!-- Medidas -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Medidas <span class="text-gray-400 font-normal text-xs">(metros — opcional)</span>
                </label>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <input v-model="nuevoPedido.alto" type="number" min="0" step="0.01"
                      @input="formErrors.alto = ''"
                      class="w-full border rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 text-sm transition-colors"
                      :class="formErrors.alto ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-gray-300'"
                      placeholder="Alto (m)"/>
                    <p v-if="formErrors.alto" class="text-xs text-red-500 mt-0.5">{{ formErrors.alto }}</p>
                  </div>
                  <div>
                    <input v-model="nuevoPedido.ancho" type="number" min="0" step="0.01"
                      @input="formErrors.ancho = ''"
                      class="w-full border rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 text-sm transition-colors"
                      :class="formErrors.ancho ? 'border-red-400 ring-1 ring-red-400 bg-red-50' : 'border-gray-300'"
                      placeholder="Ancho (m)"/>
                    <p v-if="formErrors.ancho" class="text-xs text-red-500 mt-0.5">{{ formErrors.ancho }}</p>
                  </div>
                  <div>
                    <input v-model="nuevoPedido.cantidad" type="number" min="1" step="1"
                      class="w-full border border-gray-300 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                      placeholder="Piezas"/>
                  </div>
                </div>
                <!-- Preview m² -->
                <div v-if="m2Preview" class="mt-2 flex items-center gap-1.5 text-sm text-emerald-700 font-semibold bg-emerald-50 rounded-lg px-3 py-2">
                  <CheckCircle2 class="w-4 h-4" :stroke-width="2" />
                  {{ m2Preview }} m² totales
                </div>
              </div>

              <!-- Material de Inventario -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Material de vidrio
                  <span class="text-gray-400 font-normal text-xs">(opcional — descuenta stock automáticamente)</span>
                </label>
                <select v-model="nuevoPedido.inventario_id"
                  class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  <option :value="null">— Sin material vinculado —</option>
                  <option v-for="m in inventarioStore.materiales" :key="m.id" :value="m.id">
                    {{ m.tipo }}{{ m.color ? ` (${m.color})` : '' }}{{ m.espesor_mm ? ` · ${m.espesor_mm}mm` : '' }} — stock: {{ parseFloat(m.stock_m2).toFixed(2) }} m²
                  </option>
                </select>
                <!-- Info de stock del material seleccionado -->
                <div v-if="materialSeleccionado" class="mt-2 flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl"
                  :class="stockSuficiente ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'">
                  <CheckCircle2 v-if="stockSuficiente" class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" :stroke-width="2" />
                  <AlertCircle v-else class="w-3.5 h-3.5 mt-0.5 flex-shrink-0" :stroke-width="2" />
                  <span v-if="stockSuficiente">
                    Stock disponible: <strong>{{ parseFloat(materialSeleccionado.stock_m2).toFixed(4) }} m²</strong>
                    <template v-if="m2Preview"> — quedará
                      <strong>{{ (parseFloat(materialSeleccionado.stock_m2) - parseFloat(m2Preview)).toFixed(4) }} m²</strong>
                      tras crear este pedido
                    </template>
                  </span>
                  <span v-else>
                    ⚠ Stock insuficiente: disponible
                    <strong>{{ parseFloat(materialSeleccionado.stock_m2).toFixed(4) }} m²</strong>,
                    este pedido requiere <strong>{{ m2Preview }} m²</strong>
                  </span>
                </div>
              </div>

              <!-- Especificaciones -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                  Especificaciones <span class="text-gray-400 font-normal text-xs">(opcional)</span>
                </label>
                <textarea v-model="nuevoPedido.especificaciones" rows="2"
                  class="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder-gray-400 text-sm resize-none"
                  placeholder="Tipo de vidrio, color, acabado..."/>
              </div>

              <div v-if="crearError" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                {{ crearError }}
              </div>
              <div class="flex gap-3 pt-1">
                <button type="button" @click="showCrear = false; resetNuevoPedido()"
                  class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" :disabled="creando"
                  class="flex-1 py-3 rounded-xl bg-[#0D89CB] hover:bg-[#00659C] text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm">
                  <svg v-if="creando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ creando ? 'Creando...' : 'Crear Pedido' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <PedidoModal v-model="showModal" :pedido="pedidoSeleccionado"
      @delete="onDeleteRequest"
      @updated="pedidosStore.fetchPedidos()" />

    <!-- ══ CONFIRM ELIMINAR PEDIDO ══ -->
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
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Eliminar pedido</h3>
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

    <!-- ══ CONFIRM LIMPIAR COMPLETADOS ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmLimpiar" class="modal-overlay" @mousedown.self="showConfirmLimpiar = false">
          <div class="bg-white rounded-2xl shadow-modal border border-black/[0.06] w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Limpiar completados</h3>
            <p class="text-sm text-gray-500 mb-6">Se eliminarán todos los pedidos con estado completado.</p>
            <div class="flex gap-3">
              <button @click="showConfirmLimpiar = false" class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button @click="ejecutarLimpiar"
                class="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 transition-all">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ MODAL IMPORTAR DESDE EXCEL ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showImport"
          class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          @mousedown.self="cerrarImport">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 class="text-lg font-bold text-gray-900">Importar Pedidos desde Excel</h2>
                <div class="flex items-center gap-2 mt-1">
                  <span v-for="n in 3" :key="n"
                    class="h-1.5 rounded-full transition-all"
                    :class="[importStep >= n ? 'bg-gray-900' : 'bg-gray-200', n === 1 ? 'w-8' : 'w-6']"/>
                  <span class="text-xs text-gray-400 ml-1">Paso {{ importStep }} de 3</span>
                </div>
              </div>
              <button @click="cerrarImport"
                class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Paso 1: Subir archivo -->
            <div v-if="importStep === 1" class="p-8 flex flex-col items-center gap-5">
              <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="text-center">
                <p class="text-gray-800 font-semibold text-base">Selecciona tu archivo Excel</p>
                <p class="text-sm text-gray-400 mt-1">Formatos soportados: .xlsx, .xls, .csv</p>
              </div>

              <!-- Drop zone -->
              <label class="cursor-pointer w-full max-w-sm">
                <input ref="fileInputImport" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileUpload"/>
                <div class="flex flex-col items-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-[#0D89CB] hover:bg-blue-50/20 transition-all">
                  <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  <span class="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl">Elegir archivo</span>
                  <span class="text-xs text-gray-400">{{ importFileName || 'Ningún archivo seleccionado' }}</span>
                </div>
              </label>

              <!-- Hint de columnas -->
              <div class="text-xs text-gray-400 bg-gray-50 rounded-xl px-5 py-4 w-full max-w-sm space-y-1">
                <p class="font-semibold text-gray-600 mb-2">📋 Columnas reconocidas automáticamente:</p>
                <p><span class="text-gray-500">Numero, Pedido, Folio</span> → <strong>Nº Pedido</strong></p>
                <p><span class="text-gray-500">Fecha, Entrega, Fecha Entrega</span> → <strong>Fecha de Entrega</strong></p>
                <p><span class="text-gray-500">Cliente, Customer</span> → <strong>Cliente</strong></p>
                <p><span class="text-gray-500">Alto, Ancho, Cantidad</span> → <strong>Medidas</strong></p>
              </div>
            </div>

            <!-- Paso 2: Mapear columnas -->
            <div v-if="importStep === 2" class="p-6 overflow-y-auto">
              <p class="text-sm text-gray-500 mb-4">
                Vincula las columnas de tu Excel con los campos del sistema.
                Los campos con <span class="text-red-500 font-bold">*</span> son obligatorios.
              </p>
              <div class="space-y-3">
                <div v-for="field in importFields" :key="field.key" class="flex items-center gap-3">
                  <label class="w-44 text-sm font-medium text-gray-700 flex-shrink-0">
                    {{ field.label }}
                    <span v-if="field.required" class="text-red-500">*</span>
                  </label>
                  <select v-model="importMapping[field.key]"
                    class="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                    :class="field.required && !importMapping[field.key] ? 'border-amber-300 bg-amber-50' : ''">
                    <option value="">— No importar —</option>
                    <option v-for="h in importHeaders" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <svg v-if="importMapping[field.key]" class="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div class="flex gap-3 mt-6">
                <button @click="importStep = 1" class="btn-secondary flex-1 justify-center">← Volver</button>
                <button @click="aplicarMapeo"
                  :disabled="!importMapping.numero_pedido || !importMapping.fecha_entrega"
                  class="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm disabled:opacity-40 transition-opacity">
                  Ver Vista Previa →
                </button>
              </div>
            </div>

            <!-- Paso 3: Vista previa + importar -->
            <div v-if="importStep === 3" class="p-6 overflow-y-auto flex flex-col gap-4">
              <p class="text-sm text-gray-600">
                Se importarán <strong class="text-gray-900">{{ importPreview.length }}</strong> pedido(s).
                Verifica los datos antes de continuar.
              </p>

              <!-- Tabla preview -->
              <div class="overflow-x-auto rounded-xl border border-gray-100 max-h-64">
                <table class="w-full text-xs min-w-[460px]">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th class="px-3 py-2.5 text-left text-gray-500 font-semibold">#Pedido</th>
                      <th class="px-3 py-2.5 text-left text-gray-500 font-semibold">F. Entrega</th>
                      <th class="px-3 py-2.5 text-left text-gray-500 font-semibold">Cliente</th>
                      <th class="px-3 py-2.5 text-left text-gray-500 font-semibold">m²</th>
                      <th class="px-3 py-2.5 text-left text-gray-500 font-semibold">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in importPreview" :key="idx"
                      class="border-t border-gray-50 hover:bg-gray-50/80">
                      <td class="px-3 py-2 font-medium text-gray-900">{{ row.numero_pedido || '—' }}</td>
                      <td class="px-3 py-2 text-gray-600">{{ row.fecha_entrega || '—' }}</td>
                      <td class="px-3 py-2 text-gray-500 max-w-[120px] truncate">{{ row.cliente_nombre || '—' }}</td>
                      <td class="px-3 py-2 text-gray-600">
                        {{ (row.alto && row.ancho)
                            ? (parseFloat(row.alto) * parseFloat(row.ancho) * (parseInt(row.cantidad) || 1)).toFixed(2)
                            : '—' }}
                      </td>
                      <td class="px-3 py-2">
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          :class="row.prioridad === 'alto' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'">
                          {{ row.prioridad || 'bajo' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Resultado de importación -->
              <div v-if="importResult" class="rounded-xl px-4 py-3 text-sm"
                :class="importResult.errores.length ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'">
                <p class="font-semibold text-gray-800">
                  ✅ {{ importResult.creados }} pedido(s) importados correctamente
                </p>
                <div v-if="importResult.errores.length" class="mt-2 space-y-0.5">
                  <p class="text-xs font-semibold text-amber-700">Errores ({{ importResult.errores.length }}):</p>
                  <p v-for="e in importResult.errores" :key="e.numero_pedido" class="text-xs text-amber-600">
                    • {{ e.numero_pedido }}: {{ e.error }}
                  </p>
                </div>
              </div>

              <div class="flex gap-3">
                <button @click="importStep = 2" :disabled="importando || !!importResult"
                  class="btn-secondary flex-1 justify-center disabled:opacity-40">← Mapeo</button>
                <button v-if="!importResult" @click="ejecutarImport" :disabled="importando"
                  class="flex-1 py-2.5 rounded-xl bg-[#0D89CB] hover:bg-[#00659C] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                  <svg v-if="importando" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ importando ? 'Importando...' : `Importar ${importPreview.length} pedido(s)` }}
                </button>
                <button v-else @click="finalizarImport"
                  class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">
                  Listo ✓
                </button>
              </div>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style>
@media print {
  /* Ocultar nav, filtros, botones, paginación */
  nav, .admin-navbar, [class*="AdminNavBar"],
  .flex.gap-2\\.5, button, select, input,
  .modal-overlay, .fixed { display: none !important; }

  body, .min-h-screen { background: white !important; }
  .bg-white { box-shadow: none !important; }
  .grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }

  .max-w-7xl { max-width: 100% !important; padding: 0 !important; }
  main { padding-top: 0 !important; }
}
</style>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'
import AdminNavBar  from '../../components/admin/AdminNavBar.vue'
import StatusBadge  from '../../components/shared/StatusBadge.vue'
import PedidoModal  from '../../components/shared/PedidoModal.vue'
import { usePedidosStore }     from '../../stores/pedidos.js'
import { useInventarioStore }  from '../../stores/inventario.js'
import { Download, FileText, Trash2, Upload, Plus, Search, X, Loader2, Archive, ClipboardList, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

const pedidosStore    = usePedidosStore()
const inventarioStore = useInventarioStore()
const toast           = inject('toast')

const busqueda           = ref('')
const filtroEstatus      = ref('')
const filtroCompletados  = ref(null)
const filtroPrioridad    = ref('')
const showCrear          = ref(false)
const showModal          = ref(false)
const showExportMenu     = ref(false)
const pedidoSeleccionado = ref(null)
const creando            = ref(false)
const crearError         = ref('')
const nuevoPedido        = ref({
  numero_pedido: '', fecha_entrega: '',
  cliente_nombre: '', direccion_entrega: '',
  alto: '', ancho: '', cantidad: 1,
  prioridad: 'bajo', especificaciones: '',
  inventario_id: null
})
const page               = ref(1)
const perPage            = 15
const formErrors         = ref({})

const kpis = computed(() => pedidosStore.kpis)

const miniStats = computed(() => [
  { label:'Total Pedidos', value: kpis.value.total,       iconBg:'bg-yellow-100',  iconColor:'text-yellow-600',  iconPath:'M4 3a2 2 0 100 4h12a2 2 0 100-4H4zM3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' },
  { label:'En Proceso',    value: kpis.value.enProceso,   iconBg:'bg-blue-100',    iconColor:'text-blue-600',    iconPath:'M13 10V3L4 14h7v7l9-11h-7z' },
  { label:'Completados',   value: kpis.value.completados, iconBg:'bg-emerald-100', iconColor:'text-emerald-600', iconPath:'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' },
  { label:'Pendientes',    value: kpis.value.pendientes,  iconBg:'bg-amber-100',   iconColor:'text-amber-600',   iconPath:'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
  { label:'Atrasados',     value: kpis.value.atrasados,   iconBg:'bg-red-100',     iconColor:'text-red-600',     iconPath:'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' },
  { label:'Alto',          value: kpis.value.urgentes,    iconBg:'bg-red-100',     iconColor:'text-red-600',     iconPath:'M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' },
])

// Preview m² reactivo en el modal
const m2Preview = computed(() => {
  const a = parseFloat(nuevoPedido.value.alto)
  const b = parseFloat(nuevoPedido.value.ancho)
  const c = parseInt(nuevoPedido.value.cantidad) || 1
  if (a > 0 && b > 0) return (a * b * c).toFixed(4)
  return null
})

// Material de inventario seleccionado y validación de stock
const materialSeleccionado = computed(() =>
  inventarioStore.materiales.find(m => m.id === nuevoPedido.value.inventario_id) || null
)
const stockSuficiente = computed(() => {
  if (!materialSeleccionado.value) return true
  if (!m2Preview.value) return true
  return parseFloat(materialSeleccionado.value.stock_m2) >= parseFloat(m2Preview.value)
})

// ── Excel Import state ────────────────────────────────────────────────────
const showImport      = ref(false)
const importStep      = ref(1)        // 1=upload, 2=mapping, 3=preview
const importFileName  = ref('')
const importHeaders   = ref([])
const importRows      = ref([])
const importMapping   = ref({})       // systemField → excelColumn
const importPreview   = ref([])
const importando      = ref(false)
const importResult    = ref(null)
const fileInputImport = ref(null)

const importFields = [
  { key: 'numero_pedido',    label: 'Nº Pedido',        required: true  },
  { key: 'fecha_entrega',    label: 'Fecha de Entrega', required: true  },
  { key: 'cliente_nombre',   label: 'Cliente',          required: false },
  { key: 'direccion_entrega',label: 'Dirección',        required: false },
  { key: 'alto',             label: 'Alto (m)',         required: false },
  { key: 'ancho',            label: 'Ancho (m)',        required: false },
  { key: 'cantidad',         label: 'Cantidad (pzas)',  required: false },
  { key: 'prioridad',        label: 'Prioridad',        required: false },
  { key: 'especificaciones', label: 'Especificaciones', required: false },
]

function autoMapHeaders(headers) {
  const mapping = {}
  const rules = {
    numero_pedido:    ['numero pedido', '#pedido', 'n.pedido', 'numpedido', 'order', 'folio', 'pedido', 'numero', '#'],
    fecha_entrega:    ['fecha entrega', 'fecha_entrega', 'entrega', 'delivery', 'fecha', 'date'],
    cliente_nombre:   ['cliente', 'client', 'customer', 'nombre cliente', 'razon social', 'razón social'],
    direccion_entrega:['direccion', 'dirección', 'address', 'domicilio'],
    alto:             ['alto', 'height', 'h', 'altura'],
    ancho:            ['ancho', 'width', 'w', 'anchura'],
    cantidad:         ['cantidad', 'qty', 'piezas', 'pieces', 'cant'],
    prioridad:        ['prioridad', 'priority'],
    especificaciones: ['especificaciones', 'specs', 'notas', 'descripcion', 'descripción', 'notes'],
  }
  for (const [field, keywords] of Object.entries(rules)) {
    for (const header of headers) {
      const h = header.toLowerCase().trim()
      if (keywords.some(k => h.includes(k) || k.includes(h))) {
        if (!mapping[field]) { mapping[field] = header; break }
      }
    }
  }
  return mapping
}

function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (data.length < 2) { toast.add({ type: 'error', message: 'El archivo parece estar vacío' }); return }
      const headers = data[0].map(h => String(h).trim()).filter(h => h)
      const rows    = data.slice(1).filter(row => row.some(cell => cell !== ''))
      importHeaders.value = headers
      importRows.value    = rows
      importMapping.value = autoMapHeaders(headers)
      importStep.value = 2
    } catch (err) {
      toast.add({ type: 'error', message: 'Error al leer el archivo: ' + err.message })
    }
  }
  reader.readAsBinaryString(file)
}

function aplicarMapeo() {
  const headers = importHeaders.value
  const rows    = importRows.value
  const mapping = importMapping.value
  const preview = rows.map(row => {
    const obj = {}
    for (const [field, col] of Object.entries(mapping)) {
      if (!col) continue
      const idx = headers.indexOf(col)
      if (idx === -1) continue
      let val = row[idx]
      // Excel date objects → ISO string
      if (field === 'fecha_entrega' && val instanceof Date) {
        val = val.toISOString().split('T')[0]
      } else if (field === 'fecha_entrega' && typeof val === 'number') {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000))
        val = d.toISOString().split('T')[0]
      } else {
        val = val !== undefined && val !== null ? String(val).trim() : ''
      }
      obj[field] = val
    }
    if (obj.prioridad) {
      const p = obj.prioridad.toLowerCase()
      obj.prioridad = (p.includes('alto') || p.includes('urgent')) ? 'alto' : 'bajo'
    }
    return obj
  }).filter(p => p.numero_pedido)

  importPreview.value = preview
  importStep.value = 3
}

async function ejecutarImport() {
  importando.value = true
  try {
    const { data } = await axios.post('/api/pedidos/importar', { pedidos: importPreview.value })
    importResult.value = data
    if (data.creados > 0) {
      await pedidosStore.fetchPedidos()
      toast.add({ type: 'success', message: `${data.creados} pedido(s) importados correctamente` })
    }
  } catch (e) {
    toast.add({ type: 'error', message: e.response?.data?.message || 'Error al importar' })
  } finally {
    importando.value = false
  }
}

function finalizarImport() { cerrarImport() }

function cerrarImport() {
  showImport.value    = false
  importStep.value    = 1
  importFileName.value = ''
  importHeaders.value  = []
  importRows.value     = []
  importMapping.value  = {}
  importPreview.value  = []
  importResult.value   = null
  importando.value     = false
  if (fileInputImport.value) fileInputImport.value.value = ''
}

const totalPages    = computed(() => Math.max(1, Math.ceil(pedidosStore.pedidosFiltrados.length / perPage)))
const pedidosPagina = computed(() => {
  const start = (page.value - 1) * perPage
  return pedidosStore.pedidosFiltrados.slice(start, start + perPage)
})

function getArea(p, area) {
  return p.areas?.find(a => a.area === area)?.estatus || 'pendiente'
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}
function abrirModal(p) { pedidoSeleccionado.value = p; showModal.value = true }
function limpiarFiltros() {
  pedidosStore.limpiarFiltros()
  busqueda.value = ''
  filtroEstatus.value = ''
  filtroCompletados.value = null
  filtroPrioridad.value = ''
  page.value = 1
}

function resetNuevoPedido() {
  nuevoPedido.value = {
    numero_pedido: '', fecha_entrega: '',
    cliente_nombre: '', direccion_entrega: '',
    alto: '', ancho: '', cantidad: 1,
    prioridad: 'bajo', especificaciones: '',
    inventario_id: null
  }
  formErrors.value = {}
  crearError.value  = ''
}

function validarForm() {
  const e = {}
  if (!nuevoPedido.value.numero_pedido?.trim())
    e.numero_pedido = 'El número de pedido es obligatorio'
  if (!nuevoPedido.value.fecha_entrega)
    e.fecha_entrega = 'Selecciona la fecha de entrega'
  const a = parseFloat(nuevoPedido.value.alto)
  const b = parseFloat(nuevoPedido.value.ancho)
  if (!isNaN(a) && a > 0 && (isNaN(b) || b <= 0))
    e.ancho = 'Ingresa el ancho si proporcionas el alto'
  if (!isNaN(b) && b > 0 && (isNaN(a) || a <= 0))
    e.alto = 'Ingresa el alto si proporcionas el ancho'
  formErrors.value = e
  return Object.keys(e).length === 0
}

async function crearPedido() {
  if (!validarForm()) return
  crearError.value = ''
  creando.value = true
  try {
    await pedidosStore.crearPedido(nuevoPedido.value)
    showCrear.value = false
    toast.add({ type: 'success', message: `Pedido #${nuevoPedido.value.numero_pedido} creado` })
    resetNuevoPedido()
  } catch (e) {
    crearError.value = e.response?.data?.message || 'Error al crear'
  } finally {
    creando.value = false
  }
}

const showConfirmDelete  = ref(false)
const showConfirmLimpiar = ref(false)
const pedidoAEliminar    = ref(null)

function onDeleteRequest(id) { pedidoAEliminar.value = id; showConfirmDelete.value = true }

async function ejecutarEliminar() {
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

async function confirmarEliminarCompletados() {
  showConfirmLimpiar.value = true
}

async function ejecutarLimpiar() {
  try {
    await pedidosStore.eliminarCompletados()
    showConfirmLimpiar.value = false
    toast.add({ type: 'success', title: 'Listo', message: 'Pedidos completados eliminados.' })
  } catch {
    showConfirmLimpiar.value = false
    toast.add({ type: 'error', title: 'Error', message: 'No se pudo limpiar.' })
  }
}

/* ── Exportar CSV ── */
function exportarCSV() {
  const lista = pedidosStore.pedidosFiltrados
  const BOM   = '\uFEFF'
  const cols  = ['Pedido','Cliente','Creación','Entrega','Prioridad','Ventas','Contabilidad','Producción','m²','Merma m²','Merma desc','Retrasado']
  const rows  = lista.map(p => [
    p.numero_pedido,
    p.cliente_nombre || '',
    p.fecha_creacion || '',
    p.fecha_entrega  || '',
    p.prioridad      || 'bajo',
    getArea(p, 'ventas'),
    getArea(p, 'contabilidad'),
    getArea(p, 'produccion'),
    p.metros_cuadrados != null ? p.metros_cuadrados : '',
    p.merma_m2         != null ? p.merma_m2         : '',
    p.merma_descripcion || '',
    p.retrasado ? 'Sí' : 'No'
  ].map(v => `"${String(v).replace(/"/g, '""')}"`))

  const csv  = BOM + [cols.map(c => `"${c}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `pedidos_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ── Exportar PDF (imprimir) ── */
function exportarPDF() {
  window.print()
}

onMounted(() => {
  pedidosStore.fetchPedidos()
  inventarioStore.fetchMateriales()
})
</script>
