/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gentle-pulse': 'gentle-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll-indicator': 'scroll-indicator 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 1.5s ease-out forwards',
        'fade-in': 'fade-in 2s ease-out forwards',
        'tracking-expand': 'tracking-expand 2s ease-out forwards',
        'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'scroll-indicator': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top', opacity: '0' },
          '50%': { transform: 'scaleY(1)', transformOrigin: 'top', opacity: '1' },
          '51%': { transform: 'scaleY(1)', transformOrigin: 'bottom', opacity: '1' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom', opacity: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'tracking-expand': {
          '0%': { letterSpacing: '0.1em', opacity: '0' },
          '100%': { letterSpacing: '0.5em', opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
