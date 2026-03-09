import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
const __dir = dirname(fileURLToPath(import.meta.url))

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    resolve(__dir, './index.html'),
    resolve(__dir, './src/**/*.{vue,js}')
  ],
  theme: {
    extend: {
      colors: {
        // Deep steel blue — primary accent
        steel: {
          50:  '#eff4fb',
          100: '#d9e4f2',
          200: '#b3c9e5',
          300: '#8daed8',
          400: '#6793cb',
          500: '#2c5f8a',
          600: '#1B3A5C',
          700: '#15304D',
          800: '#0f2540',
          900: '#091933',
        },
        // Ink / charcoal — text and dark elements
        ink: {
          50:  '#f7f7f8',
          100: '#ebebed',
          200: '#d6d6da',
          300: '#b0b0b8',
          400: '#8a8a95',
          500: '#65656f',
          600: '#4a4a53',
          700: '#333339',
          800: '#1f1f24',
          900: '#111114',
        },
        // Warm off-white surface
        surface: {
          DEFAULT: '#F8F8F6',
          card:    '#FFFFFF',
        },
        // Keep brand for legacy references
        brand: {
          50:  '#eff4fb',
          100: '#d9e4f2',
          200: '#b3c9e5',
          300: '#8daed8',
          400: '#6793cb',
          500: '#1B3A5C',
          600: '#15304D',
          700: '#0f2540',
          800: '#0a1d34',
          900: '#061527',
        },
      },
      fontFamily: {
        sans:  ['Inter',           'ui-sans-serif',  'system-ui',  'sans-serif'],
        serif: ['Playfair Display','Georgia',        'Cambria',    'serif'     ],
      },
      boxShadow: {
        'soft':   '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card':   '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'modal':  '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
        'float':  '0 8px 32px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    }
  },
  plugins: []
}
