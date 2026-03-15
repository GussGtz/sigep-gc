<template>
  <Transition name="psb-fade">
    <div v-if="password" class="mt-2 space-y-1.5">
      <!-- Barra de 3 segmentos -->
      <div class="flex gap-1">
        <div v-for="i in 3" :key="i"
          class="h-1.5 flex-1 rounded-full transition-all duration-300"
          :class="segmentClass(i - 1)"/>
      </div>
      <!-- Etiqueta + hint -->
      <div class="flex items-center justify-between gap-2">
        <span class="text-[11px] font-bold transition-colors leading-none" :class="labelColor">
          {{ label }}
        </span>
        <span class="text-[10px] text-gray-400 text-right leading-tight">{{ hint }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, default: '' }
})

// ── Criterios ────────────────────────────────────────────────────────────────
const hasMin8    = computed(() => props.password.length >= 8)
const hasUpper   = computed(() => /[A-Z]/.test(props.password))
const hasNumber  = computed(() => /[0-9]/.test(props.password))
const hasSpecial = computed(() => /[^A-Za-z0-9]/.test(props.password))
const hasLong    = computed(() => props.password.length >= 12)

// 0 = débil · 1 = aceptable · 2 = segura
const strength = computed(() => {
  if (!hasMin8.value || !hasUpper.value || !hasNumber.value) return 0
  if (hasSpecial.value || hasLong.value) return 2
  return 1
})

// El formulario puede enviarse si strength >= 1
const isValid = computed(() => strength.value >= 1)
defineExpose({ isValid, strength })

// ── Colores de segmentos ─────────────────────────────────────────────────────
function segmentClass(idx) {
  if (!props.password) return 'bg-gray-100'
  if (strength.value === 0) return idx === 0 ? 'bg-red-500'    : 'bg-gray-200'
  if (strength.value === 1) return idx <= 1  ? 'bg-yellow-400' : 'bg-gray-200'
  return 'bg-emerald-500'
}

// ── Texto ────────────────────────────────────────────────────────────────────
const label = computed(() => {
  if (strength.value === 0) return 'Débil'
  if (strength.value === 1) return 'Aceptable'
  return 'Segura'
})

const labelColor = computed(() => {
  if (strength.value === 0) return 'text-red-500'
  if (strength.value === 1) return 'text-yellow-500'
  return 'text-emerald-500'
})

const hint = computed(() => {
  if (!props.password) return ''
  const missing = []
  if (!hasMin8.value)   missing.push('8+ caracteres')
  if (!hasUpper.value)  missing.push('mayúscula')
  if (!hasNumber.value) missing.push('número')
  if (missing.length)   return 'Falta: ' + missing.join(', ')
  if (strength.value === 1) return 'Agrega símbolo o más chars → segura'
  return '¡Excelente!'
})
</script>

<style scoped>
.psb-fade-enter-active, .psb-fade-leave-active { transition: opacity .2s ease, transform .2s ease }
.psb-fade-enter-from, .psb-fade-leave-to { opacity: 0; transform: translateY(-4px) }
</style>
