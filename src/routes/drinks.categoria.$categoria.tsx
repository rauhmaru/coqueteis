import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { DrinkCatalogCard } from "@/components/drink-catalog-card";
import { DrinkOrderSelect } from "@/components/drink-order-select";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useViewMode } from "@/hooks/use-view-mode";
import { drinkCategoriasQuery, drinksPaginaQuery } from "@/lib/queries";
import { nomeDaOrdem, ordemDrinksValida, ORDEM_PADRAO } from "@/lib/ordenacao-drinks";
import { slugify } from "@/lib/slug";

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
  validateSearch: (search: Record<string, unknown>): { pagina?: number; ordem?: ReturnType<typeof ordemDrinksValida> } => {
    const pagina = Number(search["pagina"]);
    return {
      pagina: Number.isFinite(pagina) && pagina >= 1 ? Math.min(Math.floor(pagina), 100) : 1,
      ordem: ordemDrinksValida(search["ordem"]),
    };
  },
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
  loaderDeps: ({ search: { pagina, ordem } }) => ({
    pagina: pagina ?? 1,
    ordem: ordem ?? ORDEM_PADRAO,
  }),
  loader: async ({ context, params, deps }): Promise<LoaderData> => {
    const categorias = await context.queryClient.ensureQueryData(drinkCategoriasQuery);
    const categoria = categorias.find((item) => slugify(item.nome) === params.categoria);
    if (!categoria) throw notFound();
    const data = await context.queryClient.ensureQueryData(
      drinksPaginaQuery(filtrosCategoria(categoria.id), deps.pagina * POR_PAGINA, deps.ordem),
    );
    return { nome: categoria.nome, id: categoria.id, total: data.total };
  },
  component: CategoriaPage,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">Erro: {error.message}</div>,
  notFoundComponent: () => <div className="p-12 text-center text-muted-foreground">Categoria não encontrada.</div>,
});

function CategoriaPage() {
  const { categoria: slug } = Route.useParams();
  const { pagina = 1, ordem = ORDEM_PADRAO } = Route.useSearch();
  const navigate = useNavigate({ from: "/drinks/categoria/$categoria" });
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const categoria = categorias.find((item) => slugify(item.nome) === slug);
  const [viewMode, setViewMode] = useViewMode(`categoria:${slug}`, "grid");
  if (!categoria) return null;

  const limite = pagina * POR_PAGINA;
  const { data, isFetching } = useQuery({
    ...drinksPaginaQuery(filtrosCategoria(categoria.id), limite, ordem),
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