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
        // Glass Caribe blue — primary accent
        steel: {
          50:  '#EBF5FB',
          100: '#C6E3F3',
          200: '#9DD0EC',
          300: '#6EBCE3',
          400: '#3FA8DB',
          500: '#0F8ACB',
          600: '#0D89CB',
          700: '#00659C',
          800: '#004E79',
          900: '#003A5A',
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
          50:  '#EBF5FB',
          100: '#C6E3F3',
          200: '#9DD0EC',
          300: '#6EBCE3',
          400: '#3FA8DB',
          500: '#0D89CB',
          600: '#00659C',
          700: '#004E79',
          800: '#003A5A',
          900: '#002A42',
        },
      },
      fontFamily: {
        sans:  ['Roboto', 'ui-sans-serif',  'system-ui',  'sans-serif'],
        serif: ['Roboto', 'ui-sans-serif',  'system-ui',  'sans-serif'],
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
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.25s ease both',
        'scale-in':   'scaleIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        'slide-right':'slideRight 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'float':      'float 3s ease-in-out infinite',
        'spin-fast':  'spinFast 0.7s linear infinite',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideRight: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-6px)' },
        },
        spinFast: {
          to: { transform: 'rotate(360deg)' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '1' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
    }
  },
  plugins: []
}
