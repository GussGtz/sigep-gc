<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <AdminNavBar />

    <main class="pt-header-lg lg:pt-0 lg:ml-60 pb-nav lg:pb-0 page-enter">
      <div class="max-w-7xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Encabezado ── -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="font-serif text-2xl font-bold text-gray-900">Usuarios</h1>
            <p class="text-sm text-gray-400 mt-0.5">Gestión de cuentas y accesos al sistema</p>
          </div>
          <button
            @click="abrirModalNuevo"
            class="btn-primary text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Nuevo Usuario
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
                placeholder="Buscar por nombre o email..."
                class="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 placeholder-gray-400"
              />
            </div>
            <!-- Rol -->
            <select
              v-model="filtroRol"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 min-w-[160px]"
            >
              <option value="">Todos los roles</option>
              <option value="1">Administrador</option>
              <option value="2">Colaborador</option>
              <option value="3">Conductor</option>
            </select>
            <!-- Departamento -->
            <select
              v-model="filtroDept"
              class="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 min-w-[160px]"
            >
              <option value="">Todos los depart.</option>
              <option value="ventas">Ventas</option>
              <option value="contabilidad">Contabilidad</option>
              <option value="produccion">Producción</option>
            </select>
            <!-- Pendientes -->
            <button
              @click="filtroEstado = filtroEstado === 'pendiente' ? '' : 'pendiente'"
              class="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-colors flex items-center gap-1.5"
              :class="filtroEstado === 'pendiente'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100'"
            >
              <span class="w-2 h-2 rounded-full bg-current"></span>
              Pendientes
              <span v-if="pendientesCount > 0" class="bg-white/30 text-current rounded-full px-1.5 text-[10px] font-bold leading-4">
                {{ pendientesCount }}
              </span>
            </button>
            <!-- Limpiar -->
            <button
              v-if="busqueda || filtroRol || filtroDept || filtroEstado"
              @click="busqueda = ''; filtroRol = ''; filtroDept = ''; filtroEstado = ''"
              class="px-4 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        <!-- ── Vista Mobile: Cards ── -->
        <div class="md:hidden space-y-3">
          <!-- Loading mobile -->
          <div v-if="loading" class="space-y-3">
            <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-3.5 bg-gray-200 rounded w-2/3"></div>
                  <div class="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Vacío mobile -->
          <div v-else-if="usuariosFiltrados.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm py-12 flex flex-col items-center gap-3">
            <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p class="text-sm text-gray-400 font-medium">Sin usuarios encontrados</p>
          </div>
          <!-- Cards mobile -->
          <div
            v-else
            v-for="u in usuariosPagina" :key="u.id"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <!-- Avatar + info -->
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  :class="avatarColor(u.role_id)"
                >{{ iniciales(u.nombre) }}</div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ u.nombre }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                </div>
              </div>
              <!-- Acciones -->
              <div class="flex gap-1 flex-shrink-0">
                <button @click="abrirEditar(u)" class="p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors" title="Editar">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  @click="toggleActivo(u)"
                  class="p-2 rounded-xl transition-colors"
                  :class="u.activo !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'"
                  :title="u.activo !== false ? 'Desactivar' : 'Activar'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      :d="u.activo !== false
                        ? 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                        : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'"/>
                  </svg>
                </button>
                <button
                  v-if="u.id !== authStore?.user?.id"
                  @click="confirmarEliminar(u)"
                  class="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Eliminar usuario"
                >
                  <Trash2 class="w-4 h-4" :stroke-width="1.75" />
                </button>
              </div>
            </div>
            <!-- Badges -->
            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold" :class="rolClase(u.role_id)">
                {{ rolLabel(u.role_id) }}
              </span>
              <span v-if="u.departamento" class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                {{ u.departamento }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                :class="u.activo !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="u.activo !== false ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"></span>
                {{ u.activo !== false ? 'Activo' : 'Pendiente' }}
              </span>
            </div>
          </div>
          <!-- Paginación mobile -->
          <div v-if="totalPaginas > 1" class="flex items-center justify-between px-1 py-2">
            <p class="text-xs text-gray-400">
              {{ (paginaActual - 1) * porPagina + 1 }}–{{ Math.min(paginaActual * porPagina, usuariosFiltrados.length) }}
              de {{ usuariosFiltrados.length }}
            </p>
            <div class="flex gap-2">
              <button @click="paginaActual--" :disabled="paginaActual === 1"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Ant.</button>
              <button @click="paginaActual++" :disabled="paginaActual === totalPaginas"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Sig. →</button>
            </div>
          </div>
        </div>

        <!-- ── Vista Desktop: Tabla ── -->
        <div class="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <!-- Cabecera tabla -->
          <div class="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div class="col-span-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuario</div>
            <div class="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Rol</div>
            <div class="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Departamento</div>
            <div class="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</div>
            <div class="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Acciones</div>
          </div>

          <!-- Loading -->
          <div v-if="loading" class="py-16 flex flex-col items-center gap-3 text-gray-400">
            <svg class="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span class="text-sm">Cargando usuarios...</span>
          </div>

          <!-- Vacío -->
          <div v-else-if="usuariosFiltrados.length === 0" class="py-16 flex flex-col items-center gap-3">
            <div class="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <svg class="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-400">Sin usuarios encontrados</p>
            <p class="text-xs text-gray-300">Prueba ajustando los filtros</p>
          </div>

          <!-- Filas -->
          <template v-else>
            <div
              v-for="u in usuariosPagina" :key="u.id"
              class="grid grid-cols-12 gap-2 items-center px-5 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors group"
            >
              <!-- Usuario info -->
              <div class="col-span-4 flex items-center gap-3">
                <div
                  class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  :class="avatarColor(u.role_id)"
                >
                  {{ iniciales(u.nombre) }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">{{ u.nombre }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                </div>
              </div>
              <!-- Rol -->
              <div class="col-span-2">
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold" :class="rolClase(u.role_id)">
                  {{ rolLabel(u.role_id) }}
                </span>
              </div>
              <!-- Departamento -->
              <div class="col-span-2">
                <span class="text-sm text-gray-600 capitalize">{{ u.departamento || '—' }}</span>
              </div>
              <!-- Estado -->
              <div class="col-span-2">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :class="u.activo !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="u.activo !== false ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'"></span>
                  {{ u.activo !== false ? 'Activo' : 'Pendiente' }}
                </span>
              </div>
              <!-- Acciones -->
              <div class="col-span-2 flex justify-end gap-1">
                <!-- Botón Aprobar visible siempre para usuarios pendientes -->
                <button
                  v-if="u.activo === false"
                  @click="toggleActivo(u)"
                  class="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors flex items-center gap-1"
                  title="Aprobar acceso"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  Aprobar
                </button>
                <button
                  @click="abrirEditar(u)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-all"
                  title="Editar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  v-if="u.activo !== false"
                  @click="toggleActivo(u)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-all"
                  title="Desactivar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                </button>
                <button
                  v-if="u.id !== authStore?.user?.id"
                  @click="confirmarEliminar(u)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Eliminar usuario"
                >
                  <Trash2 class="w-4 h-4" :stroke-width="1.75" />
                </button>
              </div>
            </div>
          </template>

          <!-- Paginación -->
          <div v-if="totalPaginas > 1" class="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p class="text-xs text-gray-400">
              {{ (paginaActual - 1) * porPagina + 1 }}–{{ Math.min(paginaActual * porPagina, usuariosFiltrados.length) }}
              de {{ usuariosFiltrados.length }} usuarios
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
        <!-- /Desktop tabla -->

        <!-- ── Cards de roles ── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Admins -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-gray-900">Administradores</p>
                <p class="text-xs text-gray-400">Acceso total al sistema</p>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="u in admins" :key="u.id" class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">{{ iniciales(u.nombre) }}</div>
                <span class="text-xs text-gray-700 truncate">{{ u.nombre }}</span>
              </div>
              <div v-if="admins.length === 0" class="text-xs text-gray-400">Sin administradores</div>
            </div>
          </div>

          <!-- Colaboradores -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-gray-900">Colaboradores</p>
                <p class="text-xs text-gray-400">Actualizar pedidos y estados</p>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="u in colaboradores" :key="u.id" class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">{{ iniciales(u.nombre) }}</div>
                <div class="flex-1 min-w-0">
                  <span class="text-xs text-gray-700 truncate block">{{ u.nombre }}</span>
                  <span class="text-[10px] text-gray-400 capitalize">{{ u.departamento }}</span>
                </div>
              </div>
              <div v-if="colaboradores.length === 0" class="text-xs text-gray-400">Sin colaboradores</div>
            </div>
          </div>

          <!-- Conductores -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg class="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1M13 16l2-7h4l2 7M13 16H9m4 0H9"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-gray-900">Conductores</p>
                <p class="text-xs text-gray-400">Gestión de entregas</p>
              </div>
            </div>
            <div class="space-y-2">
              <div v-for="u in conductoresLista" :key="u.id" class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px] font-bold">{{ iniciales(u.nombre) }}</div>
                <span class="text-xs text-gray-700 truncate">{{ u.nombre }}</span>
              </div>
              <div v-if="conductoresLista.length === 0" class="text-xs text-gray-400">Sin conductores</div>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ══ Modal crear/editar usuario ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4 max-md:pb-[74px] bg-black/30 backdrop-blur-sm"
          @mousedown.self="showModal = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" @click.stop>
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 class="font-black text-gray-900 text-lg">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
                <p class="text-xs text-gray-400 mt-0.5">{{ editando ? 'Modifica los datos del usuario' : 'Ingresa los datos del nuevo usuario' }}</p>
              </div>
              <button @click="showModal = false" class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
            <!-- Body -->
            <form @submit.prevent="guardarUsuario" class="p-6 space-y-4" novalidate>
              <!-- Nombre -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Nombre completo <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formUser.nombre"
                  @input="userFormErrors.nombre = ''"
                  placeholder="Ej: María García"
                  class="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  :class="userFormErrors.nombre
                    ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50 focus:ring-gray-900/20 focus:border-gray-400'"
                />
                <p v-if="userFormErrors.nombre" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ userFormErrors.nombre }}
                </p>
              </div>
              <!-- Email -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Correo electrónico <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formUser.email"
                  type="email"
                  @input="userFormErrors.email = ''"
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                  class="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  :class="userFormErrors.email
                    ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50 focus:ring-gray-900/20 focus:border-gray-400'"
                />
                <p v-if="userFormErrors.email" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ userFormErrors.email }}
                </p>
              </div>
              <!-- Contraseña (solo al crear) -->
              <div v-if="!editando">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contraseña <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formUser.password"
                  type="password"
                  @input="userFormErrors.password = ''"
                  placeholder="Mínimo 6 caracteres"
                  autocomplete="new-password"
                  class="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  :class="userFormErrors.password
                    ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400'
                    : 'border-gray-200 bg-gray-50 focus:ring-gray-900/20 focus:border-gray-400'"
                />
                <p v-if="userFormErrors.password" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  {{ userFormErrors.password }}
                </p>
              </div>
              <!-- Rol -->
              <div>
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rol</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="r in roles" :key="r.value"
                    type="button"
                    @click="formUser.role_id = r.value; if (r.value === 3) formUser.departamento = ''"
                    class="py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all"
                    :class="formUser.role_id === r.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'"
                  >
                    {{ r.label }}
                  </button>
                </div>
              </div>
              <!-- Departamento (solo si no es conductor) -->
              <div v-if="formUser.role_id !== 3">
                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Departamento</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="d in departamentos" :key="d.value"
                    type="button"
                    @click="formUser.departamento = d.value"
                    class="py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all capitalize"
                    :class="formUser.departamento === d.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'"
                  >
                    {{ d.label }}
                  </button>
                </div>
              </div>
              <!-- Restablecer contraseña (solo en modo edición) -->
              <div v-if="editando" class="border-t border-gray-100 pt-4">
                <button type="button" @click="showResetPass = !showResetPass"
                  class="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors">
                  🔑 {{ showResetPass ? 'Cancelar cambio de contraseña' : 'Restablecer contraseña' }}
                </button>
                <Transition name="slide">
                  <div v-if="showResetPass" class="mt-3 flex gap-2">
                    <input
                      v-model="nuevaPassAdmin"
                      type="password"
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      class="flex-1 px-3 py-2.5 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    />
                    <button type="button" @click="resetPasswordAdmin"
                      :disabled="guardandoPass"
                      class="px-4 py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {{ guardandoPass ? '...' : 'Cambiar' }}
                    </button>
                  </div>
                </Transition>
              </div>
              <!-- Error -->
              <div v-if="modalError" class="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{{ modalError }}</div>
              <!-- Botones -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button" @click="showModal = false"
                  class="flex-1 py-3 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >Cancelar</button>
                <button
                  type="submit" :disabled="guardando"
                  class="flex-1 py-3 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >{{ guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario' }}</button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ Modal confirmar eliminar usuario ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmEliminar"
          class="fixed inset-0 z-[70] flex items-center justify-center p-4 max-md:pb-[74px] bg-black/30 backdrop-blur-sm"
          @mousedown.self="showConfirmEliminar = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Eliminar usuario</h3>
            <p class="text-sm text-gray-500 mb-1 font-medium">{{ usuarioAEliminar?.nombre }}</p>
            <p class="text-xs text-gray-400 mb-6">Esta acción no puede deshacerse. Los pedidos y entregas asociados se conservarán sin referencia al usuario.</p>
            <div class="flex gap-3">
              <button @click="showConfirmEliminar = false"
                class="flex-1 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="ejecutarEliminar" :disabled="eliminando"
                class="flex-1 inline-flex items-center justify-center py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { Trash2, X } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import AdminNavBar from '../../components/admin/AdminNavBar.vue'
