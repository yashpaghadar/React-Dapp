import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,

  },
  preview: {
    port: 4173,
    strictPort: true,
    open: true,
    dir: './dist'
  },
});
