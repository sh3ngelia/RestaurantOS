import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')
  const apiTarget = env.VITE_API_URL || 'https://localhost:7219'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      rolldownOptions: {
        output: {
          // Long-lived vendor chunks cache across deploys; app code changes most often.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/ },
              { name: 'motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/ },
              { name: 'vendor', test: /node_modules[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        // The dev server forwards /api and /hubs same-origin, so the browser never needs CORS.
        // `secure: false` accepts the ASP.NET Core self-signed development certificate.
        '/api': { target: apiTarget, changeOrigin: true, secure: false },
        // SignalR: the negotiate request is plain HTTP, then the connection upgrades to a WebSocket.
        '/hubs': { target: apiTarget, changeOrigin: true, secure: false, ws: true },
      },
    },
  }
})
