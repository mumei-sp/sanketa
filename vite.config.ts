import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import mdx from '@mdx-js/rollup'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mdx()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@features': path.resolve(__dirname, './src/features'),
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
      // Exclude docs folder from build
      external: (id) => id.includes('/docs/'),
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
  // Server configuration — PORT env (set by tooling like IDE previews) wins
  // over the default so the assigned port and the served port always agree.
  server: {
    port: Number(process.env.PORT) || 1337,
    open: false,
    allowedHosts: ['.ngrok-free.app'],
  },
  preview: {
    port: Number(process.env.PORT) || 1337,
  },
})