import { fuzzyMatch, fuzzyScore } from '../../utils/fuzzy.js'
import { useAuthStore }      from '../../stores/auth.js'
import { useWebSocketStore } from '../../stores/websocket.js'
import axios from 'axios'

const toast     = inject('toast', { add: () => {} })
const authStore = useAuthStore()
const wsStore   = useWebSocketStore()

/* ── Estado ── */
const usuarios     = ref([])
const loading      = ref(true)
const busqueda     = ref('')
const filtroRol    = ref('')
const filtroDept   = ref('')
const filtroEstado = ref('')   // '' = todos | 'pendiente' = activo=false
const paginaActual = ref(1)
const porPagina    = 10
const showModal    = ref(false)
const guardando    = ref(false)
const modalError   = ref('')
const editando        = ref(false)
const userFormErrors  = ref({})
const roles = [
  { value: 1, label: 'Admin'       },
  { value: 2, label: 'Colaborador' },
  { value: 3, label: 'Conductor'   },
]
const departamentos = [
  { value: 'ventas',       label: 'Ventas'       },
  { value: 'contabilidad', label: 'Contabilidad' },
  { value: 'produccion',   label: 'Producción'   },
]

const formUser = ref({ id: null, nombre: '', email: '', password: '', role_id: 2, departamento: 'ventas' })

