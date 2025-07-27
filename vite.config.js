import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/web': {
        // target: 'http://localhost:8099',
        target: 'http://47.84.73.57:5070',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/web/, ''), //路径重写，把'/web'替换为''
      },
    },
  }

})
