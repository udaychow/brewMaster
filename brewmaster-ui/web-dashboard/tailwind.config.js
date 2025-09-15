/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdecd3',
          200: '#fbd5a5',
          300: '#f7b36d',
          400: '#f18d33',
          500: '#ec6e0b',
          600: '#dd5506',
          700: '#b73e08',
          800: '#94330e',
          900: '#792c0f',
        },
        brewing: {
          amber: '#D2691E',
          gold: '#FFD700',
          copper: '#B87333',
          dark: '#654321',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
  ],
}