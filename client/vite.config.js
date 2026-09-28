import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo-icon.png", "logo-full.jpg"],
      manifest: {
        name: "FC RIDE SQUAD",
        short_name: "FC Ride Squad",
        description: "Registration, live tracking, and ride board for a 450km group ride.",
        theme_color: "#7C5CFF",
        background_color: "#150F2B",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Precache the built app shell so the tracker page can open with no
        // signal at all, as long as it's been visited once before.
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // Prefer fresh data, but fall back to the last-seen response
            // when offline (rider status, ride history, the board, etc.).
            // Writes (POST/PATCH) are never cached here — the app's own
            // localStorage queue in TrackRide.jsx handles those.
            urlPattern: ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "api-get-cache",
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
