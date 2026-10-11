import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  base: process.env.EBB_BASE || "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: [
        "icon.svg",
        "icon-192.png",
        "icon-512.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        id: "./",
        name: "Ebb — a little space",
        short_name: "Ebb",
        description: "A little space between impulse and choice.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        theme_color: "#FFFCF5",
        background_color: "#FFFCF5",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { environment: "node", setupFiles: ["tests/setup.ts"] },
});
