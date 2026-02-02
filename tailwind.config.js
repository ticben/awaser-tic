
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          950: '#020617',
        },
      },
      animation: {
        'ar-pulse': 'pulse-soft 2s infinite',
      },
    },
  },
  plugins: [],
}
