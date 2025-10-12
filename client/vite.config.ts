import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
      "@assets": path.resolve(__dirname, "../attached_assets"),
    },
  },
  root: ".",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    host: true, // Listen on all addresses
    port: 5173,
    strictPort: true, // Fail if port is in use
    fs: {
      strict: true,
      allow: ['.'], // Allow serving files from project root
    },
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true
      }
    }
  },
});
