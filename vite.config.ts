import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Гарантируем наличие process.env в браузере
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'global': 'globalThis',
  },
  server: {
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext'
  }
});