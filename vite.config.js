import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './src',
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
  base: "/React-Dapp",
  assetsInclude: ['**/*.json'],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/main.jsx',
      },
    },
  },
});
