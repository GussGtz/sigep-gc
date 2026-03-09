<template>
  <div class="min-h-screen bg-[#F8F8F6]">

    <!-- ── Mobile Top Bar ── -->
    <header class="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/[0.06] flex items-center px-4 gap-3 shadow-soft">
      <button @click="router.back()"
        class="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <span class="font-serif font-bold text-gray-900 flex-1">Registrar Entrega</span>
    </header>

    <main class="pt-14 pb-8">
      <div class="max-w-lg mx-auto px-4 py-6 space-y-4">

        <!-- Loading -->
        <div v-if="loading" class="space-y-3">
          <div class="skeleton h-28 rounded-2xl"></div>
          <div class="skeleton h-20 rounded-2xl"></div>
          <div class="skeleton h-40 rounded-2xl"></div>
        </div>

        <template v-else-if="entrega">

          <!-- ── Info del pedido ── -->
          <div class="bg-[#1B3A5C] rounded-2xl p-5">
            <p class="text-white/50 text-[11px] uppercase tracking-widest font-semibold mb-2">Detalle de Entrega</p>
            <p class="font-serif text-2xl font-bold text-white">#{{ entrega.numero_pedido }}</p>
            <p v-if="entrega.cliente_nombre" class="text-white/70 text-sm font-medium mt-1">{{ entrega.cliente_nombre }}</p>
            <p class="text-white/50 text-xs mt-0.5">Fecha estimada: {{ formatDate(entrega.fecha_entrega) }}</p>
          </div>

          <!-- ── Dirección + Navegación ── -->
          <div v-if="entrega.direccion_entrega"
            class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4 space-y-3">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <div>
                <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Dirección</p>
                <p class="text-gray-800 text-sm font-semibold leading-relaxed">{{ entrega.direccion_entrega }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 pt-1">
              <a :href="`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entrega.direccion_entrega)}`"
                target="_blank" rel="noopener noreferrer"
                class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1B3A5C] text-white text-xs font-semibold transition-colors hover:bg-[#15304D]">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                Google Maps
              </a>
              <a :href="`https://www.waze.com/ul?q=${encodeURIComponent(entrega.direccion_entrega)}&navigate=yes`"
                target="_blank" rel="noopener noreferrer"
                class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-semibold transition-colors hover:bg-cyan-700">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                Waze
              </a>
            </div>
          </div>
          <div v-else class="bg-white rounded-2xl border border-black/[0.06] shadow-soft text-center py-5">
            <div class="flex items-center justify-center mb-2">
              <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <p class="text-sm text-gray-400">Sin dirección registrada</p>
          </div>

          <!-- ── Foto de entrega ── -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4">
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Foto de Evidencia</p>

            <input ref="fotoInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onFoto"/>
            <canvas ref="canvasEl" class="hidden"></canvas>

            <!-- Preview -->
            <div v-if="fotoPreview" class="relative">
              <img :src="fotoPreview" class="w-full max-h-52 object-cover rounded-xl border border-gray-100"/>
              <button @click="quitarFoto"
                class="absolute top-2 right-2 bg-red-100 hover:bg-red-200 text-red-600 text-xs
                       font-bold px-2.5 py-1 rounded-lg transition-colors border border-red-200 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                Quitar
              </button>
            </div>

            <!-- Take photo button -->
            <button v-else @click="fotoInput.click()"
              class="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl
                     border-2 border-dashed border-gray-200 hover:border-[#1B3A5C]/40
                     text-gray-400 hover:text-[#1B3A5C] text-sm font-medium transition-colors">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Tomar foto de la entrega
              <span class="text-xs text-gray-300">(opcional)</span>
            </button>
          </div>

          <!-- ── Notas ── -->
          <div class="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4">
            <label class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              Notas adicionales
            </label>
            <textarea v-model="notas" class="input-field resize-none" rows="3"
              placeholder="Observaciones, nombre del receptor, incidencias..."></textarea>
          </div>

          <!-- Error -->
          <div v-if="errorMsg"
            class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {{ errorMsg }}
          </div>

          <!-- ── Confirm button ── -->
          <button @click="confirmarEntrega" :disabled="enviando"
            class="w-full btn-primary justify-center py-3.5 text-base shadow-md">
            <svg v-if="enviando" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-if="!enviando" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {{ enviando ? 'Registrando...' : 'Confirmar Entrega' }}
          </button>
        </template>

        <div v-else class="text-center py-12 text-gray-400 text-sm">Entrega no encontrada</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRoute, useRouter }   from 'vue-router'
import { useAuthStore }          from '../../stores/auth.js'
import { useNotificationsStore } from '../../stores/notifications.js'
import axios from 'axios'

const route   = useRoute()
const router  = useRouter()
const auth    = useAuthStore()
const notifs  = useNotificationsStore()
const toast   = inject('toast')

const loading     = ref(true)
const enviando    = ref(false)
const entrega     = ref(null)
const notas       = ref('')
const errorMsg    = ref('')

const fotoInput   = ref(null)
const canvasEl    = ref(null)
const fotoPreview = ref(null)
const fotoBase64  = ref(null)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
}

function onFoto(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const MAX = 800
    let { width, height } = img
    if (width > MAX || height > MAX) {
      if (width > height) { height = Math.round(height * MAX / width); width = MAX }
      else                 { width  = Math.round(width  * MAX / height); height = MAX }
    }
    const canvas  = canvasEl.value
    canvas.width  = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    const dataUrl     = canvas.toDataURL('image/jpeg', 0.7)
    fotoBase64.value  = dataUrl
    fotoPreview.value = dataUrl
  }
  img.src = url
}

function quitarFoto() {
  fotoPreview.value = null
  fotoBase64.value  = null
  if (fotoInput.value) fotoInput.value.value = ''
}

async function confirmarEntrega() {
  enviando.value = true
  errorMsg.value = ''
  try {
    await axios.put(`/api/entregas/${route.params.id}/entregar`, {
      notas:       notas.value || null,
      foto_base64: fotoBase64.value || null
    })
    if (entrega.value) {
      notifs.create({
        type:        'delivery_done',
        orderId:     String(entrega.value.pedido_id),
        orderNumber: entrega.value.numero_pedido,
        message:     `Pedido #${entrega.value.numero_pedido} entregado por ${auth.user?.nombre}`
      })
    }
    toast.add({ type: 'success', message: '¡Entrega confirmada correctamente!' })
    router.push('/conductor')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Error al registrar entrega'
  } finally {
    enviando.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await axios.get(`/api/entregas/${route.params.id}`)
    entrega.value = data
  } catch {
    entrega.value = null
  } finally {
    loading.value = false
  }
})
</script>
