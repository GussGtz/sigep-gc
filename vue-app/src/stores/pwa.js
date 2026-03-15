import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// ── Detectar iOS Safari (no tiene beforeinstallprompt) ──────────────────────
const _ua       = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const _isIos    = /iPad|iPhone|iPod/.test(_ua)
const _isSafari = _isIos && /WebKit/.test(_ua) && !/CriOS|FxiOS/.test(_ua)

export const usePwaStore = defineStore('pwa', () => {

  // true si ya está instalada como PWA (standalone)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    !!window.navigator.standalone
  )

  // iOS Safari sin instalación → instrucciones manuales
  const isIosSafari = _isSafari && !isStandalone

  const _prompt    = ref(null)    // BeforeInstallPromptEvent
  const _installed = ref(false)

  // Puede mostrar el diálogo nativo de instalación
  const canInstall = computed(() =>
    !!_prompt.value && !isStandalone && !_installed.value
  )

  // Hay algo que mostrar al usuario (nativo o iOS manual)
  const showInstallOption = computed(() => canInstall.value || isIosSafari)

  /** Guardar el evento capturado desde App.vue */
  function capturePrompt(e) { _prompt.value = e }

  /** Marcar como instalada (evento appinstalled) */
  function markInstalled() { _installed.value = true; _prompt.value = null }

  /**
   * Lanza el diálogo nativo de instalación.
   * Devuelve true si el usuario aceptó, false si canceló o no había prompt.
   */
  async function install() {
    if (!_prompt.value) return false
    _prompt.value.prompt()
    const { outcome } = await _prompt.value.userChoice
    _prompt.value = null
    if (outcome === 'accepted') { _installed.value = true; return true }
    return false
  }

  return {
    isStandalone,
    isIosSafari,
    canInstall,
    showInstallOption,
    capturePrompt,
    markInstalled,
    install,
  }
})
