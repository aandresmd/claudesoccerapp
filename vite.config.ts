import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/claudesoccerapp/ on GitHub Pages
  base: '/claudesoccerapp/',
  plugins: [react()],
})