// Eliminar usuario
const showConfirmEliminar = ref(false)
const usuarioAEliminar    = ref(null)
const eliminando          = ref(false)

// Restablecer contraseña (admin sobre otro usuario)
const showResetPass  = ref(false)
const nuevaPassAdmin = ref('')
const guardandoPass  = ref(false)

/* ── KPIs ── */
const stats = computed(() => [
  {
    label: 'Total',
    value: usuarios.value.length,
    sub: 'usuarios registrados',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    iconBg: 'bg-gray-100', iconColor: 'text-gray-600'
  },
  {
    label: 'Admins',
    value: usuarios.value.filter(u => u.role_id === 1).length,
    sub: 'acceso total',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    iconBg: 'bg-purple-100', iconColor: 'text-purple-600'
  },
  {
    label: 'Colaboradores',
    value: usuarios.value.filter(u => u.role_id === 2).length,
    sub: 'en distintas áreas',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600'
  },
  {
    label: 'Conductores',
    value: usuarios.value.filter(u => u.role_id === 3).length,
    sub: 'en entregas',
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600'
  },
])

/* ── Pendientes (activo = false) ── */
const pendientesCount = computed(() => usuarios.value.filter(u => u.activo === false).length)

/* ── Listas por rol ── */
const admins         = computed(() => usuarios.value.filter(u => u.role_id === 1))
const colaboradores  = computed(() => usuarios.value.filter(u => u.role_id === 2))
const conductoresLista = computed(() => usuarios.value.filter(u => u.role_id === 3))

