import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendURL = 'https://khatascan-backend-prod.onrender.com'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/receipts': {
        target: backendURL,
        changeOrigin: true,
        secure: true,
      },
      '/analytics': {
        target: backendURL,
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: backendURL,
        changeOrigin: true,
        secure: true,
      },
      '/auth': {
        target: backendURL,
        changeOrigin: true,
        secure: true,
      },
    },
  },
})