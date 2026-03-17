import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId:   'com.glasscaribe.conductor',
  appName: 'Glass Caribe',
  webDir:  'dist',

  android: {
    allowMixedContent:             false,
    captureInput:                  true,
    webContentsDebuggingEnabled:   false
  },

  plugins: {
    // Configuración del plugin de GPS nativo en background
    BackgroundGeolocation: {
      backgroundMessage:  'Glass Caribe está usando tu ubicación para el seguimiento de entregas',
      backgroundTitle:    'Glass Caribe — GPS activo',
      requestPermissions: true
    }
  }
}

export default config
