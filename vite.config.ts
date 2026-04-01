import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // 关键：当使用无后缀 import 时，优先命中 TS/TSX，避免同名 .js 抢占解析
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.cjs', '.json'],
  },
  server: {
    port: 3000,
    strictPort: false, // 如果端口被占用，自动切换到下一个可用端口
    host: '0.0.0.0', // 监听所有网络接口，允许 localhost 和 IP 访问
    // Vite 默认支持 SPA 路由，所有未匹配的路由都会回退到 index.html
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

