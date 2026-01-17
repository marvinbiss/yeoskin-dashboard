import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts library (usually largest)
          'vendor-charts': ['recharts'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'date-fns', 'clsx'],
        },
      },
    },
  },
})
