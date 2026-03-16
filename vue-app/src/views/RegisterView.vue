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
        <img src="/icons/glass-caribe.svg" class="h-8 w-auto object-contain" alt="Glass Caribe"/>
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
        <div class="w-2 h-2 rounded-full bg-[#0D89CB]"></div>
        <div class="w-2 h-2 rounded-full bg-white/25"></div>
        <div class="w-2 h-2 rounded-full bg-white/25"></div>
      </div>
    </div>

    <!-- ── Panel Derecho: Formulario ── -->
    <div class="w-full lg:w-7/12 bg-white flex items-center justify-center p-8 min-h-screen">
      <div class="w-full max-w-md">

        <!-- ── Estado: Solicitud enviada ── -->
        <div v-if="registered" class="text-center">
          <div class="flex items-center justify-center mb-8">
            <img src="/icons/glass-caribe.svg" class="h-10 w-auto object-contain" alt="Glass Caribe"/>
          </div>
          <div class="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <Clock class="w-10 h-10 text-amber-500" :stroke-width="1.75" />
          </div>
          <h2 class="font-serif text-2xl font-bold text-gray-900 mb-3">¡Solicitud enviada!</h2>
          <p class="text-gray-500 text-sm leading-relaxed mb-2">
            Tu cuenta está en revisión por el administrador.
          </p>
          <p class="text-gray-400 text-sm leading-relaxed mb-8">
            Recibirás acceso al sistema en cuanto sea aprobada tu solicitud.
          </p>
          <router-link
            to="/login"
            class="inline-flex items-center gap-2 bg-[#0D89CB] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#00659C] transition-colors shadow-sm"
          >
            <ChevronLeft class="w-5 h-5" :stroke-width="2" />
            Volver al inicio de sesión
          </router-link>
          <p class="text-center text-xs text-gray-300 mt-8">Glass Caribe © {{ new Date().getFullYear() }}</p>
        </div>

        <!-- ── Formulario de registro ── -->
        <template v-else>

        <!-- Logo + Título -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <h2 class="font-serif text-2xl font-bold text-gray-900">Crear cuenta</h2>
            <p class="text-gray-400 text-sm mt-1">Completa el formulario para unirte</p>
          </div>
          <!-- Glass Caribe logo -->
          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <img src="/icons/glass-caribe.svg" class="h-11 w-auto object-contain" alt="Glass Caribe"/>
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
                placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                minlength="8"
                required
                autocomplete="new-password"
              />
              <button
                type="button"
                @click="showPw = !showPw"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeOff v-if="showPw" class="w-4 h-4" :stroke-width="2" />
                <Eye v-else class="w-4 h-4" :stroke-width="2" />
              </button>
            </div>
            <PasswordStrengthBar :password="form.password" />
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
            <AlertCircle class="w-4 h-4 flex-shrink-0" :stroke-width="2" />
            {{ errorMsg }}
          </div>

          <!-- Botón -->
          <button
            type="submit"
            :disabled="loading || !passwordValida"
            class="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" :stroke-width="2" />
            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <!-- Links -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-400">
            ¿Ya tienes cuenta?
            <router-link to="/login" class="text-[#0D89CB] hover:text-[#00659C] font-semibold transition-colors">
              Inicia sesión
            </router-link>
          </p>
        </div>

        <p class="text-center text-xs text-gray-300 mt-8">
          Glass Caribe © {{ new Date().getFullYear() }}
        </p>

        </template><!-- fin v-else formulario -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import axios                      from 'axios'
import AppRecaptcha               from '../components/shared/AppRecaptcha.vue'
import PasswordStrengthBar        from '../components/shared/PasswordStrengthBar.vue'
import { Eye, EyeOff, Loader2, AlertCircle, ChevronLeft, Clock } from 'lucide-vue-next'

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

const passwordValida = computed(() => {
  const p = form.value.password
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
})
const registered     = ref(false)
const recaptchaToken = ref('')
const recaptchaRef   = ref(null)

function onVerify(token) { recaptchaToken.value = token }
function onExpire()      { recaptchaToken.value = '' }

async function handleRegister() {
  errorMsg.value = ''

  if (!passwordValida.value) {
    errorMsg.value = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número'
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    errorMsg.value = 'Las contraseñas no coinciden'
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
    registered.value = true  // Mostrar pantalla "en revisión"
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Error al crear la cuenta'
    recaptchaRef.value?.reset()
    recaptchaToken.value = ''
  } finally {
    loading.value = false
  }
}
</script>
