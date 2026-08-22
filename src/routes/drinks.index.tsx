import { drinkParam } from "@/lib/slug";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Martini, ArrowUp, Loader2, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  ingredientesQuery,
  drinkCategoriasQuery,
  drinksPaginaQuery,
  type DrinkComIngredientes,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { FavoriteIconButton } from "@/components/favorite-icon-button";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { useDrinkFilters } from "@/components/drink-filters";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const POR_PAGINA = 24;

const FILTROS_VAZIOS = {
  ingredientes: [] as string[],
  categorias: [] as string[],
  dificuldades: [] as string[],
  qtd: null as number | null,
  comparador: "igual",
};

export const Route = createFileRoute("/drinks/")({
  validateSearch: (search: Record<string, unknown>): { pagina?: number } => {
    const n = Number(search["pagina"]);
    return { pagina: Number.isFinite(n) && n >= 1 ? Math.min(Math.floor(n), 100) : 1 };
  },
  head: () => ({
    meta: [
      { property: "og:url", content: "https://coqueteis.lovable.app/drinks" },
      { title: "Drinks — receitas de coquetéis por ingrediente" },
      {
        name: "description",
        content:
          "Todas as receitas do catálogo com filtros por ingredientes, categoria, dificuldade e quantidade de ingredientes.",
      },
      { property: "og:title", content: "Drinks — receitas de coquetéis por ingrediente" },
      {
        property: "og:description",
        content: "Filtre receitas de coquetéis pelos ingredientes que você tem em casa.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/drinks" }],
  }),
  loaderDeps: ({ search: { pagina } }) => ({ pagina: pagina ?? 1 }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        drinksPaginaQuery(FILTROS_VAZIOS, deps.pagina * POR_PAGINA),
      ),
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]),
  component: DrinksList,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function CardSkeleton({ lista }: { lista: boolean }) {
  if (lista) {
    return (
      <li className="rounded-xl border border-border bg-card p-3 flex items-center gap-4">
        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg bg-secondary/60 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-secondary/60 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-secondary/50 animate-pulse" />
        </div>
      </li>
    );
  }
  return (
    <li className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="aspect-square sm:aspect-[4/3] w-full bg-secondary/60 animate-pulse" />
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-5 w-3/4 rounded bg-secondary/60 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-secondary/50 animate-pulse" />
      </div>
    </li>
  );
}

function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > window.innerHeight * 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visivel) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Voltar ao topo da lista"
      className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-lg backdrop-blur hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

