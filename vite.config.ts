import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  base: './', // Electronで相対パスを使用するため
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});