/* ── Filtrado con fuzzy search ── */
const usuariosFiltrados = computed(() => {
  let list = usuarios.value
  if (busqueda.value.trim()) {
    const q = busqueda.value
    list = list
      .map(u => ({
        u,
        score: Math.max(fuzzyScore(u.nombre, q), fuzzyScore(u.email, q))
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ u }) => u)
  }
  if (filtroRol.value)    list = list.filter(u => u.role_id === Number(filtroRol.value))
  if (filtroDept.value)   list = list.filter(u => u.departamento === filtroDept.value)
  if (filtroEstado.value === 'pendiente') list = list.filter(u => u.activo === false)
  return list
})
const totalPaginas  = computed(() => Math.ceil(usuariosFiltrados.value.length / porPagina))
const usuariosPagina = computed(() => {
  const start = (paginaActual.value - 1) * porPagina
  return usuariosFiltrados.value.slice(start, start + porPagina)
})

/* ── Helpers visuales ── */
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function rolLabel(r) {
  return { 1: 'Admin', 2: 'Colaborador', 3: 'Conductor' }[r] || 'Usuario'
}
function rolClase(r) {
  return {
    1: 'bg-purple-100 text-purple-700',
    2: 'bg-blue-100 text-blue-700',
    3: 'bg-amber-100 text-amber-700',
  }[r] || 'bg-gray-100 text-gray-600'
}
function avatarColor(r) {
  return { 1: 'bg-purple-600', 2: 'bg-blue-600', 3: 'bg-amber-600' }[r] || 'bg-gray-600'
}

