import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Martini, Filter, X } from "lucide-react";
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
import { FavoriteIconButton } from "@/components/favorite-icon-button";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";

export const Route = createFileRoute("/drinks/")({
  head: () => ({
    meta: [
      { title: "Drinks — Destilados & Coquetéis" },
      { name: "description", content: "Lista de drinks com filtro por ingredientes disponíveis." },
    ],
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return drinks.filter((d) => {
      if (selected.size > 0) {
        const ids = new Set(d.drink_ingredientes.map((di) => di.ingrediente_id));
        for (const sel of selected) if (!ids.has(sel)) return false;
      }
      if (selectedCats.size > 0) {
        const cats = new Set(d.drink_drink_categorias.map((c) => c.categoria_id));
        for (const sel of selectedCats) if (!cats.has(sel)) return false;
      }
      return true;
    });
  }, [drinks, selected, selectedCats]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleCat = (id: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-4xl text-foreground">Drinks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {drinks.length} {drinks.length === 1 ? "receita cadastrada" : "receitas cadastradas"}
            </p>
          </div>
          {canEdit && (
            <Button asChild>
              <Link to="/drinks/novo"><Plus className="h-4 w-4 mr-2" /> Novo drink</Link>
            </Button>
          )}
        </div>


        {/* Filtro por categorias */}
        {categorias.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4 text-primary" />
              Filtrar por categorias
              {selectedCats.size > 0 && (
                <button
                  onClick={() => setSelectedCats(new Set())}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => {
                const on = selectedCats.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {c.nome}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Filtro por ingredientes */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtrar por ingredientes disponíveis
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          {ingredientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre ingredientes em <Link to="/ingredientes" className="text-primary underline">Ingredientes</Link>.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredientes.map((ing) => {
                const on = selected.has(ing.id);
                return (
                  <button
                    key={ing.id}
                    onClick={() => toggle(ing.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/60"
                    }`}
                  >
                    {ing.nome}
                  </button>
                );
              })}
            </div>
          )}
          {selected.size > 0 && (
            <p className="text-xs text-muted-foreground">
              Mostrando drinks que contêm <strong>todos</strong> os {selected.size} ingredientes selecionados.
            </p>
          )}
        </section>

        {/* Resultados */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {selected.size > 0 || selectedCats.size > 0
                ? "Nenhum drink combina com esses filtros."
                : "Nenhum drink cadastrado ainda."}
            </p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <li key={d.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors relative">
                {user && (
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteIconButton drinkId={d.id} />
                  </div>
                )}
                <Link to="/drinks/$id" params={{ id: d.id }} className="block">
                  <DrinkImage path={d.imagem_url} alt={d.nome} className="aspect-[4/3] w-full object-cover bg-secondary/40" />
                  <div className="p-4">
                    <h3 className="font-serif text-xl text-foreground">{d.nome}</h3>
                    {d.drink_drink_categorias.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {d.drink_drink_categorias.map((c) => (
                          <Badge key={c.categoria_id} className="text-[10px]">
                            {c.drink_categorias?.nome ?? "?"}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.drink_ingredientes.slice(0, 4).map((di) => (
                        <Badge key={di.ingrediente_id} variant="secondary" className="text-[10px]">
                          {di.ingredientes?.nome ?? "?"}
                        </Badge>
                      ))}
                      {d.drink_ingredientes.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">+{d.drink_ingredientes.length - 4}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
                {canManage(d) && (
                  <div className="flex border-t border-border">
                    <Link
                      to="/drinks/$id/editar"
                      params={{ id: d.id }}
                      className="flex-1 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-secondary/40 inline-flex items-center justify-center gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </Link>
                    <button
                      onClick={() => setConfirmId(d.id)}
                      className="flex-1 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-secondary/40 border-l border-border inline-flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remover
                    </button>
                  </div>
                )}
              </li>
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
