import { createFileRoute } from "@tanstack/react-router";

/**
 * Serve as imagens de drinks numa URL pública estável (sem token de expiração),
 * lendo do bucket privado no servidor. Usada nos <img> responsivos, em
 * og:image/twitter:image e no compartilhamento de receitas.
 *
 * Aceita `?w=200|400|800` para pedir a variante redimensionada (WebP) pelo
 * transform de imagem do Storage; se o transform não estiver disponível,
 * cai para o arquivo original.
 */
const LARGURAS = new Set([200, 400, 800]);

export const Route = createFileRoute("/api/public/drink-image/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = decodeURIComponent((params as { _splat?: string })._splat ?? "");
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const w = Number(new URL(request.url).searchParams.get("w"));
        const largura = LARGURAS.has(w) ? w : null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const bucket = supabaseAdmin.storage.from("drink-images");

        if (largura) {
          const { data, error } = await bucket.download(path, {
            transform: { width: largura, height: largura, resize: "contain", quality: 78 },
          });
          if (!error && data) {
            return new Response(await data.arrayBuffer(), {
              headers: {
                "Content-Type": data.type || "image/webp",
                "Cache-Control": "public, max-age=31536000, immutable",
                Vary: "Accept",
              },
            });
          }
        }

        const { data, error } = await bucket.download(path);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