/* ── Fetch ── */
async function fetchUsuarios() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/usuarios')
    usuarios.value = data
  } catch {
    usuarios.value = []
  } finally {
    loading.value = false
  }
}

/* ── Acciones ── */
function abrirModalNuevo() {
  editando.value = false
  formUser.value = { id: null, nombre: '', email: '', password: '', role_id: 2, departamento: 'ventas' }
  modalError.value = ''
  userFormErrors.value = {}
  showModal.value = true
}
function abrirEditar(u) {
  editando.value = true
  formUser.value = {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    password: '',
    role_id: u.role_id,
    departamento: u.role_id === 3 ? '' : (u.departamento || 'ventas')
  }
  modalError.value = ''
  userFormErrors.value = {}
  showResetPass.value = false
  nuevaPassAdmin.value = ''
  showModal.value = true
}

function validarUsuarioForm() {
  const e = {}
  if (!formUser.value.nombre?.trim()) {
    e.nombre = 'El nombre es obligatorio'
  } else if (formUser.value.nombre.trim().length < 2) {
    e.nombre = 'El nombre debe tener al menos 2 caracteres'
  }
  if (!formUser.value.email?.trim()) {
    e.email = 'El correo electrónico es obligatorio'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formUser.value.email.trim())) {
    e.email = 'Ingresa un correo electrónico válido'
  }
  if (!editando.value) {
    if (!formUser.value.password?.trim()) {
      e.password = 'La contraseña es obligatoria'
    } else if (formUser.value.password.length < 6) {
      e.password = 'La contraseña debe tener mínimo 6 caracteres'
    }
  }
  userFormErrors.value = e
  return Object.keys(e).length === 0
}

