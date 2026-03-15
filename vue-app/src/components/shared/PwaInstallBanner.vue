<template>
  <Teleport to="body">
    <Transition name="pwa-slide">
      <!-- Banner Chrome / Android / Desktop (beforeinstallprompt) -->
      <div v-if="showNative"
        class="fixed bottom-4 left-4 right-4 max-w-sm mx-auto z-[300]
               bg-white rounded-2xl shadow-modal border border-gray-100
               flex items-center gap-3 px-4 py-3.5">
        <img src="/icons/logo.jpg" class="w-10 h-10 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
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
            class="px-3 py-1.5 bg-[#1B3A5C] hover:bg-[#152d47] text-white
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
            <img src="/icons/logo.jpg" class="w-8 h-8 rounded-xl flex-shrink-0 object-contain" alt="Glass Caribe"/>
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
          <span class="inline-flex items-center gap-1 font-medium text-[#1B3A5C]">
            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L8 6h3v8h2V6h3L12 2zm-7 14v4h14v-4h-2v2H7v-2H5z"/>
            </svg>
            Compartir
          </span>
          y luego <span class="font-medium text-[#1B3A5C]">"Agregar a pantalla de inicio"</span>
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
import { ref, onMounted, onUnmounted } from 'vue'

// ── Detectar si ya está instalada como PWA ──────────────────────────────────
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true  // iOS Safari instalada

// ── Detectar iOS Safari (único browser donde beforeinstallprompt NO existe) ─
const ua          = navigator.userAgent
const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window).MSStream
const isSafari    = isIosDevice && /WebKit/.test(ua) && !/CriOS|FxiOS/.test(ua)

const STORAGE_KEY = 'pwa_install_dismissed_at'
const DISMISS_DAYS = 30  // no volver a mostrar hasta dentro de 30 días

function wasDismissedRecently() {
  try {
    const ts = localStorage.getItem(STORAGE_KEY)
    if (!ts) return false
    return (Date.now() - Number(ts)) < DISMISS_DAYS * 86_400_000
  } catch { return false }
}

// ── Estado del banner ───────────────────────────────────────────────────────
const deferredPrompt = ref(null)   // evento beforeinstallprompt guardado
const showNative     = ref(false)  // mostrar banner Chrome/Android/Desktop
const showIos        = ref(false)  // mostrar instrucciones iOS Safari

function dismiss() {
  showNative.value = false
  showIos.value    = false
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch {}
}

async function install() {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const { outcome } = await deferredPrompt.value.userChoice
  deferredPrompt.value = null
  showNative.value = false
  // Si aceptó, marcar como "ya instalado" permanentemente
  if (outcome === 'accepted') {
    try { localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86_400_000)) } catch {}
  }
}

function handleBeforeInstall(e) {
  e.preventDefault()
  deferredPrompt.value = e
  if (!isStandalone && !wasDismissedRecently()) {
    // Pequeño delay para no mostrar antes de que la app cargue
    setTimeout(() => { showNative.value = true }, 3000)
  }
}

function handleAppInstalled() {
  showNative.value = false
  deferredPrompt.value = null
}

onMounted(() => {
  if (isStandalone) return  // ya está instalada, no mostrar nada

  window.addEventListener('beforeinstallprompt', handleBeforeInstall)
  window.addEventListener('appinstalled',        handleAppInstalled)

  // iOS Safari: mostrar instrucciones manuales si aún no fue descartado
  if (isSafari && !wasDismissedRecently()) {
    setTimeout(() => { showIos.value = true }, 3000)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  window.removeEventListener('appinstalled',        handleAppInstalled)
})
</script>

<style scoped>
.pwa-slide-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.pwa-slide-leave-active { transition: all 0.25s ease-in; }
.pwa-slide-enter-from   { opacity: 0; transform: translateY(20px) scale(0.97); }
.pwa-slide-leave-to     { opacity: 0; transform: translateY(16px) scale(0.97); }
</style>
