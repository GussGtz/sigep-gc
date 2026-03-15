<template>
  <Teleport to="body">
    <Transition name="pwa-slide">
      <!-- Banner Chrome / Android / Desktop (beforeinstallprompt) -->
      <div v-if="showNative"
        class="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-[300]
               bg-white rounded-2xl shadow-modal border border-gray-100
               flex items-center gap-3 px-4 py-3.5">
        <img src="/icons/icon-square.svg" class="w-10 h-10 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900 leading-tight">Instalar Glass Caribe</p>
          <p class="text-xs text-gray-500 mt-0.5">Acceso rápido desde tu pantalla de inicio</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button @click="dismiss"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
                   hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
          <button @click="install"
            class="px-3 py-1.5 bg-[#0D89CB] hover:bg-[#00659C] text-white
                   text-xs font-semibold rounded-xl transition-colors">
            Instalar
          </button>
        </div>
      </div>

      <!-- Banner iOS Safari (sin beforeinstallprompt) -->
      <div v-else-if="showIos"
        class="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-[300]
               bg-white rounded-2xl shadow-modal border border-gray-100 px-4 py-3.5">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2.5">
            <img src="/icons/icon-square.svg" class="w-8 h-8 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
            <p class="text-sm font-semibold text-gray-900">Instalar Glass Caribe</p>
          </div>
          <button @click="dismiss"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400
                   hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <p class="text-xs text-gray-600 leading-relaxed">
          Toca
          <span class="inline-flex items-center gap-1 font-medium text-[#0D89CB]">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L8 6h3v8h2V6h3L12 2zm-7 14v4h14v-4h-2v2H7v-2H5z"/>
            </svg>
            Compartir
          </span>
          y luego <span class="font-medium text-[#0D89CB]">"Agregar a pantalla de inicio"</span>
        </p>
        <!-- Flecha apuntando hacia abajo donde está el botón de Safari -->
        <div class="flex justify-center mt-2">
          <svg class="w-5 h-5 text-gray-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePwaStore } from '../../stores/pwa.js'

const pwa = usePwaStore()

const STORAGE_KEY  = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 30

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(STORAGE_KEY)
    if (!ts) return false
    return (Date.now() - Number(ts)) < DISMISS_DAYS * 86_400_000
  } catch { return false }
}

// visible se activa después de 3 s (si no fue descartado y no es standalone)
const visible = ref(false)

if (!pwa.isStandalone && !wasDismissedRecently()) {
  setTimeout(() => { visible.value = true }, 3000)
}

// Para iOS el banner solo aparece si el store lo detecta y no fue descartado
const showNative = computed(() => pwa.canInstall  && visible.value)
const showIos    = computed(() => pwa.isIosSafari && visible.value)

function dismiss() {
  visible.value = false
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

async function install() {
  const accepted = await pwa.install()
  visible.value = false
  if (accepted) {
    // Marcar dismiss "permanente" para no volver a mostrar el banner
    try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86_400_000)) } catch {}
  }
}

// Si la app se instala desde fuera del banner (ej: barra del navegador), ocultarlo
watch(() => pwa.isStandalone, (v) => { if (v) visible.value = false })
</script>

<style scoped>
.pwa-slide-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.pwa-slide-leave-active { transition: all 0.25s ease-in; }
.pwa-slide-enter-from   { opacity: 0; transform: translateY(20px) scale(0.97); }
.pwa-slide-leave-to     { opacity: 0; transform: translateY(16px) scale(0.97); }
</style>
