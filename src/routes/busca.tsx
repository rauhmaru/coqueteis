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
import { drinksPaginaQuery } from "@/lib/queries";
import { nomeDaOrdem, ordemDrinksValida } from "@/lib/ordenacao-drinks";

const POR_PAGINA = 24;
const FILTROS = { ingredientes: [] as string[], categorias: [] as string[], dificuldades: [] as string[], qtd: null, comparador: "igual" };

export const Route = createFileRoute("/busca")({
  validateSearch: (search: Record<string, unknown>) => {
    const pagina = Number(search["pagina"]);
    return {
      q: typeof search["q"] === "string" ? search["q"].slice(0, 100) : "",
      pagina: Number.isFinite(pagina) && pagina >= 1 ? Math.min(Math.floor(pagina), 100) : 1,
      ordem: ordemDrinksValida(search["ordem"]),
    };
  },
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
  const { q, pagina, ordem } = Route.useSearch();
  const navigate = useNavigate({ from: "/busca" });
  const [viewMode, setViewMode] = useViewMode("busca", "grid");
  const limite = pagina * POR_PAGINA;
  const { data, isFetching } = useQuery({
    ...drinksPaginaQuery(FILTROS, limite, ordem, q),
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