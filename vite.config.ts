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
      // Use Rollup's default chunking to avoid circular init ordering issues
      chunkSizeWarningLimit: 1000,
      // Enable sourcemaps only in dev
      sourcemap: mode === 'development',
    },
  };
});
