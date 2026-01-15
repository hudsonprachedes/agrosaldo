import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "localhost",
      port: 8080,
      strictPort: true,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 8080,
        clientPort: 8080,
      },
    },
    plugins: [react()],
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
