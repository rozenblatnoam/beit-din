import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:8000';

// In dev, proxy all API routes through Vite so cookies are same-origin (httpOnly works without HTTPS)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth':          { target: BACKEND, changeOrigin: true },
      '/cases':         { target: BACKEND, changeOrigin: true },
      '/payments':      { target: BACKEND, changeOrigin: true },
      '/documents':     { target: BACKEND, changeOrigin: true },
      '/schedule':      { target: BACKEND, changeOrigin: true },
      '/admin':         { target: BACKEND, changeOrigin: true },
      '/dayan':         { target: BACKEND, changeOrigin: true },
      '/lawyer':        { target: BACKEND, changeOrigin: true },
      '/notifications': { target: BACKEND, changeOrigin: true },
      '/events':        { target: BACKEND, changeOrigin: true },
      '/search':        { target: BACKEND, changeOrigin: true },
      '/inbox':         { target: BACKEND, changeOrigin: true },
      '/health':        { target: BACKEND, changeOrigin: true },
    },
  },
})
