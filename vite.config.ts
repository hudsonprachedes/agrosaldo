import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['react-input-mask'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separar node_modules em vendor chunks
          if (id.includes('node_modules')) {
            // React e bibliotecas principais
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // ApexCharts (gráficos)
            if (id.includes('apexcharts')) {
              return 'vendor-charts';
            }
            // UI libs (Radix, etc)
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            // Outras dependências
            return 'vendor';
          }
          
          // Separar páginas admin em chunk separado
          if (id.includes('/src/pages/admin/')) {
            return 'admin';
          }
          
          // Separar lib de indexeddb e db em chunk separado
          if (id.includes('/src/lib/indexeddb') || id.includes('/src/lib/db')) {
            return 'db';
          }
        },
      },
    },
    // Aumentar limite de aviso para chunks grandes
    chunkSizeWarningLimit: 1000,
    // Habilitar sourcemaps apenas em dev
    sourcemap: mode === 'development',
  },
}));
