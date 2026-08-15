import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { drinksQuery, ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
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
import { drinkParam } from "@/lib/slug";


export const Route = createFileRoute("/drinks/")({
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
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(drinksQuery),
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]),
  component: DrinksList,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function DrinksList() {
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const qc = useQueryClient();
  const { canEdit, user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useViewMode("drinks", "grid");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { filtered, element: filtrosUI, temFiltro } = useDrinkFilters({
    drinks,
    ingredientes,
    categorias,
    idPrefix: "drinks-filtro",
  });

  const canManage = (d: (typeof drinks)[number]) =>
    canManageItem({ user, isAdmin, canEdit }, d);


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

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-foreground">Drinks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {drinks.length} {drinks.length === 1 ? "receita cadastrada" : "receitas cadastradas"}
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

        {filtrosUI}

        <p aria-live="polite" className="sr-only">
          {filtered.length} {filtered.length === 1 ? "drink encontrado" : "drinks encontrados"}
        </p>

        {/* Resultados */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">
              {temFiltro
                ? "Nenhum drink combina com esses filtros."
                : "Nenhum drink cadastrado ainda."}

            </p>
          </div>
        ) : (
          <ul className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {filtered.map((d) => (
              viewMode === "grid" ? (
                <li key={d.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors relative">
                  {user && (
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteIconButton drinkId={d.id} />
                    </div>
                  )}
                  <Link to="/drinks/$id" params={{ id: drinkParam(d) }} className="block">
                    <DrinkImage path={d.imagem_url} alt={`Foto do drink ${d.nome}`} className="aspect-[4/3] w-full object-cover bg-secondary/40" />
                    <div className="p-4">
                      <h3 className="font-serif text-xl text-foreground">{d.nome}</h3>
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        <DifficultyBadge value={d.dificuldade} />
                        {d.drink_drink_categorias.map((c) => (
                          <Badge key={c.categoria_id} className="text-xs">
                            {c.drink_categorias?.nome ?? "?"}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
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
                      <DrinkImage path={d.imagem_url} alt={`Foto do drink ${d.nome}`} className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-secondary/40 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-lg sm:text-xl text-foreground truncate">{d.nome}</h3>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <DifficultyBadge value={d.dificuldade} />
                          {d.drink_drink_categorias.slice(0, 3).map((c) => (
                            <Badge key={c.categoria_id} className="text-xs">
                              {c.drink_categorias?.nome ?? "?"}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
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
          </ul>
        )}
      </main>


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
