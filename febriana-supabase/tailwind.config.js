/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EF',
        beige: '#EDE3D3',
        sand: '#D9C7A7',
        ink: '#1F2733',
        gold: '#B98A2F',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
