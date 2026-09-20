import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Loader2, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CampoBuscaDrinks } from "@/components/drink-search";
import { DrinkCatalogCard } from "@/components/drink-catalog-card";
import { DrinkOrderSelect } from "@/components/drink-order-select";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { Button } from "@/components/ui/button";
import { useViewMode } from "@/hooks/use-view-mode";
import { drinkCategoriasQuery, drinksPaginaQuery, ingredientesQuery } from "@/lib/queries";
import { nomeDaOrdem, ORDEM_PADRAO } from "@/lib/ordenacao-drinks";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useDrinkFilters } from "@/components/drink-filters";
import { filtrosDaBusca, parametrosDosFiltros, validarBuscaDrinks } from "@/lib/drink-filter-search";

const POR_PAGINA = 24;
export const Route = createFileRoute("/busca")({
  validateSearch: validarBuscaDrinks,
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(ingredientesQuery),
    context.queryClient.ensureQueryData(drinkCategoriasQuery),
  ]),
  head: () => ({
    meta: [
      { title: "Buscar receitas de drinks — Destilados & Coquetéis" },
      { name: "description", content: "Busque receitas por nome, ingrediente ou categoria e ordene os resultados." },
      { property: "og:title", content: "Buscar receitas de drinks" },
      { property: "og:description", content: "Encontre coquetéis por nome, ingrediente ou categoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/busca" }],
  }),
  component: BuscaPage,
});

function BuscaPage() {
  const search = Route.useSearch();
  const { q = "", pagina = 1, ordem = ORDEM_PADRAO } = search;
  const navigate = useNavigate({ from: "/busca" });
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const filtrosIniciais = filtrosDaBusca(search, ingredientes, categorias);
  const atualizarFiltros = useCallback((filtros: typeof filtrosIniciais) => navigate({
    search: (prev) => ({ ...prev, ...parametrosDosFiltros(filtros, ingredientes, categorias), pagina: 1 }),
    replace: true,
    resetScroll: false,
  }), [categorias, ingredientes, navigate]);
  const { element: filtrosUI, filtrosServidor, ativos } = useDrinkFilters({
    ingredientes, categorias, idPrefix: "busca-filtro", initialFilters: filtrosIniciais, onFiltersChange: atualizarFiltros,
  });
  const [viewMode, setViewMode] = useViewMode("busca", "grid");
  const limite = pagina * POR_PAGINA;
  const { data, isFetching } = useQuery({
    ...drinksPaginaQuery(filtrosServidor, limite, ordem, q),
    placeholderData: keepPreviousData,
  });
  const lista = data?.drinks ?? [];
  const total = q.trim() ? data?.total ?? 0 : 0;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Buscar drinks</h1>
          <p className="text-sm text-muted-foreground">Encontre receitas por nome, ingrediente ou categoria.</p>
        </header>
        <CampoBuscaDrinks id="busca-catalogo" value={q} onChange={(valor) => navigate({ search: { q: valor, pagina: 1, ordem }, replace: true, resetScroll: false })} className="max-w-xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{q.trim() ? `${total} ${total === 1 ? "receita encontrada" : "receitas encontradas"}` : "Digite para buscar no catálogo"}</p>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <DrinkOrderSelect value={ordem} onChange={(nova) => navigate({ search: { q, pagina: 1, ordem: nova }, replace: true, resetScroll: false })} />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>
        <details open={ativos > 0} className="rounded-xl border border-border bg-card p-4">
          <summary className="min-h-11 cursor-pointer font-medium">Filtros{ativos > 0 ? ` (${ativos})` : ""}</summary>
          <div className="pt-4">{filtrosUI}</div>
        </details>
        <p aria-live="polite" className="sr-only">{q.trim() ? `${total} resultados. Ordenado por ${nomeDaOrdem(ordem)}.` : ""}</p>
        {q.trim() && total === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Nenhum drink encontrado para “{q}”.</p>
          </div>
        ) : q.trim() ? (
          <>
            <ul className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3"}>
              {lista.map((drink) => <DrinkCatalogCard key={drink.id} drink={drink} />)}
            </ul>
            {lista.length < total && (
              <div className="text-center">
                <Button variant="outline" disabled={isFetching} onClick={() => navigate({ search: { q, pagina: pagina + 1, ordem }, resetScroll: false })}>
                  {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Carregar mais {Math.min(POR_PAGINA, total - lista.length)}
                </Button>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}