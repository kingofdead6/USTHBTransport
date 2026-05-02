/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f172a', // slate-900
          card: '#1e293b',    // slate-800
          border: '#334155',  // slate-700
          hover: '#475569',   // slate-600
        },
        brand: {
          400: '#60a5fa', // blue-400
          500: '#3b82f6', // blue-500
          600: '#2563eb', // blue-600
          700: '#1d4ed8', // blue-700
          800: '#1e40af', // blue-800
          900: '#1e3a8a', // blue-900
        },
        accent: {
          green: '#10b981',   // emerald-500
          yellow: '#f59e0b',  // amber-500
          red: '#ef4444',     // red-500
          purple: '#8b5cf6',  // violet-500
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}