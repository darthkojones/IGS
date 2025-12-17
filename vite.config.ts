import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/IGS/',
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  // Vite dev server settings, This runs onyl in Tinsae's server
  // accessible from outside network at dev.tinsae.net (https)
  // if it gives you probems, please tell me before changing it and pushing.
  // I may forget the settings later on. and it may break the dev server.
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort:true,
    hmr: {
      protocol: 'wss',
      host: 'dev.tinsae.net',
      clientPort: 443
    }
  }
})
