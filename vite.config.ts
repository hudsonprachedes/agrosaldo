import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  if (mode === "development") {
    try {
      const mod = await import("lovable-tagger");
      if (mod?.componentTagger) {
        plugins.push(mod.componentTagger());
      }
    } catch {
      console.warn("lovable-tagger not installed; proceeding without it");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 8080,
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
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
  };
});
