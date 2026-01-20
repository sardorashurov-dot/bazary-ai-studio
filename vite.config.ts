import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Это единственный способ передать секретный ключ из Vercel в код приложения
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});