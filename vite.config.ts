import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  // Build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false, // Set to true for production debugging
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
  // Server configuration
  server: {
    port: 1337,
    open: true,
  },
  preview: {
    port: 1337,
  },
})
