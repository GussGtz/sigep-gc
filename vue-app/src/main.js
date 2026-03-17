import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Capacitor } from '@capacitor/core'
import axios from 'axios'
import App from './App.vue'
import router from './router/index.js'
import './assets/main.css'

// ── Cuando corre como APK nativo (Capacitor), las peticiones deben ir a la
//    URL absoluta del backend. CapacitorHttp (habilitado en capacitor.config.ts)
//    intercepta automáticamente todos los XHR/fetch y los redirige por el stack
//    HTTP nativo de Android → sin CORS, sin preflight OPTIONS.
if (Capacitor.isNativePlatform()) {
  axios.defaults.baseURL = 'https://backend-sigep-gc1.onrender.com'
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
