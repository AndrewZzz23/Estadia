/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f8f6',
          100: '#d0ece6',
          200: '#a1d9ce',
          300: '#64B5A0',  // teal claro (dots dark logo)
          400: '#3d9a85',
          500: '#2A7A68',  // teal principal (dots light logo)
          600: '#226355',
          700: '#1a4d42',
          800: '#1E3E50',  // azul marino oscuro (dots dark logo)
          900: '#1B2B3A',  // texto oscuro (light logo)
        },
        accent: {
          400: '#d4814f',
          500: '#C4693A',  // naranja pin (exacto del SVG)
          600: '#a8572f',
        },
        cream: '#F5F3EF',  // fondo claro logo
      },
    },
  },
  plugins: [],
}

