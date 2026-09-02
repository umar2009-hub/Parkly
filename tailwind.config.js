/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: '#0A0A0B',
          surface: '#121214',
          'surface-hover': '#1C1C20',
          lime: '#84CC16',
          'lime-hover': '#A3E635',
          'lime-glow': '#CCFF00',
        },
        // Standard semantic styling
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'scan': 'scan-anim 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-marker': 'marker-pulse 2s infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer-anim 1.5s infinite linear',
      },
      keyframes: {
        'scan-anim': {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.4' },
          '50%': { transform: 'translateY(360px)', opacity: '1' },
        },
        'marker-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(132, 204, 22, 0.4)' },
          '70%': { transform: 'scale(1.1)', opacity: '0.8', boxShadow: '0 0 0 10px rgba(132, 204, 22, 0)' },
          '100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(132, 204, 22, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'shimmer-anim': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
