
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    // Add allowedHosts configuration to allow Blink hosts
    hmr: {
      clientPort: 443
    },
    watch: {
      usePolling: true
    },
    cors: true
  },
  define: {
    // Ensure process.env is available for compatibility
    'process.env': {},
  },
});