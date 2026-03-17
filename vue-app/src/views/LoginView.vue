<template>
  <div class="min-h-screen flex">

    <!-- ── Panel Izquierdo: Imagen + Marca ── -->
    <div class="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
      :style="{
        backgroundImage: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }"
    >
      <div class="absolute inset-0 bg-[#0f2540]/75"></div>

      <!-- Logo top -->
      <div class="relative z-10 flex items-center gap-3">
        <img src="/icons/glass-caribe.svg" class="h-10 w-auto object-contain" alt="Glass Caribe"/>
        <p class="text-white font-bold text-base tracking-wide">Glass Caribe</p>
      </div>

      <!-- Central text -->
      <div class="relative z-10">
        <p class="text-white/50 text-xs uppercase tracking-widest font-medium mb-4">
          Sistema de Gestión
        </p>
        <h1 class="font-serif text-5xl font-bold text-white leading-tight mb-5">
          Gestión<br>precisa.<br>
          <span class="text-yellow-400">Resultados</span><br>medibles.
        </h1>
        <p class="text-white/60 text-sm leading-relaxed max-w-xs">
          Controla pedidos, producción y entregas desde un único panel de control.
        </p>
      </div>

      <!-- Bottom decoration -->
      <div class="relative z-10">
        <div class="flex gap-1">
          <div class="w-8 h-1 rounded-full bg-yellow-400"></div>
          <div class="w-2 h-1 rounded-full bg-white/30"></div>
          <div class="w-2 h-1 rounded-full bg-white/30"></div>
        </div>
      </div>
    </div>

    <!-- ── Panel Derecho: Formulario ── -->
    <div class="w-full lg:w-7/12 bg-white flex items-center justify-center p-8 min-h-screen">
      <div class="w-full max-w-md">

        <!-- Mobile logo -->
        <div class="flex items-center justify-center gap-3 mb-10 lg:hidden">
          <img src="/icons/glass-caribe.svg" class="h-10 w-auto object-contain" alt="Glass Caribe"/>
          <p class="font-bold text-gray-900 text-base tracking-wide">Glass Caribe</p>
        </div>

        <!-- Header -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <h2 class="font-serif text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p class="text-gray-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>
          <!-- Glass Caribe logo -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <img src="/icons/glass-caribe.svg" class="h-11 w-auto object-contain" alt="Glass Caribe"/>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">

          <div>
            <label class="form-label">Correo electrónico</label>
            <input
              v-model="form.email"
              type="email"
              class="input-field"
              placeholder="usuario@empresa.com"
              required
              autocomplete="email"
            />
          </div>

          <div>
            <label class="form-label">Contraseña</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPw ? 'text' : 'password'"
                class="input-field pr-12"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button type="button" @click="showPw = !showPw"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <EyeOff v-if="showPw" class="w-4 h-4" :stroke-width="2" />
                <Eye v-else class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
          </div>

          <!-- reCAPTCHA — solo en web (no en APK nativa) -->
          <div v-if="!isNative" class="flex justify-center">
            <app-recaptcha
              ref="recaptchaRef"
              :sitekey="RECAPTCHA_SITE_KEY"
              @verify="onVerify"
              @expired="onExpire"
            />
          </div>

          <!-- Error -->
          <div v-if="errorMsg"
            class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle class="w-4 h-4 flex-shrink-0" :stroke-width="2" />
            {{ errorMsg }}
          </div>

          <!-- Banner "Conectando..." — solo APK nativa mientras el servidor despierta -->
          <div v-if="isNative && !serverReady"
            class="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Loader2 class="w-4 h-4 text-[#0D89CB] animate-spin flex-shrink-0" :stroke-width="2" />
            <div>
              <p class="text-sm font-medium text-[#00659C]">Conectando con el servidor...</p>
              <p class="text-xs text-blue-500 mt-0.5">Esto puede tomar hasta 30 segundos la primera vez</p>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="loading || (isNative && !serverReady)"
            class="w-full btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg
                   bg-[#0D89CB] hover:bg-[#00659C] disabled:opacity-50 disabled:cursor-not-allowed">
            <Loader2 v-if="loading || (isNative && !serverReady)" class="w-5 h-5 animate-spin" :stroke-width="2" />
            <template v-if="isNative && !serverReady">Esperando conexión...</template>
            <template v-else>{{ loading ? 'Ingresando...' : 'Iniciar sesión' }}</template>
          </button>
        </form>

        <!-- Links -->
        <div class="mt-6 text-center space-y-2">
          <router-link to="/forgot-password"
            class="text-sm text-[#0D89CB] hover:text-[#00659C] font-medium transition-colors hover:underline">
            ¿Olvidaste tu contraseña?
          </router-link>
          <p class="text-sm text-gray-400">
            ¿No tienes cuenta?
            <router-link to="/register" class="text-[#0D89CB] hover:underline font-semibold">Solicita acceso</router-link>
          </p>
        </div>

        <p class="text-center text-xs text-gray-300 mt-10">Glass Caribe © 2025</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter }               from 'vue-router'
import { useAuthStore }            from '../stores/auth.js'
import AppRecaptcha                from '../components/shared/AppRecaptcha.vue'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { Capacitor }               from '@capacitor/core'
import axios                       from 'axios'

const router   = useRouter()
const auth     = useAuthStore()
const toast    = inject('toast')

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
const isNative           = Capacitor.isNativePlatform()

const form           = ref({ email: '', password: '' })
const loading        = ref(false)
const errorMsg       = ref('')
const showPw         = ref(false)
const recaptchaToken = ref(isNative ? 'NATIVE_APP' : '')
const recaptchaRef   = ref(null)

// ── Estado del servidor (solo relevante en APK nativa) ────────────────────
// Render free-tier duerme y tarda ~30-60 s en despertar.
// Bloqueamos el botón hasta que /api/health responda.
const serverReady = ref(!isNative)

onMounted(() => {
  if (!isNative) return          // en web no hace falta
  const MAX_ATTEMPTS = 20        // máximo 60 s (20 × 3 s)
  let attempts = 0

  const poll = async () => {
    attempts++
    try {
      await axios.get('/api/health', { timeout: 8000 })
      serverReady.value = true   // backend despierto → habilitar botón
    } catch {
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 3000)   // reintentar en 3 s
      } else {
        serverReady.value = true // tras 60 s permitir intentar igual
      }
    }
  }

  poll()
})

function onVerify(token) { recaptchaToken.value = token }
function onExpire()      { recaptchaToken.value = '' }

async function handleLogin() {
  errorMsg.value = ''

  if (!recaptchaToken.value) {
    errorMsg.value = 'Por favor completa la verificación de seguridad'
    return
  }

  loading.value = true
  try {
    const data = await auth.login(form.value.email, form.value.password, recaptchaToken.value)
    toast.add({ type: 'success', message: `Bienvenido, ${data.user.nombre}` })
    router.push(auth.homeRoute)
  } catch (e) {
    if (!e.response) {
      errorMsg.value = 'Sin conexión con el servidor. Intenta de nuevo en unos segundos.'
    } else {
      errorMsg.value = e.response.data?.message || 'Credenciales incorrectas'
    }
    recaptchaRef.value?.reset()
    recaptchaToken.value = isNative ? 'NATIVE_APP' : ''
  } finally {
    loading.value = false
  }
}
</script>
