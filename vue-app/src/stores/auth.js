import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API = '/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('sgpv_token') || null)
  const user  = ref(JSON.parse(localStorage.getItem('sgpv_user') || 'null'))

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin         = computed(() => user.value?.role_id === 1)
  const isVentas        = computed(() => user.value?.role_id === 2 && user.value?.departamento === 'ventas')
  const isProduccion    = computed(() => user.value?.role_id === 2 && user.value?.departamento === 'produccion')
  const isConductor     = computed(() => user.value?.role_id === 3)

  // Rol legible
  const rolLabel = computed(() => {
    if (isAdmin.value)      return 'Administrador'
    if (isVentas.value)     return 'Ventas'
    if (isProduccion.value) return 'Producción'
    if (isConductor.value)  return 'Conductor'
    return 'Usuario'
  })

  // Ruta home según rol
  const homeRoute = computed(() => {
    if (isAdmin.value)      return '/admin'
    if (isVentas.value)     return '/ventas'
    if (isProduccion.value) return '/produccion'
    if (isConductor.value)  return '/conductor'
    return '/login'
  })

  function setSession(data) {
    token.value = data.token
    user.value  = data.user
    localStorage.setItem('sgpv_token', data.token)
    localStorage.setItem('sgpv_user', JSON.stringify(data.user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  function clearSession() {
    token.value = null
    user.value  = null
    localStorage.removeItem('sgpv_token')
    localStorage.removeItem('sgpv_user')
    delete axios.defaults.headers.common['Authorization']
  }

  // Inicializar axios con el token guardado
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function login(email, password, recaptchaToken = '') {
    const { data } = await axios.post(`${API}/auth/login`, { email, password, recaptchaToken })
    setSession(data)
    return data
  }

  async function logout() {
    try { await axios.post(`${API}/auth/logout`) } catch {}
    clearSession()
  }

  async function verifyToken() {
    if (!token.value) return false
    try {
      const { data } = await axios.get(`${API}/auth/me`)
      user.value = data
      localStorage.setItem('sgpv_user', JSON.stringify(data))
      return true
    } catch {
      clearSession()
      return false
    }
  }

  return {
    token, user, isAuthenticated, isAdmin, isVentas, isProduccion, isConductor,
    rolLabel, homeRoute, login, logout, verifyToken, setSession, clearSession
  }
})
