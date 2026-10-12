import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 仅供 dev/测试环境使用：代理百度地图 GL 主脚本（生产构建请用 index.html 中的百度直链）
      '/bmapgl': {
        target: 'https://api.map.baidu.com',
        changeOrigin: true,
        rewrite: () =>
          '/getscript?type=webgl&v=1.0&ak=IwPC9IpdUBx2lRel17WexwWX3V4zEvQy&services=',
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
