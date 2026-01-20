import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis'
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: false, // Отключаем Terser, который вызывает Exit Code 1
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined // Упрощаем чанки для стабильности
      }
    }
  }
});