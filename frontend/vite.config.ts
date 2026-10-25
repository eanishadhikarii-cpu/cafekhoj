import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js and React Three Fiber are the largest contributors (~900 kB)
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Leaflet map
          'map-vendor': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
