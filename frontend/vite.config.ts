import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Where the ASP.NET API is running. Use http://localhost:5080 if you only run the http profile.
  const target = env.VITE_PROXY_TARGET || 'https://localhost:7080'

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5173,
      // The browser talks to /api on the Vite server and Vite forwards it to the API,
      // so no CORS policy is needed while developing.
      proxy: { '/api': { target, changeOrigin: true, secure: false } },
    },
  }
})
