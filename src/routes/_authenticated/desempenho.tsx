import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gauge, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/desempenho")({
  head: () => ({
    meta: [
      { title: "Desempenho real das páginas | Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Painel interno com mediana e percentil 75 das métricas de experiência (LCP, CLS, INP e TTFB) por página nos últimos 7 dias.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Desempenho real das páginas" },
      {
        property: "og:description",
        content: "Mediana e percentil 75 das métricas de carregamento por página.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DesempenhoPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
});

type Linha = { rota: string; amostras: number; mediana: number; p75: number };

const METRICAS = [
  { id: "LCP", rotulo: "LCP (maior conteúdo)", bom: 2500, ruim: 4000, unidade: "ms" },
  { id: "INP", rotulo: "INP (resposta ao toque)", bom: 200, ruim: 500, unidade: "ms" },
  { id: "CLS", rotulo: "CLS (estabilidade visual)", bom: 0.1, ruim: 0.25, unidade: "" },
  { id: "TTFB", rotulo: "TTFB (primeiro byte)", bom: 800, ruim: 1800, unidade: "ms" },
] as const;

function formatar(valor: number, unidade: string) {
  if (unidade === "ms") return `${Math.round(valor)} ms`;
  return valor.toFixed(3);
}

function cor(valor: number, bom: number, ruim: number) {
  if (valor <= bom) return "text-emerald-500";
  if (valor <= ruim) return "text-amber-500";
  return "text-destructive";
}

function DesempenhoPage() {
  const { isAdmin } = useAuth();
  const [metrica, setMetrica] = useState<(typeof METRICAS)[number]["id"]>("LCP");
  const atual = METRICAS.find((m) => m.id === metrica)!;

  const { data, isLoading, error } = useQuery({
    queryKey: ["web-vitals-resumo", metrica],
    enabled: isAdmin,
    queryFn: async (): Promise<Linha[]> => {
      const { data, error } = await supabase.rpc("web_vitals_resumo", {
        _metrica: metrica,
        _dias: 7,
      });
      if (error) throw error;
      return (data ?? []) as Linha[];
    },
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 font-serif text-3xl sm:text-4xl">
            <Gauge className="h-7 w-7 text-primary" aria-hidden="true" /> Desempenho real
          </h1>
          <p className="text-sm text-muted-foreground">
            Medições feitas nos navegadores dos visitantes (amostra de 20% das sessões) nos últimos
            7 dias. Mediana é a experiência típica; o percentil 75 mostra os acessos mais lentos.
          </p>
        </header>

        {!isAdmin ? (
          <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Esta página é restrita a administradores.
          </p>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Métrica exibida"
              className="flex flex-wrap gap-2"
            >
              {METRICAS.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={m.id === metrica}
                  onClick={() => setMetrica(m.id)}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    m.id === metrica
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>

            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando
                medições…
              </p>
            )}
            {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

            {data && data.length === 0 && (
              <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                Ainda não há medições suficientes. Os dados aparecem conforme os visitantes navegam
                pelo site publicado.
              </p>
            )}

            {data && data.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    {atual.rotulo} por página nos últimos 7 dias
                  </caption>
                  <thead className="bg-secondary/50 text-left">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">
                        Página
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
                        Mediana
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
                        Percentil 75
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold">
                        Amostras
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((linha) => (
                      <tr key={linha.rota} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{linha.rota}</td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${cor(linha.mediana, atual.bom, atual.ruim)}`}
                        >
                          {formatar(linha.mediana, atual.unidade)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${cor(linha.p75, atual.bom, atual.ruim)}`}
                        >
                          {formatar(linha.p75, atual.unidade)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {linha.amostras}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
