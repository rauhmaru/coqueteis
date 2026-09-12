import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FolderTree, Loader2, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  atualizarCategoria,
  criarCategoria,
  listarCategoriasAdmin,
  removerCategoria,
  type CategoriaAdmin,
} from "@/lib/categorias.functions";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias de ingredientes | Destilados & Coquetéis" },
      {
        name: "description",
        content: "Gerenciamento interno das categorias de ingredientes do catálogo.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Categorias de ingredientes" },
      {
        property: "og:description",
        content: "Gerenciamento interno das categorias de ingredientes do catálogo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CategoriasAdminPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
});

function CategoriasAdminPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const listar = useServerFn(listarCategoriasAdmin);
  const criar = useServerFn(criarCategoria);
  const atualizar = useServerFn(atualizarCategoria);
  const remover = useServerFn(removerCategoria);
  const [nome, setNome] = useState("");
  const [editing, setEditing] = useState<CategoriaAdmin | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const query = useQuery({
    queryKey: ["admin-categorias"],
    queryFn: () => listar(),
    enabled: isAdmin,
  });

  const resetForm = () => {
    setEditing(null);
    setNome("");
  };

  const startEdit = (categoria: CategoriaAdmin) => {
    setEditing(categoria);
    setNome(categoria.nome);
  };

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-categorias"] }),
      queryClient.invalidateQueries({ queryKey: ["categorias"] }),
      queryClient.invalidateQueries({ queryKey: ["counts"] }),
    ]);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 2) {
      toast.error("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await atualizar({ data: { id: editing.id, nome: nomeLimpo } });
        toast.success("Categoria atualizada.");
      } else {
        await criar({ data: { nome: nomeLimpo } });
        toast.success("Categoria cadastrada.");
      }
      resetForm();
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
    } finally {
      setSaving(false);
    }
  };

  const onRemove = async () => {
    if (!confirmId) return;
    setRemoving(true);
    try {
      await remover({ data: { id: confirmId } });
      toast.success("Categoria removida.");
      setConfirmId(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a categoria.");
    } finally {
      setRemoving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-serif text-3xl text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Apenas administradores podem gerenciar categorias.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <header className="space-y-2">
          <h1 className="flex items-center gap-3 font-serif text-3xl text-foreground sm:text-4xl">
            <FolderTree className="h-7 w-7 text-primary" aria-hidden="true" /> Categorias
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize os tipos usados no cadastro dos ingredientes.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="grid items-end gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="categoria-nome">Nome da categoria</Label>
            <Input
              id="categoria-nome"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Ex.: Destilados"
              maxLength={80}
              autoComplete="off"
              disabled={saving}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="min-h-11 flex-1 sm:flex-none">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : editing ? (
                <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {editing ? "Salvar" : "Adicionar"}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetForm}
                className="min-h-11 min-w-11"
                aria-label="Cancelar edição"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </form>

        <section aria-labelledby="categorias-cadastradas">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="categorias-cadastradas" className="text-lg font-semibold text-foreground">
              Categorias cadastradas
            </h2>
            {query.data && (
              <span className="text-sm tabular-nums text-muted-foreground">
                {query.data.length} no total
              </span>
            )}
          </div>

          {query.isLoading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando categorias…
            </p>
          ) : query.error ? (
            <p className="rounded-lg border border-destructive/40 p-4 text-sm text-destructive">
              {query.error instanceof Error ? query.error.message : "Erro ao carregar categorias."}
            </p>
          ) : query.data?.length === 0 ? (
            <p className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma categoria cadastrada.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {query.data?.map((categoria) => (
                <li key={categoria.id} className="flex min-h-16 items-center justify-between gap-3 px-4 py-2">
                  <span className="min-w-0 truncate font-medium text-foreground">{categoria.nome}</span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(categoria)}
                      className="min-h-11 min-w-11"
                      aria-label={`Editar categoria ${categoria.nome}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmId(categoria.id)}
                      className="min-h-11 min-w-11 text-destructive hover:text-destructive"
                      aria-label={`Remover categoria ${categoria.nome}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <AlertDialog open={confirmId !== null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              A remoção só será concluída se a categoria não estiver vinculada a ingredientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} disabled={removing}>
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}