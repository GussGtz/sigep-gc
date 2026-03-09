<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div v-for="kpi in cards" :key="kpi.label" class="card flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="kpi.bg">
        <span v-html="kpi.icon" class="flex items-center justify-center"></span>
      </div>
      <div>
        <p class="text-2xl font-bold" :class="kpi.color">{{ kpi.value }}</p>
        <p class="text-xs text-slate-400 leading-tight">{{ kpi.label }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  kpis: { type: Object, default: () => ({ total: 0, completados: 0, enProceso: 0, pendientes: 0 }) }
})

const iconBox     = `<svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`
const iconCog     = `<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
const iconCheck   = `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
const iconClock   = `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`

const cards = computed(() => [
  {
    label: 'Total Pedidos',
    value: props.kpis.total,
    icon:  iconBox,
    color: 'text-slate-100',
    bg: 'bg-slate-700/50'
  },
  {
    label: 'En Proceso',
    value: props.kpis.enProceso,
    icon:  iconCog,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10'
  },
  {
    label: 'Completados',
    value: props.kpis.completados,
    icon:  iconCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10'
  },
  {
    label: 'Pendientes',
    value: props.kpis.pendientes,
    icon:  iconClock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10'
  }
])
</script>
