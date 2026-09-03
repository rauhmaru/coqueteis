import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Merge, Shield, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ingredientesQuery } from "@/lib/queries";
import { normalizarNomeIngrediente } from "@/lib/ingredientes";
import { semAcento as normalizar } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/unificar-ingredientes")({
  head: () => ({
    meta: [
      { title: "Unificar ingredientes — Destilados & Coquetéis" },
      {
        name: "description",
        content: "Ferramenta de administração para juntar ingredientes duplicados e padronizar os nomes usados nas receitas.",
      },
    ],
  }),
  component: UnificarPage,
});

/** Contagem de vínculos com receitas por ingrediente. */
const usosQuery = {
  queryKey: ["ingredientes", "usos"],
  queryFn: async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase.from("drink_ingredientes").select("ingrediente_id");
    if (error) throw error;
    const mapa: Record<string, number> = {};
    for (const row of data ?? []) {
      mapa[row.ingrediente_id] = (mapa[row.ingrediente_id] ?? 0) + 1;
    }
    return mapa;
  },
};

function UnificarPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const ingredientes = useQuery({ ...ingredientesQuery, enabled: isAdmin });
  const usos = useQuery({ ...usosQuery, enabled: isAdmin });

  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [destino, setDestino] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const lista = ingredientes.data ?? [];

  const filtrados = useMemo(() => {
    const q = normalizar(busca.trim());
    if (!q) return lista;
    return lista.filter((i) => normalizar(i.nome).includes(q));
  }, [lista, busca]);

  const selecionadosObj = useMemo(
    () => lista.filter((i) => selecionados.includes(i.id)),
    [lista, selecionados],
  );

  const destinoObj = selecionadosObj.find((i) => i.id === destino) ?? null;

  if (!isAdmin) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="font-serif text-3xl text-foreground">Acesso restrito</h1>
          <p className="mt-2 text-muted-foreground">
            Apenas administradores podem unificar ingredientes.
          </p>
        </main>
      </div>
    );
  }

  const alternar = (id: string) => {
    setSelecionados((atual) => {
      const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
      if (!novo.includes(id) && destino === id) setDestino(novo[0] ?? null);
      if (novo.length === 1) setDestino(novo[0]!);
      return novo;
    });
  };

  const escolherDestino = (id: string) => {
    setDestino(id);
    const alvo = lista.find((i) => i.id === id);
    if (alvo) setNovoNome(alvo.nome);
  };

  const limpar = () => {
    setSelecionados([]); setDestino(null); setNovoNome("");
  };

  const unificar = async () => {
    if (selecionados.length < 2 || !destino) return;
    setSalvando(true);
    const nomeFinal = normalizarNomeIngrediente(novoNome);
    const { data, error } = await supabase.rpc("unificar_ingredientes", {
      _ids: selecionados,
      _destino: destino,
      _novo_nome: nomeFinal || undefined,
    });
    setSalvando(false);
    setConfirmar(false);
    if (error) {
      toast.error("Erro ao unificar: " + error.message);
      return;
    }
    const r = (data ?? {}) as { nome?: string; ingredientes_removidos?: number; vinculos_movidos?: number };
    toast.success(
      `Unificado em "${r.nome ?? nomeFinal}" — ${r.ingredientes_removidos ?? 0} removido(s), ${r.vinculos_movidos ?? 0} vínculo(s) atualizado(s).`,
    );
    limpar();
    qc.invalidateQueries({ queryKey: ["ingredientes"] });
    qc.invalidateQueries({ queryKey: ["drinks"] });
    qc.invalidateQueries({ queryKey: ["meu-bar"] });
    qc.invalidateQueries({ queryKey: ["counts"] });
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div>
          <h1 className="flex items-center gap-3 font-serif text-3xl text-foreground sm:text-4xl">
            <Merge className="h-7 w-7 text-primary" aria-hidden="true" /> Unificar ingredientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Marque dois ou mais ingredientes que representem a mesma coisa (ex.: “Uísque” e “Whisky”),
            escolha qual nome fica e clique em <strong>Unificar</strong>. Os vínculos em todas as
            receitas e nos estoques do “Meu Bar” passam para o ingrediente escolhido.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar ingredientes…"
            aria-label="Filtrar ingredientes por nome"
            className="pl-9"
          />
        </div>

        {selecionados.length > 0 && (
          <div className="space-y-4 rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Selecionados:</span>
              {selecionadosObj.map((i) => (
                <Badge key={i.id} variant={i.id === destino ? "default" : "secondary"}>
                  {i.nome}
                </Badge>
              ))}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Ingrediente que permanece</legend>
              <div className="flex flex-wrap gap-2">
                {selecionadosObj.map((i) => (
                  <Button
                    key={i.id}
                    type="button"
                    size="sm"
                    variant={i.id === destino ? "default" : "outline"}
                    onClick={() => escolherDestino(i.id)}
                  >
                    {i.nome}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="novo-nome">Renomear (opcional)</Label>
              <Input
                id="novo-nome"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder={destinoObj?.nome ?? "Nome final do ingrediente"}
              />
              <p className="text-xs text-muted-foreground">
                Deixe como está para manter “{destinoObj?.nome ?? "—"}”.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={selecionados.length < 2 || !destino || salvando}
                onClick={() => setConfirmar(true)}
              >
                {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Merge className="mr-2 h-4 w-4" />}
                Unificar {selecionados.length} ingredientes
              </Button>
              <Button type="button" variant="ghost" onClick={limpar}>Limpar seleção</Button>
            </div>
          </div>
        )}

        {ingredientes.isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Carregando…
          </div>
        ) : ingredientes.error ? (
          <div className="p-8 text-center text-destructive">Erro: {(ingredientes.error as Error).message}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <ul className="divide-y divide-border">
              {filtrados.map((i) => {
                const marcado = selecionados.includes(i.id);
                return (
                  <li key={i.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/20">
                    <Checkbox
                      id={`ing-${i.id}`}
                      checked={marcado}
                      onCheckedChange={() => alternar(i.id)}
                      aria-label={`Selecionar ${i.nome}`}
                    />
                    <label htmlFor={`ing-${i.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block truncate text-sm text-foreground">{i.nome}</span>
                      <span className="block text-xs text-muted-foreground">
                        {i.categorias?.nome ?? "sem categoria"} · {usos.data?.[i.id] ?? 0} receita(s)
                      </span>
                    </label>
                    {i.id === destino && <Badge className="shrink-0">permanece</Badge>}
                  </li>
                );
              })}
              {filtrados.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum ingrediente encontrado.
                </li>
              )}
            </ul>
          </div>
        )}
      </main>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unificar ingredientes?</AlertDialogTitle>
            <AlertDialogDescription>
              {selecionadosObj.filter((i) => i.id !== destino).map((i) => i.nome).join(", ")} serão
              substituídos por “{normalizarNomeIngrediente(novoNome) || destinoObj?.nome}” em todas as
              receitas e estoques. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={unificar}>Unificar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
