import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: base:'/' ensures all asset paths (/assets/...) are absolute.
  // Without this, refreshing /student/dashboard would try to load
  // assets relative to /student/ and get 404s → blank white screen.
  base: '/',
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    host: true,
    port: 4173,
  }
})

