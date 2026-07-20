import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ingredientesQuery, categoriasQuery, type Ingrediente } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/ingredientes")({
  head: () => ({
    meta: [
      { title: "Ingredientes — Destilados & Coquetéis" },
      { name: "description", content: "Cadastre e gerencie os ingredientes do seu bar." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(categoriasQuery),
    ]),
  component: IngredientesPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function IngredientesPage() {
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const qc = useQueryClient();
  const { canEdit, user, isAdmin } = useAuth();
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const canManage = (ing: Ingrediente) =>
    canManageItem({ user, isAdmin, canEdit }, ing);

  const reset = () => {
    setEditing(null); setNome(""); setCategoriaId("");
  };

  const startEdit = (ing: Ingrediente) => {
    setEditing(ing);
    setNome(ing.nome);
    setCategoriaId(ing.categoria_id ?? "");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe o nome."); return; }
    setSaving(true);
    const payload = {
      nome,
      categoria_id: categoriaId || null,
    };
    const { error } = editing
      ? await supabase.from("ingredientes").update(payload).eq("id", editing.id)
      : await supabase.from("ingredientes").insert({ ...payload, created_by: user?.id ?? null });
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(editing ? "Ingrediente atualizado!" : "Ingrediente cadastrado!");
    qc.invalidateQueries({ queryKey: ["ingredientes"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
    reset();
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("ingredientes").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Ingrediente removido.");
    qc.invalidateQueries({ queryKey: ["ingredientes"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
    qc.invalidateQueries({ queryKey: ["drinks"] });
    setConfirmId(null);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground">Ingredientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ingredientes.length} cadastrado(s)
          </p>
        </div>

        {canEdit && (
          <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-5 grid sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5 space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Gin London Dry" />
            </div>
            <div className="sm:col-span-5 space-y-1.5">
              <Label>Tipo</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder={categorias.length ? "Selecione" : "Cadastre categorias primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {editing ? <><Pencil className="h-4 w-4 mr-1" /> Atualizar</> : <><Plus className="h-4 w-4 mr-1" /> Adicionar</>}
              </Button>
              {editing && (
                <Button type="button" variant="outline" size="icon" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        )}

        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nome</th>
                <th className="text-left px-4 py-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Nenhum ingrediente cadastrado.</td></tr>
              ) : ingredientes.map((ing) => (
                <tr key={ing.id} className="border-t border-border hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center justify-between gap-2">
                      <span>{ing.nome}</span>
                      {canManage(ing) && (
                        <span className="space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(ing)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(ing.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ing.categorias?.nome ?? <span className="italic">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ingrediente?</AlertDialogTitle>
            <AlertDialogDescription>
              Drinks que usam este ingrediente perderão a referência.
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
