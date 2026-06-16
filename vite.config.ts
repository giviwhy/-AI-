import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 部署配置
// 仓库名为 '-AI-'，base 路径为 '/-AI-/'
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/-AI-/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
