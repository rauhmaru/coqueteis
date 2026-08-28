// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      mcpPlugin(),
      VitePWA({
        // O registro acontece só em src/lib/pwa.ts (com guardas de preview/dev).
        injectRegister: null,
        registerType: "autoUpdate",
        filename: "sw.js",
        strategies: "generateSW",
        // O bundle do cliente (servido na raiz do site) fica em dist/client.
        outDir: "dist/client",
        devOptions: { enabled: false },
        manifest: {
          id: "/",
          name: "Destilados & Coquetéis",
          short_name: "D&C",
          description:
            "Receitas de coquetéis, mixologia e controle do seu bar — funciona até sem internet.",
          lang: "pt-BR",
          dir: "ltr",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#1c1714",
          theme_color: "#1c1714",
          categories: ["food", "lifestyle", "utilities"],
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            {
              src: "/icon-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
          // HTML é sempre servido pelo SSR: nunca cache-first, nunca fallback de navegação.
          navigateFallback: undefined,
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/\.mcp/, /^\/mcp/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          runtimeCaching: [
            {
              // Navegações (HTML): rede primeiro, cache só como rede de segurança.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "dc-paginas",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Imagens dos drinks (endpoint público que reduz via Storage transform).
              urlPattern: ({ url }) => url.pathname.startsWith("/api/public/drink-image/"),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "dc-imagens-drinks",
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Consultas de receitas/ingredientes no backend.
              urlPattern: ({ url }) =>
                /\/rest\/v1\//.test(url.pathname) && url.hostname.endsWith(".supabase.co"),
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "dc-receitas-api",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "dc-fontes",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
