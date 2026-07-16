import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { categoriasQuery, type Categoria } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/categorias")({
  head: () => ({
    meta: [
      { title: "Categorias — Destilados & Coquetéis" },
      { name: "description", content: "Categorias para classificar os ingredientes." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriasQuery),
  component: CategoriasPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function CategoriasPage() {
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const qc = useQueryClient();
  const { canEdit } = useAuth();
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const reset = () => { setEditing(null); setNome(""); };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe o nome."); return; }
    setSaving(true);
    const { error } = editing
      ? await supabase.from("categorias").update({ nome }).eq("id", editing.id)
      : await supabase.from("categorias").insert({ nome });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(editing ? "Categoria atualizada!" : "Categoria cadastrada!");
    qc.invalidateQueries({ queryKey: ["categorias"] });
    qc.invalidateQueries({ queryKey: ["ingredientes"] });
    reset();
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Categoria removida.");
    qc.invalidateQueries({ queryKey: ["categorias"] });
    qc.invalidateQueries({ queryKey: ["ingredientes"] });
    setConfirmId(null);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Categorias</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Classifique seus ingredientes (destilados, licores, sucos, xaropes…).
          </p>
        </div>

        {canEdit && (
          <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="nome">Nome da categoria</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Destilados" />
            </div>
            <Button type="submit" disabled={saving}>
              {editing ? <><Pencil className="h-4 w-4 mr-1" /> Atualizar</> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
            </Button>
            {editing && (
              <Button type="button" variant="outline" size="icon" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        )}

        <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {categorias.length === 0 ? (
            <li className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhuma categoria cadastrada.</li>
          ) : categorias.map((cat) => (
            <li key={cat.id} className="px-4 py-3 flex items-center justify-between hover:bg-secondary/20">
              <Link
                to="/categorias/$id"
                params={{ id: cat.id }}
                className="flex-1 text-foreground hover:text-primary transition-colors"
              >
                {cat.nome}
              </Link>
              {canEdit && (
                <div className="space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(cat); setNome(cat.nome); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmId(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Ingredientes desta categoria ficarão sem tipo.
            </AlertDialogDescription>
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
