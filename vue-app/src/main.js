import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

// ── Cuando corre como APK nativo (Capacitor), las peticiones deben ir a la
//    URL absoluta del backend ya que no hay servidor web que actúe de proxy.
//    En el navegador normal (web), baseURL queda vacío y el proxy de Vite/Render
//    funciona igual que siempre.
if (Capacitor.isNativePlatform()) {
  axios.defaults.baseURL = 'https://backend-sigep-gc1.onrender.com'
  // Pre-calentar el backend: Render free tier duerme tras inactividad.
  // Este ping lo despierta ANTES de que el usuario toque "Iniciar sesión".
  axios.get('/api/health').catch(() => {})
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
