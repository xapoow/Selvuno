import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifestFilename: "manifest-v0.8.2.webmanifest",
      includeAssets: ["pwa.svg"],
      manifest: {
        id: "/",
        name: "MyFinances Budget Tracker",
        short_name: "MyFinances",
        description: "A local-first budget tracker for wallets, income, expenses, and backups.",
        theme_color: "#101412",
        background_color: "#101412",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json}"]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "@tanstack/react-query", "zustand"],
          motion: ["framer-motion"],
          charts: ["recharts"],
          storage: ["dexie", "zod"]
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true,
    testTimeout: 15000
  }
});