function DrinksList() {
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const { pagina = 1 } = Route.useSearch();
  const navigate = useNavigate({ from: "/drinks" });
  const qc = useQueryClient();
  const { canEdit, user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useViewMode("drinks", "grid");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  const { element: filtrosUI, temFiltro, filtrosServidor, ativos, limparTudo } = useDrinkFilters({
    ingredientes,
    categorias,
    idPrefix: "drinks-filtro",
  });

  // Ao mudar filtros, volta para a primeira página (sem poluir o histórico).
  const chaveFiltros = JSON.stringify(filtrosServidor);
  const chaveAnterior = useRef(chaveFiltros);
  useEffect(() => {
    if (chaveAnterior.current === chaveFiltros) return;
    chaveAnterior.current = chaveFiltros;
    navigate({ search: { pagina: 1 }, replace: true });
  }, [chaveFiltros, navigate]);

  const limite = pagina * POR_PAGINA;
  const { data, isPending, isFetching } = useQuery({
    ...drinksPaginaQuery(filtrosServidor, limite),
    placeholderData: keepPreviousData,
  });

  const drinks = data?.drinks ?? [];
  const total = data?.total ?? 0;
  const temMais = drinks.length < total;
  const carregandoMais = isFetching && drinks.length < limite && drinks.length < total;

  const canManage = (d: DrinkComIngredientes) => canManageItem({ user, isAdmin, canEdit }, d);

  const remover = async (id: string) => {
    const drink = drinks.find((d) => d.id === id);
    const { error } = await supabase.from("drinks").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
      return;
    }
    if (drink?.imagem_url) {
      await supabase.storage.from("drink-images").remove([drink.imagem_url]);
    }
    toast.success("Drink removido.");
    qc.invalidateQueries({ queryKey: ["drinks"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
    setConfirmId(null);
  };

  const gridClass =
    viewMode === "grid"
      ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
      : "flex flex-col gap-3";

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-7xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Drinks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {total} {total === 1 ? "receita encontrada" : "receitas encontradas"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            {canEdit && (
              <Button asChild>
                <Link to="/drinks/novo"><Plus className="h-4 w-4 mr-2" /> Novo drink</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          {/* Filtros: coluna lateral fixa no desktop, bottom sheet no mobile */}
          {isDesktop ? (
            <aside
              aria-label="Filtros"
              className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:pr-1"
            >
              {filtrosUI}
            </aside>
          ) : (
            <div className="mb-6 flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 min-h-11"
                onClick={() => setFiltrosAbertos(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" aria-hidden="true" />
                Filtrar{ativos > 0 ? ` (${ativos})` : ""}
              </Button>
              {ativos > 0 && (
                <Button variant="ghost" className="min-h-11" onClick={limparTudo}>
                  Limpar
                </Button>
              )}
            </div>
          )}

          {!isDesktop && (
            <Sheet open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
              <SheetContent side="bottom" className="max-h-[85dvh] flex flex-col p-0">
                <SheetHeader className="px-4 pt-4 pb-2 text-left">
                  <SheetTitle>Filtrar receitas</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-4">{filtrosUI}</div>
                <div className="border-t border-border bg-card p-4 flex gap-2">
                  {ativos > 0 && (
                    <Button variant="outline" className="min-h-12" onClick={limparTudo}>
                      Limpar
                    </Button>
                  )}
                  <Button className="flex-1 min-h-12" onClick={() => setFiltrosAbertos(false)}>
                    Ver {total} {total === 1 ? "resultado" : "resultados"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <div className="min-w-0 space-y-8">
        <p aria-live="polite" className="sr-only">
          {total} {total === 1 ? "drink encontrado" : "drinks encontrados"}
        </p>

        {/* Resultados */}

        {isPending ? (
          <ul className={gridClass}>
            {Array.from({ length: POR_PAGINA }).map((_, i) => (
              <CardSkeleton key={i} lista={viewMode === "list"} />
            ))}
          </ul>
        ) : total === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">
              {temFiltro
                ? "Nenhum drink combina com esses filtros."
                : "Nenhum drink cadastrado ainda."}
            </p>
          </div>
        ) : (
          <>
            <ul className={gridClass}>
              {drinks.map((d) => (
                viewMode === "grid" ? (
                  <li key={d.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors relative">
                    {user && (
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteIconButton drinkId={d.id} />
                      </div>
                    )}
                    <Link to="/drinks/$id" params={{ id: drinkParam(d) }} className="block">
                      <DrinkImage path={d.imagem_url} alt={`Foto do drink ${d.nome}`} className="aspect-square sm:aspect-[4/3] w-full object-cover bg-secondary/40" sizes="(min-width: 1024px) 360px, (min-width: 640px) 33vw, 50vw" />
                      <div className="p-3 sm:p-4">
                        <h3 className="font-serif text-base sm:text-xl text-foreground line-clamp-2">{d.nome}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <DifficultyBadge value={d.dificuldade} />
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {d.drink_ingredientes.length} ingr.
                          </span>
                          <span className="hidden sm:contents">
                            {d.drink_drink_categorias.map((c) => (
                              <Badge key={c.categoria_id} className="text-xs">
                                {c.drink_categorias?.nome ?? "?"}
                              </Badge>
                            ))}
                          </span>
                        </div>
                        <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                          {d.drink_ingredientes.slice(0, 4).map((di) => (
                            <Badge key={di.ingrediente_id} variant="secondary" className="text-xs">
                              {di.ingredientes?.nome ?? "?"}
                            </Badge>
                          ))}
                          {d.drink_ingredientes.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{d.drink_ingredientes.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                    {canManage(d) && (
                      <div className="flex border-t border-border">
                        <Link
                          to="/drinks/$id/editar"
                          params={{ id: drinkParam(d) }}
                          className="flex-1 min-h-11 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-secondary/40 inline-flex items-center justify-center gap-1"
                          aria-label={`Editar ${d.nome}`}
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </Link>
                        <button
                          onClick={() => setConfirmId(d.id)}
                          className="flex-1 min-h-11 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-secondary/40 border-l border-border inline-flex items-center justify-center gap-1"
                          type="button"
                          aria-label={`Remover ${d.nome}`}
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      </div>
                    )}
                  </li>
                ) : (
                  <li key={d.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors relative">
                    <div className="flex items-stretch">
                      <Link to="/drinks/$id" params={{ id: drinkParam(d) }} className="flex flex-1 items-center gap-4 p-3 min-w-0">
                        <DrinkImage path={d.imagem_url} alt={`Foto do drink ${d.nome}`} className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-secondary/40 shrink-0" sizes="200px" width={200} height={200} />
                        <div className="min-w-0 flex-1">
                          <h3 className="font-serif text-lg sm:text-xl text-foreground truncate">{d.nome}</h3>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <DifficultyBadge value={d.dificuldade} />
                            <span className="text-xs text-muted-foreground sm:hidden">
                              {d.drink_ingredientes.length} ingr.
                            </span>
                            <span className="hidden sm:contents">
                              {d.drink_drink_categorias.slice(0, 3).map((c) => (
                                <Badge key={c.categoria_id} className="text-xs">
                                  {c.drink_categorias?.nome ?? "?"}
                                </Badge>
                              ))}
                            </span>
                          </div>
                          <div className="hidden sm:flex flex-wrap gap-1 mt-1">
                            {d.drink_ingredientes.slice(0, 4).map((di) => (
                              <Badge key={di.ingrediente_id} variant="secondary" className="text-xs">
                                {di.ingredientes?.nome ?? "?"}
                              </Badge>
                            ))}
                            {d.drink_ingredientes.length > 4 && (
                              <Badge variant="outline" className="text-xs">+{d.drink_ingredientes.length - 4}</Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="flex flex-col items-end justify-between p-2 gap-1 border-l border-border">
                        {user && <FavoriteIconButton drinkId={d.id} />}
                        {canManage(d) && (
                          <div className="flex gap-1">
                            <Link
                              to="/drinks/$id/editar"
                              params={{ id: drinkParam(d) }}
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-primary sm:min-h-9 sm:min-w-9"
                              aria-label={`Editar ${d.nome}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => setConfirmId(d.id)}
                              type="button"
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground hover:text-destructive sm:min-h-9 sm:min-w-9"
                              aria-label={`Remover ${d.nome}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                )
              ))}
              {carregandoMais &&
                Array.from({ length: Math.min(POR_PAGINA, total - drinks.length) }).map((_, i) => (
                  <CardSkeleton key={`sk-${i}`} lista={viewMode === "list"} />
                ))}
            </ul>

            <div className="flex flex-col items-center gap-3 pt-2">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                Mostrando {drinks.length} de {total} receitas
              </p>
              {temMais && (
                <Button
                  variant="outline"
                  onClick={() => navigate({ search: { pagina: pagina + 1 } })}
                  disabled={isFetching}
                >
                  {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                  Carregar mais {Math.min(POR_PAGINA, total - drinks.length)}
                </Button>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      </main>


      <VoltarAoTopo />

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover drink?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && remover(confirmId)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
