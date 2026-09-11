import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FlaskConical,
  Heart,
  Loader2,
  Martini,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/metricas")({
  head: () => ({
    meta: [
      { title: "Métricas do catálogo | Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Painel interno com métricas do catálogo, receitas e visitantes dos últimos 7 dias.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Métricas do catálogo" },
      {
        property: "og:description",
        content: "Métricas internas de catálogo, receitas e visitantes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MetricasPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
});

type Totais = {
  drinks: number;
  ingredientes: number;
  categorias: number;
  comentarios: number;
  curtidas: number;
  favoritos: number;
  usuarios: number;
};

type Metricas = {
  totais: Totais;
  por_dificuldade: { dificuldade: string; total: number }[];
  por_categoria: { categoria: string; total: number }[];
  top_curtidos: { nome: string; slug: string | null; total: number }[];
  top_comentados: { nome: string; slug: string | null; total: number }[];
  visitas_7d: { dia: string; visitas: number }[];
  rotas_mais_vistas: { rota: string; visitas: number }[];
};

function Barra({ valor, max }: { valor: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((valor / max) * 100)) : 0;
  return (
    <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-secondary" aria-hidden="true">
      <span className="rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </span>
  );
}

function MetricasPage() {
  const { isAdmin } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-metricas"],
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Metricas> => {
      const { data, error } = await supabase.rpc("admin_metricas");
      if (error) throw error;
      return data as Metricas;
    },
  });

  const maxCategoria = data ? Math.max(...data.por_categoria.map((c) => c.total), 0) : 0;
  const maxVisitas = data ? Math.max(...data.visitas_7d.map((v) => v.visitas), 0) : 0;

  const cards = data
    ? [
        { rotulo: "Receitas", valor: data.totais.drinks, Icon: Martini },
        { rotulo: "Ingredientes", valor: data.totais.ingredientes, Icon: FlaskConical },
        { rotulo: "Categorias", valor: data.totais.categorias, Icon: BarChart3 },
        { rotulo: "Usuários", valor: data.totais.usuarios, Icon: Users },
        { rotulo: "Curtidas", valor: data.totais.curtidas, Icon: Heart },
        { rotulo: "Comentários", valor: data.totais.comentarios, Icon: Comment },
        { rotulo: "Favoritos", valor: data.totais.favoritos, Icon: Star },
      ]
    : [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 font-serif text-3xl sm:text-4xl">
            <TrendingUp className="h-7 w-7 text-primary" aria-hidden="true" /> Métricas
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão geral do catálogo, do engajamento nas receitas e das visitas estimadas (amostra
            de 20% das sessões, últimos 7 dias). Para tempos de carregamento, veja{" "}
            <Link to="/desempenho" className="text-primary underline underline-offset-2">
              Desempenho real
            </Link>
            .
          </p>
        </header>

        {!isAdmin ? (
          <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Esta página é restrita a administradores.
          </p>
        ) : isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando métricas…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        ) : data ? (
          <>
            <section aria-label="Totais do catálogo">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {cards.map(({ rotulo, valor, Icon }) => (
                  <div
                    key={rotulo}
                    className="rounded-xl border border-border/60 bg-card/50 p-4"
                  >
                    <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> {rotulo}
                    </dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums">
                      {valor.toLocaleString("pt-BR")}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className="grid gap-6 md:grid-cols-2">
              <section
                aria-label="Receitas por categoria"
                className="rounded-xl border border-border/60 bg-card/50 p-4"
              >
                <h2 className="text-base font-semibold">Receitas por categoria</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {data.por_categoria.map((c) => (
                    <li key={c.categoria} className="flex items-center gap-3">
                      <span className="w-28 truncate">{c.categoria}</span>
                      <Barra valor={c.total} max={maxCategoria} />
                      <span className="w-10 text-right tabular-nums text-muted-foreground">
                        {c.total}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section
                aria-label="Receitas por dificuldade"
                className="rounded-xl border border-border/60 bg-card/50 p-4"
              >
                <h2 className="text-base font-semibold">Receitas por dificuldade</h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {data.por_dificuldade.map((d) => (
                    <li key={d.dificuldade} className="flex items-center gap-3">
                      <span className="w-28 truncate">{d.dificuldade}</span>
                      <Barra
                        valor={d.total}
                        max={Math.max(...data.por_dificuldade.map((x) => x.total), 0)}
                      />
                      <span className="w-10 text-right tabular-nums text-muted-foreground">
                        {d.total}
                      </span>
                    </li>
                  ))}
                </ul>

                <h2 className="mt-6 text-base font-semibold">Mais curtidas</h2>
                {data.top_curtidos.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Ainda sem curtidas.</p>
                ) : (
                  <ol className="mt-2 space-y-1 text-sm">
                    {data.top_curtidos.map((d) => (
                      <li key={d.nome} className="flex items-baseline justify-between gap-2">
                        <Link
                          to="/drinks/$id"
                          params={{ id: d.slug ?? d.nome }}
                          className="truncate text-primary underline-offset-2 hover:underline"
                        >
                          {d.nome}
                        </Link>
                        <span className="tabular-nums text-muted-foreground">{d.total}</span>
                      </li>
                    ))}
                  </ol>
                )}

                <h2 className="mt-6 text-base font-semibold">Mais comentadas</h2>
                {data.top_comentados.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Ainda sem comentários.</p>
                ) : (
                  <ol className="mt-2 space-y-1 text-sm">
                    {data.top_comentados.map((d) => (
                      <li key={d.nome} className="flex items-baseline justify-between gap-2">
                        <Link
                          to="/drinks/$id"
                          params={{ id: d.slug ?? d.nome }}
                          className="truncate text-primary underline-offset-2 hover:underline"
                        >
                          {d.nome}
                        </Link>
                        <span className="tabular-nums text-muted-foreground">{d.total}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <section
              aria-label="Visitantes dos últimos 7 dias"
              className="rounded-xl border border-border/60 bg-card/50 p-4"
            >
              <h2 className="text-base font-semibold">Visitantes (últimos 7 dias)</h2>
              {data.visitas_7d.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Ainda não há visitas medidas. Os dados aparecem conforme os visitantes navegam
                  pelo site publicado.
                </p>
              ) : (
                <>
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.visitas_7d.map((v) => (
                      <li key={v.dia} className="flex items-center gap-3">
                        <span className="w-28 tabular-nums">
                          {new Date(`${v.dia}T12:00:00`).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                        <Barra valor={v.visitas} max={maxVisitas} />
                        <span className="w-12 text-right tabular-nums text-muted-foreground">
                          ~{v.visitas}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <h3 className="mt-6 text-sm font-semibold">Páginas mais vistas</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {data.rotas_mais_vistas.map((r) => (
                      <li key={r.rota} className="flex items-baseline justify-between gap-2">
                        <span className="truncate">{r.rota}</span>
                        <span className="tabular-nums text-muted-foreground">~{r.visitas}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
