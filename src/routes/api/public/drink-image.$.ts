import { createFileRoute } from "@tanstack/react-router";

/**
 * Serve as imagens de drinks numa URL pública estável (sem token de expiração),
 * lendo do bucket privado no servidor. Usada em og:image/twitter:image e no
 * compartilhamento de receitas.
 */
export const Route = createFileRoute("/api/public/drink-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = decodeURIComponent((params as { _splat?: string })._splat ?? "");
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("drink-images").download(path);
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
