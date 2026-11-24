import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

/** Site de projeto no GitHub Pages: https://danieldccn.github.io/gerador-de-moveisinator-2000/ */
const pagesBase = "/gerador-de-moveisinator-2000/"

export default defineConfig({
  base: pagesBase,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Oficina Clara — gaveteiro em MDF",
        short_name: "Oficina Clara",
        description: "Projeto de gaveteiro em MDF: peças, corte, materiais e montagem.",
        lang: "pt-BR",
        dir: "ltr",
        id: pagesBase,
        start_url: pagesBase,
        scope: pagesBase,
        display: "standalone",
        background_color: "#e4dfd3",
        theme_color: "#161616",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        navigateFallback: "index.html",
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 4179,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4179,
    strictPort: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
