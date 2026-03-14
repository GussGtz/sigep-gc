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
          <svg class="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="white" fill-opacity="0.14"/>
            <rect x="5.5" y="5.5" width="25" height="25" rx="2.5" stroke="white" stroke-width="1.75" fill="none"/>
            <line x1="18" y1="5.5" x2="18" y2="30.5" stroke="white" stroke-width="1.75"/>
            <line x1="5.5" y1="18" x2="30.5" y2="18" stroke="white" stroke-width="1.75"/>
            <rect x="7.5" y="7.5" width="9" height="9" rx="1" fill="white" fill-opacity="0.18"/>
          </svg>
          <div class="leading-none">
            <p class="text-white font-black text-sm tracking-tight">GLASS</p>
            <p class="text-white/60 text-[10px] tracking-widest uppercase">Caribe</p>
          </div>
        </div>
      </div>

      <!-- Tagline -->
      <div class="relative z-10">
        <p class="text-white/50 text-xs uppercase tracking-widest font-semibold mb-4">Recupera tu acceso</p>
        <h1 class="text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
          Sin<br>problemas.
        </h1>
        <p class="text-white/70 text-base leading-relaxed max-w-xs">
          Ingresa tu correo y te enviaremos las instrucciones para restablecer tu contraseña.
        </p>
      </div>

      <!-- Decoración inferior -->
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
          <svg class="w-9 h-9" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="#1B3A5C"/>
            <rect x="5.5" y="5.5" width="25" height="25" rx="2.5" stroke="white" stroke-width="1.75" fill="none"/>
            <line x1="18" y1="5.5" x2="18" y2="30.5" stroke="white" stroke-width="1.75"/>
            <line x1="5.5" y1="18" x2="30.5" y2="18" stroke="white" stroke-width="1.75"/>
            <rect x="7.5" y="7.5" width="9" height="9" rx="1" fill="white" fill-opacity="0.18"/>
          </svg>
          <div class="leading-none">
            <p class="text-gray-900 font-black text-sm tracking-tight">GLASS</p>
            <p class="text-gray-400 text-[10px] tracking-widest uppercase">Caribe</p>
          </div>
        </div>

        <!-- Card contenedor -->
        <div class="bg-white rounded-2xl shadow-soft border border-black/[0.06] overflow-hidden">

          <!-- Header card -->
          <div class="px-8 pt-8 pb-6 border-b border-gray-100">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="font-serif text-2xl font-bold text-gray-900">
                  {{ sent ? 'Revisa tu correo' : 'Recuperar contraseña' }}
                </h2>
                <p class="text-sm text-gray-400 mt-1 leading-relaxed">
                  {{ sent
                    ? `Enviamos instrucciones a ${form.email}`
                    : 'Ingresa tu correo para recibir el enlace de recuperación.' }}
                </p>
              </div>
              <!-- Icon -->
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ml-4"
                :class="sent ? 'bg-emerald-50' : 'bg-[#1B3A5C]/10'">
                <svg v-if="!sent" class="w-6 h-6 text-[#1B3A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                <svg v-else class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Estado: Enviado ✓ -->
          <div v-if="sent" class="px-8 py-8 text-center">
            <div class="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100">
              <svg class="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed mb-1">Si el correo está registrado en nuestro sistema,</p>
            <p class="text-gray-600 text-sm leading-relaxed mb-6">recibirás las instrucciones de recuperación en breve.</p>
            <p class="text-xs text-gray-400 mb-6">Revisa también tu carpeta de spam o correo no deseado.</p>
            <button
              @click="sent = false; form.email = ''; errorMsg = ''; recaptchaToken = ''; recaptchaRef?.reset()"
              class="text-sm text-[#1B3A5C] hover:text-[#15304D] font-semibold transition-colors flex items-center justify-center gap-1.5 mx-auto">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Intentar con otro correo
            </button>
          </div>

          <!-- Formulario -->
          <form v-else @submit.prevent="handleForgot" class="px-8 py-6 space-y-5" novalidate>

            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input
                  v-model="form.email"
                  type="email"
                  @input="errorMsg = ''"
                  class="w-full border rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 transition-all"
                  :class="errorMsg ? 'border-red-400 ring-1 ring-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-[#1B3A5C]'"
                  placeholder="usuario@empresa.com"
                  autocomplete="email"
                />
              </div>
              <p v-if="errorMsg" class="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                {{ errorMsg }}
              </p>
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

            <!-- Botón -->
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-[#1B3A5C] hover:bg-[#15304D] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              {{ loading ? 'Enviando...' : 'Enviar instrucciones' }}
            </button>
          </form>

          <!-- Footer card -->
          <div class="px-8 pb-6 text-center">
            <router-link
              to="/login"
              class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1B3A5C] transition-colors font-medium"
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
import { ref }          from 'vue'
import axios            from 'axios'
import AppRecaptcha     from '../components/shared/AppRecaptcha.vue'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''

const form           = ref({ email: '' })
const loading        = ref(false)
const errorMsg       = ref('')
const sent           = ref(false)
const recaptchaToken = ref('')
const recaptchaRef   = ref(null)

function onVerify(token) { recaptchaToken.value = token }
function onExpire()      { recaptchaToken.value = '' }

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function handleForgot() {
  errorMsg.value = ''

  if (!form.value.email?.trim()) {
    errorMsg.value = 'Ingresa tu correo electrónico'
    return
  }
  if (!validarEmail(form.value.email)) {
    errorMsg.value = 'Ingresa un correo electrónico válido'
    return
  }
  if (!recaptchaToken.value) {
    errorMsg.value = 'Por favor completa la verificación de seguridad'
    return
  }

  loading.value = true
  try {
    await axios.post('/api/auth/forgot-password', {
      email:          form.value.email.trim(),
      recaptchaToken: recaptchaToken.value,
    })
    sent.value = true
  } catch {
    // Seguridad: siempre mostrar éxito aunque el usuario no exista
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
