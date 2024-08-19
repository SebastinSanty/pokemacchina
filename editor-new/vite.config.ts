import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {

      /**
       * When developing locally - proxies "/api" to the local Colyseus server.
       * This mimics the behaviour of the production server.
       */
      '/api': {
        target: 'http://localhost:2567',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },

    },
  },
})
