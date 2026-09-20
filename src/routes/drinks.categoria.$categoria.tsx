import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { ArrowLeft, Loader2, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DrinkCatalogCard } from "@/components/drink-catalog-card";
import { DrinkOrderSelect } from "@/components/drink-order-select";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { drinkCategoriasQuery, drinksPaginaQuery, ingredientesQuery } from "@/lib/queries";
import { nomeDaOrdem, ORDEM_PADRAO } from "@/lib/ordenacao-drinks";
import { slugify } from "@/lib/slug";
import { useDrinkFilters } from "@/components/drink-filters";
import { filtrosDaBusca, parametrosDosFiltros, validarBuscaDrinks } from "@/lib/drink-filter-search";

const POR_PAGINA = 24;
const filtrosCategoria = (categoriaId: string) => ({
  ingredientes: [] as string[],
  categorias: [categoriaId],
  dificuldades: [] as string[],
  qtd: null,
  comparador: "igual",
});

type LoaderData = { nome: string; id: string; total: number };

export const Route = createFileRoute("/drinks/categoria/$categoria")({
  validateSearch: validarBuscaDrinks,
  head: ({ params, loaderData }) => {
    const dados = loaderData as unknown as LoaderData | undefined;
    const url = `https://coqueteis.lovable.app/drinks/categoria/${params.categoria}`;
    const titulo = dados ? `Drinks ${dados.nome} — ${dados.total} receitas`.slice(0, 59) : "Categoria de drinks — Destilados & Coquetéis";
    const descricao = dados
      ? `Receitas de drinks ${dados.nome.toLowerCase()}: ${dados.total} coquetéis com ingredientes e passo a passo.`.slice(0, 158)
      : "Receitas de coquetéis organizadas por categoria.";
    return {
      meta: [
        { title: titulo }, { name: "description", content: descricao },
        { property: "og:title", content: titulo }, { property: "og:description", content: descricao },
        { property: "og:type", content: "website" }, { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: async ({ context, params }): Promise<LoaderData> => {
    const [categorias] = await Promise.all([
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
      context.queryClient.ensureQueryData(ingredientesQuery),
    ]);
    const categoria = categorias.find((item) => slugify(item.nome) === params.categoria);
    if (!categoria) throw notFound();
    const data = await context.queryClient.ensureQueryData(
      drinksPaginaQuery(filtrosCategoria(categoria.id), 1),
    );
    return { nome: categoria.nome, id: categoria.id, total: data.total };
  },
  component: CategoriaPage,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-12 text-center text-muted-foreground">Categoria não encontrada.</div>,
});

function CategoriaPage() {
  const { categoria: slug } = Route.useParams();
  const search = Route.useSearch();
  const { pagina = 1, ordem = ORDEM_PADRAO, q = "" } = search;
  const navigate = useNavigate({ from: "/drinks/categoria/$categoria" });
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const categoria = categorias.find((item) => slugify(item.nome) === slug);
  const [viewMode, setViewMode] = useViewMode(`categoria:${slug}`, "grid");
  if (!categoria) return null;

  const filtrosIniciais = filtrosDaBusca(search, ingredientes, categorias);
  const atualizarFiltros = useCallback((filtros: typeof filtrosIniciais) => navigate({
    search: (prev) => ({ ...prev, ...parametrosDosFiltros(filtros, ingredientes, categorias), pagina: 1 }),
    replace: true,
    resetScroll: false,
  }), [categorias, ingredientes, navigate]);
  const { element: filtrosUI, filtrosServidor: filtrosAdicionais, ativos } = useDrinkFilters({
    ingredientes, categorias, idPrefix: `categoria-${slug}-filtro`, initialFilters: filtrosIniciais, onFiltersChange: atualizarFiltros,
  });
  const filtrosServidor = { ...filtrosAdicionais, categorias: [...new Set([categoria.id, ...filtrosAdicionais.categorias])] };

  const limite = pagina * POR_PAGINA;
  const { data, isFetching } = useQuery({
    ...drinksPaginaQuery(filtrosServidor, limite, ordem, q),
    placeholderData: keepPreviousData,
  });
  const lista = data?.drinks ?? [];
  const total = data?.total ?? 0;
  const temMais = lista.length < total;

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <Link to="/drinks" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todos os drinks
        </Link>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Categoria</p>
            <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Drinks {categoria.nome}</h1>
            <p className="text-sm text-muted-foreground">{total} {total === 1 ? "receita" : "receitas"} nesta categoria.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <DrinkOrderSelect value={ordem} onChange={(nova) => navigate({ search: { pagina: 1, ordem: nova }, replace: true, resetScroll: false })} />
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
          </div>
        </header>
        <CampoBuscaDrinks id={`busca-categoria-${slug}`} value={q} onChange={(valor) => navigate({ search: (prev) => ({ ...prev, q: valor || undefined, pagina: 1 }), replace: true, resetScroll: false })} className="max-w-xl" />
        <details open={ativos > 0} className="rounded-xl border border-border bg-card p-4">
          <summary className="min-h-11 cursor-pointer font-medium">Filtros{ativos > 0 ? ` (${ativos})` : ""}</summary>
          <div className="pt-4">{filtrosUI}</div>
        </details>
        <p aria-live="polite" className="sr-only">{total} receitas. Ordenado por {nomeDaOrdem(ordem)}.</p>
        {total === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Nenhuma receita nesta categoria ainda.</p>
          </div>
        ) : (
          <>
            <ul className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-3"}>
              {lista.map((drink) => <DrinkCatalogCard key={drink.id} drink={drink} />)}
            </ul>
            {temMais && (
              <div className="text-center">
                <Button variant="outline" disabled={isFetching} onClick={() => navigate({ search: { pagina: pagina + 1, ordem }, resetScroll: false })}>
                  {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Carregar mais {Math.min(POR_PAGINA, total - lista.length)}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}