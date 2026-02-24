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
    port: Number(process.env.PORT) || 3000,
    hmr: {
      clientPort: Number(process.env.PORT) || 3000,
      port: Number(process.env.PORT) || 3000,
    },
    watch: null, // отключаем наблюдение за файлами — страница не будет перезагружаться при сохранении
  },
});
