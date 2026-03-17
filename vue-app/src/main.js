import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'
import { buildAxiosAdapter } from './utils/nativeAdapter.js'

// ── Cuando corre como APK nativo (Capacitor):
//    1. baseURL apunta directo al backend (no hay proxy Vite/Render).
//    2. axios usa CapacitorHttp como adaptador → peticiones HTTP pasan por el
//       stack nativo de Android, NO por el WebView → sin CORS, sin preflight.
if (Capacitor.isNativePlatform()) {
  axios.defaults.baseURL = 'https://backend-sigep-gc1.onrender.com'
  axios.defaults.adapter  = buildAxiosAdapter()
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
