import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' supaya hasil build bisa di-host di GitHub Pages
// dengan nama repo apa pun, tanpa ubah config.
export default defineConfig({
  plugins: [react()],
  base: './',
})
