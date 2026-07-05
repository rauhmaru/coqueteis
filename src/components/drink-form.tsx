import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Upload, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ingredientesQuery, type DrinkComIngredientes } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DrinkImage } from "@/components/drink-image";
import { gerarImagemDrink } from "@/lib/imagens.functions";

export function DrinkForm({ existing }: { existing?: DrinkComIngredientes | null }) {
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [nome, setNome] = useState(existing?.nome ?? "");
  const [preparo, setPreparo] = useState(existing?.preparo ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existing?.drink_ingredientes.map((d) => d.ingrediente_id) ?? []),
  );
  const [imagemPath, setImagemPath] = useState<string | null>(existing?.imagem_url ?? null);
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [novaImagemPreview, setNovaImagemPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleFile = (file: File | null) => {
    setNovaImagem(file);
    if (novaImagemPreview) URL.revokeObjectURL(novaImagemPreview);
    setNovaImagemPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe o nome do drink."); return; }
    if (selected.size === 0) { toast.error("Selecione ao menos um ingrediente."); return; }
    setSaving(true);
    try {
      let finalPath = imagemPath;
      if (novaImagem) {
        const ext = novaImagem.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("drink-images")
          .upload(path, novaImagem, { contentType: novaImagem.type });
        if (upErr) throw upErr;
        // remove imagem antiga
        if (imagemPath) await supabase.storage.from("drink-images").remove([imagemPath]);
        finalPath = path;
      }

      let drinkId = existing?.id;
      if (existing) {
        const { error } = await supabase
          .from("drinks")
          .update({ nome, preparo, imagem_url: finalPath })
          .eq("id", existing.id);
        if (error) throw error;
        await supabase.from("drink_ingredientes").delete().eq("drink_id", existing.id);
      } else {
        const { data, error } = await supabase
          .from("drinks")
          .insert({ nome, preparo, imagem_url: finalPath })
          .select("id")
          .single();
        if (error) throw error;
        drinkId = data.id;
      }
      if (drinkId && selected.size > 0) {
        const rows = Array.from(selected).map((ingrediente_id) => ({
          drink_id: drinkId!, ingrediente_id,
        }));
        const { error } = await supabase.from("drink_ingredientes").insert(rows);
        if (error) throw error;
      }
      toast.success(existing ? "Drink atualizado!" : "Drink cadastrado!");
      qc.invalidateQueries({ queryKey: ["drinks"] });
      qc.invalidateQueries({ queryKey: ["counts"] });
      navigate({ to: "/drinks" });
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const removerImagem = async () => {
    setImagemPath(null);
    handleFile(null);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Link to="/drinks" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="font-serif text-4xl text-foreground">
          {existing ? "Editar drink" : "Novo drink"}
        </h1>

        <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Negroni" />
          </div>

          <div className="space-y-2">
            <Label>Ingredientes</Label>
            {ingredientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre ingredientes em{" "}
                <Link to="/ingredientes" className="text-primary underline">Ingredientes</Link> antes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ingredientes.map((ing) => {
                  const on = selected.has(ing.id);
                  return (
                    <button
                      type="button"
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
              <p className="text-xs text-muted-foreground">{selected.size} selecionado(s)</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preparo">Preparo</Label>
            <Textarea
              id="preparo"
              value={preparo}
              onChange={(e) => setPreparo(e.target.value)}
              rows={6}
              placeholder="Descreva o modo de preparo passo a passo…"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem</Label>
            <div className="flex items-start gap-4">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-secondary/40 border border-border flex items-center justify-center">
                {novaImagemPreview ? (
                  <img src={novaImagemPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <DrinkImage path={imagemPath} alt="atual" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="img"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/40 hover:bg-secondary cursor-pointer text-sm"
                >
                  <Upload className="h-4 w-4" /> Escolher imagem
                </Label>
                <input
                  id="img" type="file" accept="image/*" className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {(imagemPath || novaImagem) && (
                  <button
                    type="button"
                    onClick={removerImagem}
                    className="block text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Remover imagem
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link to="/drinks">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : existing ? "Salvar alterações" : "Cadastrar drink"}
            </Button>
          </div>
        </form>

        {selected.size > 0 && (
          <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
            Selecionados:
            {Array.from(selected).map((id) => {
              const ing = ingredientes.find((i) => i.id === id);
              return ing ? <Badge key={id} variant="secondary">{ing.nome}</Badge> : null;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
