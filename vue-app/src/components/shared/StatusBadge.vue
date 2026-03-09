<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'pendiente' }
})

const MAP = {
  'pendiente':  { class: 'badge-pendiente',  label: 'Pendiente' },
  'en proceso': { class: 'badge-proceso',    label: 'En Proceso' },
  'en corte':   { class: 'badge-corte',      label: 'En Corte' },
  'pulido':     { class: 'badge-pulido',     label: 'Pulido' },
  'completado': { class: 'badge-completado', label: 'Completado' },
  'asignada':   { class: 'badge-proceso',    label: 'Asignada' },
  'en_camino':  { class: 'badge-proceso',    label: 'En Camino' },
  'entregada':  { class: 'badge-completado', label: 'Entregada' },
  'incidencia': { class: 'badge-incidencia', label: 'Incidencia' },
}

const badgeClass = computed(() => MAP[props.status]?.class || 'badge bg-gray-100 text-gray-500')
const label      = computed(() => MAP[props.status]?.label || props.status)
</script>
