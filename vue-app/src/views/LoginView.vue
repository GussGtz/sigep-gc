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
        <img src="/icons/icon.svg" class="w-10 h-10 rounded-xl" alt="Glass Caribe"/>
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
          <img src="/icons/icon.svg" class="w-10 h-10 rounded-xl" alt="Glass Caribe"/>
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
            <img src="/icons/icon.svg" class="w-11 h-11 rounded-xl" alt="Glass Caribe"/>
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
                <svg v-if="showPw" class="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- reCAPTCHA -->
          <div class="flex justify-center">
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
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="loading"
            class="w-full btn-primary justify-center py-3 text-base shadow-md hover:shadow-lg
                   bg-[#1B3A5C] hover:bg-[#15304D] disabled:opacity-50 disabled:cursor-not-allowed">
            <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
          </button>
        </form>

        <!-- Links -->
        <div class="mt-6 text-center space-y-2">
          <router-link to="/forgot-password"
            class="text-sm text-[#1B3A5C] hover:text-[#15304D] font-medium transition-colors hover:underline">
            ¿Olvidaste tu contraseña?
          </router-link>
          <p class="text-sm text-gray-400">
            ¿No tienes cuenta?
            <router-link to="/register" class="text-[#1B3A5C] hover:underline font-semibold">Solicita acceso</router-link>
          </p>
        </div>

        <p class="text-center text-xs text-gray-300 mt-10">Glass Caribe © 2025</p>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject }    from 'vue'
import { useRouter }      from 'vue-router'
import { useAuthStore }   from '../stores/auth.js'
import AppRecaptcha       from '../components/shared/AppRecaptcha.vue'

const router   = useRouter()
const auth     = useAuthStore()
const toast    = inject('toast')

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

const form           = ref({ email: '', password: '' })
const loading        = ref(false)
const errorMsg       = ref('')
const showPw         = ref(false)
const recaptchaToken = ref('')
const recaptchaRef   = ref(null)

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
    errorMsg.value = e.response?.data?.message || 'Credenciales incorrectas'
    recaptchaRef.value?.reset()
    recaptchaToken.value = ''
  } finally {
    loading.value = false
  }
}
</script>
