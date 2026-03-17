/**
 * nativeAdapter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Adaptador axios que usa CapacitorHttp.request() en lugar del XMLHttpRequest
 * del WebView. Al salir del contexto del navegador, las peticiones HTTP pasan
 * por el stack nativo de Android → no hay CORS, no hay preflight OPTIONS,
 * no hay restricciones de WebView.
 *
 * Solo se activa cuando Capacitor.isNativePlatform() === true (APK Android).
 * En web, axios usa su adaptador normal (XHR/fetch) y todo sigue igual.
 */

import { CapacitorHttp } from '@capacitor/core'

/**
 * Construye y devuelve el adaptador axios.
 * Uso en main.js:
 *   import { buildAxiosAdapter } from './utils/nativeAdapter.js'
 *   axios.defaults.adapter = buildAxiosAdapter()
 */
export function buildAxiosAdapter() {
  return async function capacitorHttpAdapter(config) {
    // ── 1. Construir URL absoluta ────────────────────────────────────────────
    let url = config.url || ''
    if (!url.startsWith('http')) {
      const base = (config.baseURL || '').replace(/\/$/, '')
      const path = url.startsWith('/') ? url : '/' + url
      url = base + path
    }

    // ── 2. Aplanar cabeceras (AxiosHeaders → objeto plano) ───────────────────
    let rawHeaders = config.headers
    if (rawHeaders && typeof rawHeaders.toJSON === 'function') {
      rawHeaders = rawHeaders.toJSON()
    }
    const headers = {}
    for (const [k, v] of Object.entries(rawHeaders || {})) {
      if (v != null) headers[k] = String(v)
    }

    // ── 3. Cuerpo de la petición ─────────────────────────────────────────────
    const method = (config.method || 'GET').toUpperCase()
    let body = config.data

    // axios serializa el body a string antes de pasarlo al adaptador;
    // CapacitorHttp espera un objeto cuando el Content-Type es JSON.
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { /* lo dejamos como string */ }
    }

    const hasBody = method !== 'GET' && method !== 'HEAD' && body != null

    // ── 4. Ejecutar petición nativa ──────────────────────────────────────────
    try {
      const res = await CapacitorHttp.request({
        url,
        method,
        headers,
        data:            hasBody ? body : undefined,
        readTimeout:     config.timeout || 30000,
        connectTimeout:  config.timeout || 30000,
        responseType:    'json',
      })

      // ── 5. Construir respuesta axios-compatible ──────────────────────────
      const axiosResponse = {
        data:       res.data,
        status:     res.status,
        statusText: String(res.status),
        headers:    res.headers || {},
        config,
        request:    {},
      }

      // axios considera 2xx como éxito; fuera de rango lanza error con .response
      if (res.status < 200 || res.status >= 300) {
        const err = new Error(`Request failed with status code ${res.status}`)
        Object.assign(err, { isAxiosError: true, response: axiosResponse, config })
        throw err
      }

      return axiosResponse

    } catch (err) {
      // Si ya es un error axios (código de estado fuera de 2xx), relanzar tal cual
      if (err.isAxiosError) throw err

      // Error de red (sin respuesta del servidor)
      const netErr = new Error(err.message || 'Network Error')
      Object.assign(netErr, { isAxiosError: true, config, code: 'ERR_NETWORK' })
      throw netErr
    }
  }
}
