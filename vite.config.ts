import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/wecom': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wecom/, '/api/wecom'),
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
