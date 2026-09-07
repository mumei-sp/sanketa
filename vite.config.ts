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
        /**
         * Only the framework every route renders through is pinned to a shared
         * chunk. Everything else is left to Rollup, which places a library in
         * the route chunk that imports it — so FullCalendar ships with
         * /calendar and Recharts with the pages that actually draw charts,
         * instead of on the critical path for all of them.
         *
         * The previous rule matched `id.includes('react')`, which swept in
         * every `@radix-ui/react-*`, `lucide-react` and `react-hook-form`, and
         * a catch-all `vendor` took the rest — two chunks totalling 1.4 MB
         * before the first paint. The pattern below anchors on the package
         * directory so `react-dom` matches but `react-hook-form` does not.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          const framework = /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/
          return framework.test(id) ? 'react-vendor' : undefined
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
