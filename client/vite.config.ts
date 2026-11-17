import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Express API listens on 3001 by default; the production build in
// client/dist is served by Express itself (with SPA fallback).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});
