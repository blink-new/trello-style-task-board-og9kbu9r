
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    strictPort: true,
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '3000-ipvfl6yrtvqbu7w9eeuv5-fc27d547.blink.new',
      '.blink.new'
    ]
  }
})