async function guardarUsuario() {
  if (!validarUsuarioForm()) return
  modalError.value = ''
  guardando.value = true
  try {
    if (editando.value) {
      const payload = {
        nombre: formUser.value.nombre,
        email: formUser.value.email,
        role_id: formUser.value.role_id,
        departamento: formUser.value.role_id === 3 ? null : formUser.value.departamento
      }
      await axios.put(`/api/usuarios/${formUser.value.id}`, payload)
      const idx = usuarios.value.findIndex(u => u.id === formUser.value.id)
      if (idx !== -1) usuarios.value[idx] = { ...usuarios.value[idx], ...payload }
      toast.add?.({ type: 'success', message: 'Usuario actualizado' })
    } else {
      await axios.post('/api/auth/register', formUser.value)
      toast.add?.({ type: 'success', message: 'Usuario creado correctamente' })
      await fetchUsuarios()
    }
    showModal.value = false
  } catch (e) {
    modalError.value = e.response?.data?.message || 'Error al guardar usuario'
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(u) {
  const nuevoEstado = u.activo === false ? true : false
  try {
    await axios.patch(`/api/usuarios/${u.id}/activo`, { activo: nuevoEstado })
    u.activo = nuevoEstado
    toast.add?.({ type: 'success', message: nuevoEstado ? 'Usuario activado' : 'Usuario desactivado' })
  } catch {
    toast.add?.({ type: 'error', message: 'Error al cambiar estado' })
  }
}

function confirmarEliminar(u) {
  usuarioAEliminar.value  = u
  showConfirmEliminar.value = true
}

async function ejecutarEliminar() {
  if (!usuarioAEliminar.value) return
  eliminando.value = true
  try {
    await axios.delete(`/api/usuarios/${usuarioAEliminar.value.id}`)
    usuarios.value = usuarios.value.filter(u => u.id !== usuarioAEliminar.value.id)
    showConfirmEliminar.value = false
    toast.add?.({ type: 'success', message: `Usuario "${usuarioAEliminar.value.nombre}" eliminado` })
    usuarioAEliminar.value = null
  } catch (e) {
    toast.add?.({ type: 'error', message: e.response?.data?.message || 'Error al eliminar usuario' })
  } finally {
    eliminando.value = false
  }
}

async function resetPasswordAdmin() {
  if (!nuevaPassAdmin.value || nuevaPassAdmin.value.length < 6) {
    toast.add?.({ type: 'error', message: 'La contraseña debe tener mínimo 6 caracteres' })
    return
  }
  guardandoPass.value = true
  try {
    await axios.patch(`/api/usuarios/${formUser.value.id}/password`, { password: nuevaPassAdmin.value })
    nuevaPassAdmin.value = ''
    showResetPass.value = false
    toast.add?.({ type: 'success', message: 'Contraseña restablecida correctamente' })
  } catch (e) {
    toast.add?.({ type: 'error', message: e.response?.data?.message || 'Error al cambiar contraseña' })
  } finally {
    guardandoPass.value = false
  }
}

onMounted(() => {
  fetchUsuarios()
  // Actualizar lista cuando llega un nuevo registro (en tiempo real)
  wsStore.on('nuevo_registro', fetchUsuarios)
  // Actualizar lista cuando un admin activa/desactiva a alguien
  wsStore.on('data_usuarios',  fetchUsuarios)
})

onUnmounted(() => {
  wsStore.off('nuevo_registro')
  wsStore.off('data_usuarios')
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
