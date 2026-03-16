<template>
  <div class="min-h-screen flex">

    <!-- ── Panel Izquierdo (solo desktop) ── -->
    <div
      class="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
      :style="{
        backgroundImage: 'url(https://images.unsplash.com/photo-1497366754035-f200581393ab?w=900&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }"
    >
      <div class="absolute inset-0 bg-[#0F1A2A]/70 backdrop-blur-[2px]"></div>

      <!-- Logo -->
      <div class="relative z-10">
        <div class="flex items-center gap-2.5">
          <img src="/icons/glass-caribe.svg" class="h-9 w-auto object-contain" alt="Glass Caribe"/>
          <span class="text-white/90 text-sm font-semibold tracking-wide">Glass Caribe</span>
        </div>
      </div>

      <!-- Tagline -->
      <div class="relative z-10">
        <p class="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Nueva contraseña</p>
        <h1 class="text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
          Casi<br>listo.
        </h1>
        <p class="text-white/70 text-base leading-relaxed max-w-xs">
          Elige una contraseña segura para proteger tu cuenta de Glass Caribe.
        </p>
      </div>

      <!-- Decoración -->
      <div class="relative z-10">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-white/30"></div>
          <div class="w-8 h-2 rounded-full bg-white/60"></div>
          <div class="w-2 h-2 rounded-full bg-white/30"></div>
        </div>
      </div>
    </div>

    <!-- ── Panel Derecho ── -->
    <div class="w-full lg:w-7/12 bg-[#F8F8F6] flex items-center justify-center p-6 min-h-screen">
      <div class="w-full max-w-md">

        <!-- Logo mobile -->
        <div class="flex lg:hidden items-center justify-center gap-2.5 mb-8">
          <img src="/icons/glass-caribe.svg" class="h-9 w-auto object-contain" alt="Glass Caribe"/>
          <span class="text-gray-900 text-sm font-semibold tracking-wide">Glass Caribe</span>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-soft border border-black/[0.06] overflow-hidden">

          <!-- Header -->
          <div class="px-8 pt-8 pb-6 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="font-serif text-2xl font-bold text-gray-900">
                  {{ done ? '¡Contraseña actualizada!' : 'Restablecer contraseña' }}
                </h2>
                <p class="text-sm text-gray-400 mt-1 leading-relaxed">
                  {{ done
                    ? 'Ya puedes iniciar sesión con tu nueva contraseña.'
                    : 'Ingresa y confirma tu nueva contraseña.' }}
                </p>
              </div>
              <!-- Icon -->
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4"
                :class="done ? 'bg-emerald-50' : 'bg-[#0D89CB]/10'">
                <Lock v-if="!done" class="w-6 h-6 text-[#0D89CB]" :stroke-width="1.75" />
                <CheckCircle2 v-else class="w-6 h-6 text-emerald-600" :stroke-width="1.75" />
              </div>
            </div>
          </div>

          <!-- Token inválido (cargado pero sin token) -->
          <div v-if="!token" class="px-8 py-8 text-center">
            <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
              <AlertTriangle class="w-8 h-8 text-red-500" :stroke-width="2" />
            </div>
            <p class="text-gray-700 font-semibold mb-2">Enlace inválido</p>
            <p class="text-gray-400 text-sm mb-6">Este enlace no es válido o ya fue utilizado. Solicita uno nuevo.</p>
            <router-link
              to="/forgot-password"
              class="inline-flex items-center gap-2 bg-[#0D89CB] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#00659C] transition-colors">
              Solicitar nuevo enlace
            </router-link>
          </div>

          <!-- Estado: Éxito ✓ -->
          <div v-else-if="done" class="px-8 py-8 text-center">
            <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100">
              <CheckCircle2 class="w-8 h-8 text-emerald-500" :stroke-width="2" />
            </div>
            <p class="text-gray-600 text-sm leading-relaxed mb-6">
              Tu contraseña ha sido actualizada correctamente.<br>
              Usa la nueva contraseña para acceder a tu cuenta.
            </p>
            <router-link
              to="/login"
              class="inline-flex items-center gap-2 bg-[#0D89CB] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#00659C] transition-colors shadow-sm">
              <ArrowLeft class="w-4 h-4" :stroke-width="2" />
              Iniciar sesión
            </router-link>
          </div>

          <!-- Formulario -->
          <form v-else @submit.prevent="handleReset" class="px-8 py-6 space-y-5" novalidate>

            <!-- Nueva contraseña -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Nueva contraseña <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPw ? 'text' : 'password'"
                  class="w-full border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 transition-all pr-12"
                  :class="errors.password ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-[#0D89CB]'"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                  minlength="8"
                  autocomplete="new-password"
                  @input="errors.password = ''"
                />
                <button
                  type="button"
                  @click="showPw = !showPw"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeOff v-if="showPw" class="w-4 h-4" :stroke-width="2" />
                  <Eye v-else class="w-4 h-4" :stroke-width="2" />
                </button>
              </div>
              <PasswordStrengthBar :password="form.password" />
              <p v-if="errors.password" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle class="w-3 h-3 flex-shrink-0" :stroke-width="2" />
                {{ errors.password }}
              </p>
            </div>

            <!-- Confirmar contraseña -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirmar contraseña <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.confirm"
                :type="showPw ? 'text' : 'password'"
                class="w-full border rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 transition-all"
                :class="errors.confirm ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-[#0D89CB]'"
                placeholder="Repite tu contraseña"
                autocomplete="new-password"
                @input="errors.confirm = ''"
              />
              <p v-if="errors.confirm" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle class="w-3 h-3 flex-shrink-0" :stroke-width="2" />
                {{ errors.confirm }}
              </p>
            </div>

            <!-- Error general -->
            <div v-if="errorMsg"
              class="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              <AlertCircle class="w-4 h-4 flex-shrink-0" :stroke-width="2" />
              {{ errorMsg }}
            </div>

            <!-- Botón -->
            <button
              type="submit"
              :disabled="loading || !passwordValida"
              class="w-full bg-[#0D89CB] hover:bg-[#00659C] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              <Loader2 v-if="loading" class="w-4 h-4 animate-spin" :stroke-width="2" />
              <ShieldCheck v-else class="w-4 h-4" :stroke-width="2" />
              {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </form>

          <!-- Footer card -->
          <div v-if="token && !done" class="px-8 pb-6 text-center">
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0D89CB] transition-colors font-medium"
            >
              <ArrowLeft class="w-4 h-4" :stroke-width="2" />
              Volver al inicio de sesión
            </router-link>
          </div>

        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
          Glass Caribe © {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import PasswordStrengthBar from '../components/shared/PasswordStrengthBar.vue'
import { Lock, CheckCircle2, AlertTriangle, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-vue-next'

const route  = useRoute()
const router = useRouter()

const token    = ref('')
const form     = ref({ password: '', confirm: '' })
const loading  = ref(false)
const errorMsg = ref('')
const done     = ref(false)
const showPw   = ref(false)
const errors   = ref({ password: '', confirm: '' })

const passwordValida = computed(() => {
  const p = form.value.password
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p)
})

onMounted(() => {
  token.value = route.query.token || ''
})

async function handleReset() {
  errorMsg.value      = ''
  errors.value.password = ''
  errors.value.confirm  = ''

  if (!form.value.password) {
    errors.value.password = 'Ingresa tu nueva contraseña'
    return
  }
  if (!passwordValida.value) {
    errors.value.password = 'La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número'
    return
  }
  if (form.value.password !== form.value.confirm) {
    errors.value.confirm = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  try {
    await axios.post('/api/auth/reset-password', {
      token:    token.value,
      password: form.value.password,
    })
    done.value = true
    // Redirigir al login automáticamente tras 3 segundos
    setTimeout(() => router.push('/login'), 3000)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Error al restablecer la contraseña. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>
