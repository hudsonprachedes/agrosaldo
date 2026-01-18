import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import packageJson from "./package.json";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "localhost",
      port: 5173,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        clientPort: 5173,
      },
    },
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Use Rollup's default chunking to avoid circular init ordering issues
      chunkSizeWarningLimit: 1500,
      // Enable sourcemaps only in dev
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            return undefined;
          },
        },
      },
    },
  };
});
