import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carica le variabili d'ambiente
  // Vite carica automaticamente .env, .env.local, .env.[mode], .env.[mode].local
  // Il parametro '.' indica la directory corrente come root
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: './', // Usa percorsi relativi per Hostinger
    resolve: {
      alias: {
        '@': resolve('./src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'https://enter.takeyourtrade.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['lucide-react', 'framer-motion'],
            store: ['zustand'],
          },
        },
      },
    },
    // NOTA: Vite carica automaticamente le variabili VITE_* da .env.production durante la build
    // Il blocco define è opzionale e serve solo per override espliciti o fallback
    // Rimuoviamo il define per evitare conflitti - Vite gestisce già tutto automaticamente
  }
})

