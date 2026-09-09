import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Coleta das Web Vitals do campo (LCP, CLS, INP, TTFB).
 * Recebe lotes pequenos via `sendBeacon` e grava no banco pelo servidor,
 * para que a tabela não fique exposta a escrita anônima direta.
 */
const esquema = z.object({
  rota: z.string().min(1).max(200),
  metrica: z.enum(["LCP", "CLS", "INP", "TTFB", "FCP"]),
  valor: z.number().finite().min(0).max(3_600_000),
  avaliacao: z.enum(["good", "needs-improvement", "poor"]).nullish(),
  tipo_navegacao: z.string().max(40).nullish(),
  conexao: z.string().max(40).nullish(),
});

const lote = z.array(esquema).min(1).max(10);

export const Route = createFileRoute("/api/public/web-vitals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let corpo: unknown;
        try {
          corpo = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const parsed = lote.safeParse(Array.isArray(corpo) ? corpo : [corpo]);
        if (!parsed.success) return new Response("Bad request", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("web_vitals").insert(
          parsed.data.map((m) => ({
            rota: m.rota,
            metrica: m.metrica,
            valor: m.valor,
            avaliacao: m.avaliacao ?? null,
            tipo_navegacao: m.tipo_navegacao ?? null,
            conexao: m.conexao ?? null,
          })),
        );
        if (error) {
          console.error("[web-vitals]", error.message);
          return new Response("Erro ao registrar", { status: 500 });
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
