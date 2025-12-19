import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 專案根目錄（monorepo root）
const rootDir = resolve(__dirname, '../..')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 修復 monorepo 中 vue-demi 衝突問題
      // 強制使用 Vue 3 版本的 vue-demi
      'vue-demi': resolve(rootDir, 'node_modules/vue-demi/lib/v3/index.mjs')
    },
    dedupe: ['vue', 'pinia']
  },
  optimizeDeps: {
    include: ['vue', 'pinia'],
    exclude: ['vue-demi']
  },
  server: {
    port: 5173,
    strictPort: true
  }
})

