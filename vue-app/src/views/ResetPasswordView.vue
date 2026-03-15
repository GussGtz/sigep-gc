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
                <svg v-if="!done" class="w-6 h-6 text-[#0D89CB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <svg v-else class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Token inválido (cargado pero sin token) -->
          <div v-if="!token" class="px-8 py-8 text-center">
            <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
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
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed mb-6">
              Tu contraseña ha sido actualizada correctamente.<br>
              Usa la nueva contraseña para acceder a tu cuenta.
            </p>
            <router-link
              to="/login"
              class="inline-flex items-center gap-2 bg-[#0D89CB] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#00659C] transition-colors shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
              </svg>
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
                  <svg v-if="showPw" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </button>
              </div>
              <PasswordStrengthBar :password="form.password" />
              <p v-if="errors.password" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
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
                <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                {{ errors.confirm }}
              </p>
            </div>

            <!-- Error general -->
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
              :disabled="loading || !passwordValida"
              class="w-full bg-[#0D89CB] hover:bg-[#00659C] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </form>

          <!-- Footer card -->
          <div v-if="token && !done" class="px-8 pb-6 text-center">
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0D89CB] transition-colors font-medium"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
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
