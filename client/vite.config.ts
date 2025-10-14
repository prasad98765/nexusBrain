import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

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
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0", // Listen on all addresses
    port: 5173,
    strictPort: true, // Fail if port is in use
    fs: {
      strict: true,
      allow: ['.'], // Allow serving files from project root
    },
    proxy: {
      '/api': {
        target: 'http://13.204.192.82:5001/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
    // ✅ Also allow domain for preview builds
  preview: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["nexusaihub.co.in", "www.nexusaihub.co.in", "localhost"],
  },
});
