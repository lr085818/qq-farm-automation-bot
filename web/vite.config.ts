import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'

const corePackageJson = JSON.parse(readFileSync('../core/package.json', 'utf-8'))
const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:3009'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS() as any,
  ],
  build: {
    minify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router') || id.includes('@vueuse')) {
              return 'vendor-vue'
            }
            if (id.includes('axios')) {
              return 'vendor-axios'
            }
            // Split other large dependencies if needed
            if (id.includes('echarts') || id.includes('zrender')) {
              return 'vendor-echarts'
            }
            // Default vendor chunk
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(corePackageJson.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/socket.io': {
        target: apiTarget,
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/game-config': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
