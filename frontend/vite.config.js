import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    outDir: 'dist',
    // Ensure assets are embedded correctly for SPA routing
    chunkSizeWarningLimit: 1000,
  },
  // Enable SPA fallback for vite preview (local production testing)
  preview: {
    host: true,
    port: 4173,
  }
})
