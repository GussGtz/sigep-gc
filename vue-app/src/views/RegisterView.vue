<template>
  <div class="min-h-screen flex">

    <!-- ── Panel Izquierdo ── -->
    <div
      class="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
      :style="{
        backgroundImage: 'url(https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }"
    >
      <div class="absolute inset-0 bg-[#0f2540]/75 backdrop-blur-[2px]"></div>

      <!-- Logo mark -->
      <div class="relative z-10 flex items-center gap-3">
        <img src="/icons/icon.svg" class="w-8 h-8 rounded-lg" alt="Glass Caribe"/>
        <span class="text-white/90 text-sm font-semibold tracking-wide">Glass Caribe</span>
      </div>

      <!-- Main heading -->
      <div class="relative z-10">
        <p class="text-[#f59e0b] text-xs font-semibold uppercase tracking-[0.2em] mb-5">Únete al equipo</p>
        <h1 class="font-serif text-5xl font-bold text-white leading-tight mb-5">
          Crea tu<br>cuenta hoy.
        </h1>
        <p class="text-white/60 text-base leading-relaxed max-w-xs">
          Accede al sistema de gestión de pedidos, inventario y entregas en tiempo real.
        </p>
      </div>

      <!-- Decoration -->
      <div class="relative z-10 flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-[#1B3A5C]"></div>
        <div class="w-2 h-2 rounded-full bg-white/25"></div>
        <div class="w-2 h-2 rounded-full bg-white/25"></div>
      </div>
    </div>

    <!-- ── Panel Derecho: Formulario ── -->
    <div class="w-full lg:w-7/12 bg-white flex items-center justify-center p-8 min-h-screen">
      <div class="w-full max-w-md">

        <!-- Logo + Título -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <h2 class="font-serif text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <p class="text-gray-400 text-sm mt-1">Completa el formulario para unirte</p>
          </div>
          <!-- Glass Caribe logo -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <img src="/icons/icon.svg" class="w-11 h-11 rounded-xl" alt="Glass Caribe"/>
          </div>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleRegister" class="space-y-4">

          <!-- Nombre -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Nombre completo
            </label>
            <input
              v-model="form.nombre"
              type="text"
              class="input-field w-full"
              placeholder="Juan García"
              required
              autocomplete="name"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Correo electrónico
            </label>
            <input
              v-model="form.email"
              type="email"
              class="input-field w-full"
              placeholder="usuario@empresa.com"
              required
              autocomplete="email"
            />
          </div>

          <!-- Departamento -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Departamento
            </label>
            <select
              v-model="form.departamento"
              class="input-field w-full appearance-none cursor-pointer"
              required
            >
              <option value="" disabled>Selecciona un departamento</option>
              <option value="ventas">Ventas</option>
              <option value="contabilidad">Contabilidad</option>
              <option value="produccion">Producción</option>
              <option value="conductor">Conductor</option>
            </select>
          </div>

          <!-- Contraseña -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPw ? 'text' : 'password'"
                class="input-field w-full pr-12"
                placeholder="Mínimo 6 caracteres"
                minlength="6"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPw = !showPw"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg v-if="showPw" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirmar Contraseña -->
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Confirmar contraseña
            </label>
            <input
              v-model="form.confirmPassword"
              :type="showPw ? 'text' : 'password'"
              class="input-field w-full"
              placeholder="Repite tu contraseña"
              required
              autocomplete="new-password"
            />
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
            class="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            {{ errorMsg }}
          </div>

          <!-- Botón -->
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <!-- Links -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            ¿Ya tienes cuenta?
            <router-link to="/login" class="text-[#1B3A5C] hover:text-[#15304D] font-semibold transition-colors">
              Inicia sesión
            </router-link>
          </p>
        </div>

        <p class="text-center text-xs text-gray-300 mt-8">
          Glass Caribe © 2025
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject }  from 'vue'
import { useRouter }    from 'vue-router'
import axios            from 'axios'
import AppRecaptcha     from '../components/shared/AppRecaptcha.vue'

const router   = useRouter()
const toast    = inject('toast')

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

const form = ref({
  nombre: '',
  email: '',
  departamento: '',
  password: '',
  confirmPassword: ''
})
const loading        = ref(false)
const errorMsg       = ref('')
const showPw         = ref(false)
const recaptchaToken = ref('')
const recaptchaRef   = ref(null)

function onVerify(token) { recaptchaToken.value = token }
function onExpire()      { recaptchaToken.value = '' }

async function handleRegister() {
  errorMsg.value = ''

  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = 'Las contraseñas no coinciden'
    return
  }
  if (form.value.password.length < 6) {
    errorMsg.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (!recaptchaToken.value) {
    errorMsg.value = 'Por favor completa la verificación de seguridad'
    return
  }

  loading.value = true
  try {
    await axios.post('/api/auth/register', {
      nombre:         form.value.nombre,
      email:          form.value.email,
      departamento:   form.value.departamento,
      password:       form.value.password,
      recaptchaToken: recaptchaToken.value,
    })
    toast.add({ type: 'success', message: 'Cuenta creada. ¡Ya puedes iniciar sesión!' })
    router.push('/login')
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Error al crear la cuenta'
    recaptchaRef.value?.reset()
    recaptchaToken.value = ''
  } finally {
    loading.value = false
  }
}
</script>
