<template>
  <div class="min-h-screen bg-[#F8F8F6]">
    <AdminNavBar />

    <main class="pt-header-lg lg:pt-0 lg:ml-60 pb-nav lg:pb-0 page-enter">
      <div class="max-w-6xl mx-auto px-5 py-8 space-y-6">

        <!-- ── Encabezado ── -->
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="font-serif text-2xl font-bold text-gray-900">Inventario de Vidrio</h1>
            <p class="text-gray-400 text-sm mt-0.5">Control de stock por material</p>
          </div>
          <button
            @click="abrirModalNuevo"
            class="btn-primary text-sm"
          >
            <Plus class="w-4 h-4" :stroke-width="2" />
            Nuevo Material
          </button>
        </div>

        <!-- ── KPIs ── -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Total Materiales</p>
            <p class="text-3xl font-black text-gray-900">{{ store.materiales.length }}</p>
          </div>
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p class="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Stock Total (m²)</p>
            <p class="text-3xl font-black text-gray-900">{{ store.totalM2.toFixed(2) }}</p>
          </div>
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            :class="store.bajoMinimo.length > 0 ? 'border-red-200 bg-red-50' : ''">
            <p class="text-xs uppercase tracking-wider font-semibold mb-1"
              :class="store.bajoMinimo.length > 0 ? 'text-red-500' : 'text-gray-400'">Bajo Mínimo</p>
            <p class="text-3xl font-black" :class="store.bajoMinimo.length > 0 ? 'text-red-600' : 'text-gray-900'">
              {{ store.bajoMinimo.length }}
            </p>
          </div>
        </div>

        <!-- ── Alertas bajo mínimo ── -->
        <div v-if="store.bajoMinimo.length > 0" class="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle class="w-5 h-5" :stroke-width="1.75" />
          <div>
            <p class="text-sm font-bold text-red-700">Materiales bajo stock mínimo:</p>
            <p class="text-xs text-red-600 mt-0.5">
              {{ store.bajoMinimo.map(m => `${m.tipo}${m.color ? ' ' + m.color : ''} (${m.stock_m2} m²)`).join(', ') }}
            </p>
          </div>
        </div>

        <!-- ── Loading ── -->
        <div v-if="store.loading" class="text-center py-12 text-gray-400">Cargando inventario...</div>

        <!-- ── Tabla / Cards de materiales ── -->
        <div v-else>
          <!-- Desktop: tabla -->
          <div class="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-100">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Material</th>
                  <th class="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Espesor</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock (m²)</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mínimo (m²)</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio/m²</th>
                  <th class="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in store.materiales" :key="m.id"
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        :class="m.stock_m2 <= m.stock_minimo_m2 ? 'bg-red-500' : m.stock_m2 <= m.stock_minimo_m2 * 1.5 ? 'bg-amber-400' : 'bg-emerald-500'">
                      </div>
                      <div>
                        <p class="font-semibold text-gray-900">{{ m.tipo }}</p>
                        <p v-if="m.color" class="text-xs text-gray-400">{{ m.color }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-gray-600">{{ m.espesor_mm ? m.espesor_mm + ' mm' : '—' }}</td>
                  <td class="px-5 py-3 text-right">
                    <span class="font-bold" :class="m.stock_m2 <= m.stock_minimo_m2 ? 'text-red-600' : 'text-gray-900'">
                      {{ m.stock_m2?.toFixed(2) || '0.00' }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right text-gray-500">{{ m.stock_minimo_m2?.toFixed(2) || '0.00' }}</td>
                  <td class="px-5 py-3 text-right text-gray-600">
                    {{ m.precio_m2 > 0 ? '$' + Number(m.precio_m2).toFixed(2) : '—' }}
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="abrirEntrada(m)"
                        class="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-semibold transition-colors">
                        + Entrada
                      </button>
                      <button @click="abrirEditar(m)"
                        class="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-colors">
                        Editar
                      </button>
                      <button @click="eliminar(m)"
                        class="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 font-semibold transition-colors flex items-center justify-center">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="store.materiales.length === 0">
                  <td colspan="6" class="text-center py-12 text-gray-400 text-sm">Sin materiales registrados</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile: cards -->
          <div class="md:hidden space-y-3">
            <div v-for="m in store.materiales" :key="m.id"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    :class="m.stock_m2 <= m.stock_minimo_m2 ? 'bg-red-500' : 'bg-emerald-500'"></div>
                  <div>
                    <p class="font-bold text-gray-900">{{ m.tipo }}</p>
                    <p v-if="m.color" class="text-xs text-gray-400">{{ m.color }}{{ m.espesor_mm ? ' · ' + m.espesor_mm + 'mm' : '' }}</p>
                  </div>
                </div>
                <span class="text-lg font-black" :class="m.stock_m2 <= m.stock_minimo_m2 ? 'text-red-600' : 'text-gray-900'">
                  {{ m.stock_m2?.toFixed(1) }} m²
                </span>
              </div>
              <div class="flex gap-2 flex-wrap">
                <button @click="abrirEntrada(m)"
                  class="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-semibold">
                  + Entrada
                </button>
                <button @click="abrirEditar(m)"
                  class="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">
                  Editar
                </button>
                <button @click="eliminar(m)"
                  class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 border border-red-200 font-semibold">
                  Eliminar
                </button>
              </div>
            </div>
            <div v-if="store.materiales.length === 0" class="text-center py-12 text-gray-400 text-sm">Sin materiales registrados</div>
          </div>
        </div>

        <!-- ── Historial de movimientos ── -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p class="font-bold text-gray-900">Historial de Movimientos</p>
            <div class="flex items-center gap-3">
              <button @click="store.fetchMovimientos()"
                class="text-xs text-gray-400 hover:text-gray-700 transition-colors">↻ Actualizar</button>
              <button @click="showConfirmLimpiar = true"
                class="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Limpiar historial
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-gray-50">
                <tr>
                  <th class="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Fecha</th>
                  <th class="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Material</th>
                  <th class="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Tipo</th>
                  <th class="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase">m²</th>
                  <th class="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Descripción</th>
                  <th class="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase">Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mv in store.movimientos" :key="mv.id"
                  class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td class="px-5 py-2.5 text-gray-500 text-xs whitespace-nowrap">{{ mv.fecha }}</td>
                  <td class="px-5 py-2.5 text-gray-800 font-medium">
                    {{ mv.tipo }}{{ mv.color ? ' · ' + mv.color : '' }}
                    <span v-if="mv.espesor_mm" class="text-gray-400"> {{ mv.espesor_mm }}mm</span>
                  </td>
                  <td class="px-5 py-2.5">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      :class="mv.movimiento === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                      {{ mv.movimiento === 'entrada' ? '▲ Entrada' : '↔ Ajuste' }}
                    </span>
                  </td>
                  <td class="px-5 py-2.5 text-right font-semibold text-gray-900">{{ mv.m2?.toFixed(2) }}</td>
                  <td class="px-5 py-2.5 text-gray-500 text-xs">{{ mv.descripcion || '—' }}</td>
                  <td class="px-5 py-2.5 text-gray-500 text-xs">{{ mv.creado_por_nombre }}</td>
                </tr>
                <tr v-if="store.movimientos.length === 0">
                  <td colspan="6" class="text-center py-8 text-gray-400 text-sm">Sin movimientos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>

    <!-- ══════════════════════════════════════════
         Modal: Nuevo Material / Editar Material
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModalMaterial" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="showModalMaterial = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="font-black text-gray-900 text-lg">{{ editando ? 'Editar Material' : 'Nuevo Material' }}</h2>
              <button @click="showModalMaterial = false" class="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo *</label>
                <input v-model="form.tipo" type="text" list="tipos-vidrio"
                  placeholder="Selecciona o escribe el tipo..."
                  class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                <datalist id="tipos-vidrio">
                  <option value="Float Claro"/>
                  <option value="Float Bronce"/>
                  <option value="Float Gris"/>
                  <option value="Float Verde"/>
                  <option value="Float Azul"/>
                  <option value="Templado"/>
                  <option value="Templado Satinado"/>
                  <option value="Laminado"/>
                  <option value="Laminado Satinado"/>
                  <option value="Monolítico"/>
                  <option value="Reflectivo Bronce"/>
                  <option value="Reflectivo Azul"/>
                  <option value="Reflectivo Gris"/>
                  <option value="Reflectivo Verde"/>
                  <option value="Low-E"/>
                  <option value="Insulado (Doble Panel)"/>
                  <option value="Insulado Low-E"/>
                  <option value="Satinado / Sandblast"/>
                  <option value="Espejo Claro"/>
                  <option value="Espejo Bronce"/>
                  <option value="Espejo Gris"/>
                  <option value="Vitrolite"/>
                  <option value="Curvo / Doblado"/>
                  <option value="Serigrafía"/>
                  <option value="Armado"/>
                </datalist>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</label>
                  <input v-model="form.color" type="text" placeholder="Transparente..."
                    class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Espesor (mm)</label>
                  <input v-model.number="form.espesor_mm" type="number" min="0" step="0.1" placeholder="6"
                    class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock inicial (m²)</label>
                  <input v-model.number="form.stock_m2" type="number" min="0" step="0.01" placeholder="0"
                    :disabled="editando"
                    class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed" />
                  <p v-if="editando" class="text-xs text-gray-400 mt-0.5">Usa Entrada/Ajuste para modificar stock</p>
                </div>
                <div>
                  <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock mínimo (m²)</label>
                  <input v-model.number="form.stock_minimo_m2" type="number" min="0" step="0.01" placeholder="5"
                    class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio por m²</label>
                <input v-model.number="form.precio_m2" type="number" min="0" step="0.01" placeholder="0.00"
                  class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>

            <div v-if="formError" class="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{{ formError }}</div>

            <div class="flex gap-3 pt-2">
              <button @click="showModalMaterial = false"
                class="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="guardarMaterial" :disabled="guardandoForm"
                class="flex-1 bg-gray-900 text-white rounded-xl py-2 text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {{ guardandoForm ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════════
         Modal: Entrada / Ajuste de stock
    ══════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModalEntrada" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="showModalEntrada = false">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="font-black text-gray-900 text-lg">Registrar Movimiento</h2>
              <button @click="showModalEntrada = false" class="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>

            <div class="bg-gray-50 rounded-xl px-4 py-3 text-sm">
              <p class="font-bold text-gray-900">{{ materialSeleccionado?.tipo }}</p>
              <p class="text-gray-500 text-xs">Stock actual: <strong>{{ materialSeleccionado?.stock_m2?.toFixed(2) }} m²</strong></p>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de movimiento</label>
                <div class="mt-1 flex gap-3">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="entradaForm.tipo" value="entrada" class="accent-emerald-500" />
                    <span class="text-sm font-medium text-gray-700">▲ Entrada</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="entradaForm.tipo" value="ajuste" class="accent-amber-500" />
                    <span class="text-sm font-medium text-gray-700">↔ Ajuste de stock</span>
                  </label>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                  {{ entradaForm.tipo === 'entrada' ? 'Se sumará al stock actual' : 'Establece el stock en el valor indicado' }}
                </p>
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad (m²) *</label>
                <input v-model.number="entradaForm.m2" type="number" min="0" step="0.01" placeholder="0.00"
                  class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</label>
                <input v-model="entradaForm.descripcion" type="text" placeholder="Ej: Compra proveedor..."
                  class="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>

            <div v-if="entradaError" class="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{{ entradaError }}</div>

            <div class="flex gap-3 pt-2">
              <button @click="showModalEntrada = false"
                class="flex-1 border border-gray-200 rounded-xl py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button @click="guardarEntrada" :disabled="guardandoEntrada"
                class="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {{ guardandoEntrada ? 'Guardando...' : 'Registrar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRM LIMPIAR HISTORIAL ══ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirmLimpiar" class="modal-overlay" @mousedown.self="showConfirmLimpiar = false">
          <div class="bg-white rounded-2xl shadow-modal border border-black/[0.06] w-full max-w-sm p-6 text-center" @click.stop>
            <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Limpiar historial</h3>
            <p class="text-sm text-gray-500 mb-6">
              Se eliminarán <strong class="text-gray-800">todos los movimientos</strong> registrados. Esta acción no puede deshacerse.
            </p>
            <div class="flex gap-3">
              <button @click="showConfirmLimpiar = false" class="btn-secondary flex-1 justify-center">Cancelar</button>
              <button @click="limpiarHistorial"
                class="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all">
                Limpiar todo
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRM ELIMINAR MATERIAL ══ -->
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
            <h3 class="font-serif text-lg font-bold text-gray-900 mb-1">Eliminar material</h3>
            <p v-if="materialAEliminar" class="text-sm text-gray-500 mb-6">
              Se eliminará <strong class="text-gray-800">{{ materialAEliminar.tipo }}</strong>. Esta acción no puede deshacerse.
            </p>
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

  </div>
</template>

<script setup>
import { Plus, AlertTriangle } from 'lucide-vue-next'
import { ref, reactive, onMounted, inject } from 'vue'
import AdminNavBar from '../../components/admin/AdminNavBar.vue'
import { useInventarioStore } from '../../stores/inventario.js'

const store = useInventarioStore()
const toast = inject('toast', { add: () => {} })

/* ── Modal Material ── */
const showModalMaterial = ref(false)
const editando          = ref(false)
const editandoId        = ref(null)
const guardandoForm     = ref(false)
const formError         = ref('')
const form = reactive({ tipo: '', color: '', espesor_mm: null, stock_m2: 0, stock_minimo_m2: 0, precio_m2: 0 })

function abrirModalNuevo() {
  editando.value = false
  editandoId.value = null
  Object.assign(form, { tipo: '', color: '', espesor_mm: null, stock_m2: 0, stock_minimo_m2: 0, precio_m2: 0 })
  formError.value = ''
  showModalMaterial.value = true
}

function abrirEditar(m) {
  editando.value = true
  editandoId.value = m.id
  Object.assign(form, { tipo: m.tipo, color: m.color || '', espesor_mm: m.espesor_mm || null, stock_m2: m.stock_m2, stock_minimo_m2: m.stock_minimo_m2, precio_m2: m.precio_m2 || 0 })
  formError.value = ''
  showModalMaterial.value = true
}

async function guardarMaterial() {
  if (!form.tipo.trim()) { formError.value = 'El tipo es obligatorio'; return }
  guardandoForm.value = true
  formError.value = ''
  try {
    if (editando.value) {
      await store.actualizarMaterial(editandoId.value, {
        tipo: form.tipo, color: form.color || null, espesor_mm: form.espesor_mm || null,
        stock_minimo_m2: form.stock_minimo_m2, precio_m2: form.precio_m2
      })
      toast.add({ type: 'success', message: 'Material actualizado' })
    } else {
      await store.crearMaterial(form)
      toast.add({ type: 'success', message: 'Material creado' })
    }
    showModalMaterial.value = false
  } catch (e) {
    formError.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    guardandoForm.value = false
  }
}

const showConfirmDelete = ref(false)
const materialAEliminar = ref(null)

/* ── Limpiar historial de movimientos ── */
const showConfirmLimpiar = ref(false)
async function limpiarHistorial() {
  try {
    await store.limpiarMovimientos()
    showConfirmLimpiar.value = false
    toast.add({ type: 'success', title: 'Historial limpiado', message: 'Se eliminaron todos los movimientos del inventario.' })
  } catch (e) {
    showConfirmLimpiar.value = false
    toast.add({ type: 'error', title: 'Error', message: e.response?.data?.message || 'No se pudo limpiar el historial.' })
  }
}

function eliminar(m) {
  materialAEliminar.value = m
  showConfirmDelete.value = true
}

async function ejecutarEliminar() {
  const m = materialAEliminar.value
  if (!m) return
  try {
    await store.eliminarMaterial(m.id)
    showConfirmDelete.value = false
    materialAEliminar.value = null
    toast.add({ type: 'success', title: 'Material eliminado', message: `"${m.tipo}" fue eliminado correctamente.` })
  } catch (e) {
    showConfirmDelete.value = false
    toast.add({ type: 'error', title: 'Error', message: e.response?.data?.message || 'No se pudo eliminar.' })
  }
}

/* ── Modal Entrada/Ajuste ── */
const showModalEntrada   = ref(false)
const materialSeleccionado = ref(null)
const guardandoEntrada   = ref(false)
const entradaError       = ref('')
const entradaForm        = reactive({ tipo: 'entrada', m2: null, descripcion: '' })

function abrirEntrada(m) {
  materialSeleccionado.value = m
  Object.assign(entradaForm, { tipo: 'entrada', m2: null, descripcion: '' })
  entradaError.value = ''
  showModalEntrada.value = true
}

async function guardarEntrada() {
  if (entradaForm.m2 == null || entradaForm.m2 < 0) {
    entradaError.value = 'Ingresa una cantidad válida (>= 0)'
    return
  }
  guardandoEntrada.value = true
  entradaError.value = ''
  try {
    await store.registrarMovimiento({
      inventario_id: materialSeleccionado.value.id,
      tipo:          entradaForm.tipo,
      m2:            entradaForm.m2,
      descripcion:   entradaForm.descripcion
    })
    toast.add({ type: 'success', message: 'Movimiento registrado' })
    showModalEntrada.value = false
  } catch (e) {
    entradaError.value = e.response?.data?.message || 'Error al registrar'
  } finally {
    guardandoEntrada.value = false
  }
}

onMounted(() => {
  store.fetchMateriales()
  store.fetchMovimientos()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
