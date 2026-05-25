import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,        // ← ADD THIS - allows access from other devices on the network
    port: 5173,
    open: true,
    strictPort: true,  // ← ADD THIS - ensures it uses port 5173
    cors: true,        // ← ADD THIS - enables CORS for mobile access
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: true,
    port: 5173
  }
})