<template>
  <div ref="container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  sitekey: { type: String, required: true },
  theme:   { type: String, default: 'light' },
})

const emit = defineEmits(['verify', 'expired', 'error'])

const container = ref(null)
let widgetId    = null

/* ──────────────────────────────────────────────
   Carga el script de Google reCAPTCHA una sola
   vez; si ya está listo, resuelve de inmediato.
   Nunca rechaza — siempre resuelve.
   ────────────────────────────────────────────── */
function loadRecaptchaScript() {
  return new Promise((resolve) => {
    // Ya está listo → listo
    if (window.grecaptcha?.render) {
      return resolve()
    }

    // El script ya fue inyectado pero aún cargando → hacer polling
    if (document.querySelector('script[data-recaptcha-src]')) {
      const poll = setInterval(() => {
        if (window.grecaptcha?.render) {
          clearInterval(poll)
          resolve()
        }
      }, 100)
      // Máximo 10 s de espera; si falla igual resolvemos para no dejar la promesa colgada
      setTimeout(() => { clearInterval(poll); resolve() }, 10_000)
      return
    }

    // Inyectar el script con callback global único
    const cbName = '__recaptchaOnLoad'
    window[cbName] = () => {
      delete window[cbName]
      resolve()
    }

    const script = document.createElement('script')
    script.setAttribute('data-recaptcha-src', '1')
    script.src   = `https://www.google.com/recaptcha/api.js?onload=${cbName}&render=explicit`
    script.async = true
    script.defer = true
    script.onerror = () => resolve() // Si no carga, resolve igual (no bloquear UX)
    document.head.appendChild(script)
  })
}

/* ──────────────────────────────────────────────
   Renderiza el widget dentro del <div ref>
   ────────────────────────────────────────────── */
function renderWidget() {
  if (!container.value || widgetId !== null) return
  if (!window.grecaptcha?.render) return

  try {
    widgetId = window.grecaptcha.render(container.value, {
      sitekey:            props.sitekey,
      theme:              props.theme,
      callback:           (token) => emit('verify', token),
      'expired-callback': ()      => emit('expired'),
      'error-callback':   ()      => emit('error'),
    })
  } catch {
    // Ignorar "already rendered" en hot-reload / re-mounts
  }
}

onMounted(async () => {
  await loadRecaptchaScript()

  // grecaptcha.ready garantiza que la API esté completamente inicializada
  if (window.grecaptcha?.ready) {
    window.grecaptcha.ready(renderWidget)
  } else {
    renderWidget()
  }
})

onBeforeUnmount(() => {
  if (widgetId !== null && window.grecaptcha) {
    try { window.grecaptcha.reset(widgetId) } catch {}
    widgetId = null
  }
})

/* reset() expuesto para llamar desde el padre vía template ref */
function reset() {
  if (widgetId !== null && window.grecaptcha) {
    try { window.grecaptcha.reset(widgetId) } catch {}
  }
}

defineExpose({ reset })
</script>
