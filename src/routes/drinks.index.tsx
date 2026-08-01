import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Martini, Filter, X, ChevronDown } from "lucide-react";
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
import { DifficultyBadge, DIFICULDADES } from "@/components/difficulty-badge";
import { FavoriteIconButton } from "@/components/favorite-icon-button";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";
import { useViewMode } from "@/hooks/use-view-mode";
import { ViewModeToggle } from "@/components/view-mode-toggle";

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

function FiltroSection({
  id,
  titulo,
  ativos,
  open,
  onToggle,
  onClear,
  children,
}: {
  id: string;
  titulo: string;
  ativos: number;
  open: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex flex-1 items-center gap-2 text-left hover:text-primary transition-colors"
        >
          <Filter className="h-4 w-4 text-primary" />
          <span>{titulo}</span>
          {ativos > 0 && (
            <span className="rounded-full bg-primary/15 text-primary px-2 py-0.5 text-xs">
              {ativos}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 ml-auto text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {ativos > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>
      {open && (
        <div id={id} className="space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}

function DrinksList() {
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const qc = useQueryClient();
  const { canEdit, user, isAdmin } = useAuth();
  const [viewMode, setViewMode] = useViewMode("drinks", "grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [selectedDifs, setSelectedDifs] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [openDif, setOpenDif] = useState(false);
  const [openCat, setOpenCat] = useState(false);
  const [openIng, setOpenIng] = useState(false);

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
      if (selectedDifs.size > 0 && !selectedDifs.has(d.dificuldade)) return false;
      return true;
    });
  }, [drinks, selected, selectedCats, selectedDifs]);


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
  const toggleDif = (d: string) => {
    setSelectedDifs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
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
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
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


        {/* Filtro por dificuldade */}
        <FiltroSection
          id="filtro-dificuldade"
          titulo="Filtrar por dificuldade de preparo"
          ativos={selectedDifs.size}
          open={openDif}
          onToggle={() => setOpenDif((v) => !v)}
          onClear={() => setSelectedDifs(new Set())}
        >
          <div className="flex flex-wrap gap-2">
            {DIFICULDADES.map((d) => {
              const on = selectedDifs.has(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDif(d)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/60"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </FiltroSection>

        {/* Filtro por categorias */}
        {categorias.length > 0 && (
          <FiltroSection
            id="filtro-categorias"
            titulo="Filtrar por categorias"
            ativos={selectedCats.size}
            open={openCat}
            onToggle={() => setOpenCat((v) => !v)}
            onClear={() => setSelectedCats(new Set())}
          >
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
          </FiltroSection>
        )}

        {/* Filtro por ingredientes */}
        <FiltroSection
          id="filtro-ingredientes"
          titulo="Filtrar por ingredientes disponíveis"
          ativos={selected.size}
          open={openIng}
          onToggle={() => setOpenIng((v) => !v)}
          onClear={() => setSelected(new Set())}
        >
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
        </FiltroSection>


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
          <ul className={viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
            {filtered.map((d) => (
              viewMode === "grid" ? (
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
              ) : (
                <li key={d.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors relative">
                  <div className="flex items-stretch">
                    <Link to="/drinks/$id" params={{ id: d.id }} className="flex flex-1 items-center gap-4 p-3 min-w-0">
                      <DrinkImage path={d.imagem_url} alt={d.nome} className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover bg-secondary/40 shrink-0" />
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
                            params={{ id: d.id }}
                            className="p-1.5 text-muted-foreground hover:text-primary"
                            aria-label="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => setConfirmId(d.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                            aria-label="Remover"
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
