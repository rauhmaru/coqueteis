import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Check, AlertCircle, RotateCw, Square } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { gerarImagemDrink } from "@/lib/imagens.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/gerar-imagens")({
  head: () => ({
    meta: [
      { title: "Gerar imagens de drinks — Destilados & Coquetéis" },
      { name: "description", content: "Gere automaticamente imagens dos drinks e reexecute apenas as falhas." },
    ],
  }),
  component: GerarImagensPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

type Status = "pendente" | "gerando" | "ok" | "falha";
type FalhaTipo = "rate_limit" | "credits_exhausted" | "outro";
type Item = {
  id: string;
  nome: string;
  status: Status;
  detalhe?: string;
  falhaTipo?: FalhaTipo;
};

function classificarErro(msg: string): FalhaTipo {
  const m = msg.toLowerCase();
  if (m.includes("rate_limit") || m.includes("429") || m.includes("limite de uso")) return "rate_limit";
  if (m.includes("credits_exhausted") || m.includes("402") || m.includes("créditos")) return "credits_exhausted";
  return "outro";
}

function GerarImagensPage() {
  const qc = useQueryClient();
  const gerar = useServerFn(gerarImagemDrink);

  const semImagemQuery = useQuery({
    queryKey: ["drinks-sem-imagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drinks")
        .select("id, nome")
        .is("imagem_url", null)
        .order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [itens, setItens] = useState<Map<string, Item>>(new Map());
  const [concorrencia, setConcorrencia] = useState(3);
  const [emExecucao, setEmExecucao] = useState(false);
  const cancelarRef = useState({ cancelado: false })[0];

  const lista = semImagemQuery.data ?? [];

  // Inicializa map quando dados carregam ou mudam de tamanho
  useMemo(() => {
    if (!lista.length) return;
    setItens((prev) => {
      const next = new Map(prev);
      for (const d of lista) {
        if (!next.has(d.id)) next.set(d.id, { id: d.id, nome: d.nome, status: "pendente" });
      }
      return next;
    });
  }, [lista]);

  const stats = useMemo(() => {
    let ok = 0, falha = 0, pendente = 0, gerando = 0;
    let rateLimit = 0, credits = 0, outro = 0;
    for (const it of itens.values()) {
      if (it.status === "ok") ok++;
      else if (it.status === "falha") {
        falha++;
        if (it.falhaTipo === "rate_limit") rateLimit++;
        else if (it.falhaTipo === "credits_exhausted") credits++;
        else outro++;
      } else if (it.status === "gerando") gerando++;
      else pendente++;
    }
    return { ok, falha, pendente, gerando, rateLimit, credits, outro };
  }, [itens]);

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItens((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (cur) next.set(id, { ...cur, ...patch });
      return next;
    });
  };

  const executarLote = async (ids: string[]) => {
    if (!ids.length) {
      toast.info("Nada para processar.");
      return;
    }
    cancelarRef.cancelado = false;
    setEmExecucao(true);

    // Marca como gerando
    setItens((prev) => {
      const next = new Map(prev);
      for (const id of ids) {
        const cur = next.get(id);
        if (cur) next.set(id, { ...cur, status: "gerando", detalhe: undefined, falhaTipo: undefined });
      }
      return next;
    });

    const fila = [...ids];
    const workers: Promise<void>[] = [];
    const conc = Math.min(Math.max(1, concorrencia), 6);

    const worker = async () => {
      while (fila.length && !cancelarRef.cancelado) {
        const id = fila.shift();
        if (!id) break;
        const item = itens.get(id);
        if (!item) continue;
        try {
          await gerar({ data: { drinkId: id, nome: item.nome } });
          updateItem(id, { status: "ok" });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          updateItem(id, { status: "falha", detalhe: msg, falhaTipo: classificarErro(msg) });
        }
      }
    };

    for (let i = 0; i < conc; i++) workers.push(worker());
    await Promise.all(workers);

    setEmExecucao(false);
    qc.invalidateQueries({ queryKey: ["drinks-sem-imagem"] });
    qc.invalidateQueries({ queryKey: ["drinks"] });
    toast.success(`Lote concluído: ${stats.ok} sucesso(s), ${stats.falha} falha(s)`);
  };

  const iniciarTudo = () => {
    const ids = [...itens.values()]
      .filter((i) => i.status === "pendente" || i.status === "falha")
      .map((i) => i.id);
    executarLote(ids);
  };

  const reexecutarFalhasRecuperaveis = () => {
    const ids = [...itens.values()]
      .filter((i) => i.status === "falha" && (i.falhaTipo === "rate_limit" || i.falhaTipo === "credits_exhausted"))
      .map((i) => i.id);
    if (!ids.length) {
      toast.info("Nenhuma falha por rate-limit ou 402 para reexecutar.");
      return;
    }
    executarLote(ids);
  };

  const reexecutarTodasFalhas = () => {
    const ids = [...itens.values()].filter((i) => i.status === "falha").map((i) => i.id);
    executarLote(ids);
  };

  const cancelar = () => {
    cancelarRef.cancelado = true;
    toast("Cancelando após o lote atual…");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground flex items-center gap-3">
            <ImagePlus className="h-7 w-7 text-primary" /> Gerar imagens dos drinks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gera imagens via IA para drinks sem foto e armazena automaticamente. Você pode
            reexecutar apenas as falhas causadas por <strong>rate-limit (429)</strong> ou
            <strong> créditos esgotados (402)</strong>.
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <Stat label="Sem imagem" value={lista.length} />
            <Stat label="Sucesso" value={stats.ok} tone="ok" />
            <Stat label="Falhas" value={stats.falha} tone="err" />
            <Stat label="Rate-limit" value={stats.rateLimit} tone="warn" />
            <Stat label="402 créditos" value={stats.credits} tone="warn" />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="conc">Concorrência</Label>
              <Input
                id="conc"
                type="number"
                min={1}
                max={6}
                value={concorrencia}
                onChange={(e) => setConcorrencia(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                className="w-24"
                disabled={emExecucao}
              />
            </div>

            <Button onClick={iniciarTudo} disabled={emExecucao || !lista.length} className="ml-auto">
              {emExecucao ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-2" />}
              Gerar pendentes ({stats.pendente + stats.falha})
            </Button>

            <Button
              variant="secondary"
              onClick={reexecutarFalhasRecuperaveis}
              disabled={emExecucao || stats.rateLimit + stats.credits === 0}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Reexecutar falhas 429/402 ({stats.rateLimit + stats.credits})
            </Button>

            <Button
              variant="outline"
              onClick={reexecutarTodasFalhas}
              disabled={emExecucao || stats.falha === 0}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Reexecutar todas falhas ({stats.falha})
            </Button>

            {emExecucao && (
              <Button variant="destructive" onClick={cancelar}>
                <Square className="h-4 w-4 mr-2" /> Cancelar
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border text-sm text-muted-foreground">
            Drinks sem imagem ({lista.length})
          </div>
          {semImagemQuery.isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Carregando…</div>
          ) : !lista.length ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              🎉 Todos os drinks têm imagem.
            </div>
          ) : (
            <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {[...itens.values()].map((it) => (
                <li key={it.id} className="px-5 py-2.5 flex items-center gap-3 text-sm">
                  <StatusIcon status={it.status} />
                  <span className="flex-1 text-foreground truncate">{it.nome}</span>
                  {it.status === "falha" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      it.falhaTipo === "rate_limit" ? "bg-amber-500/15 text-amber-400" :
                      it.falhaTipo === "credits_exhausted" ? "bg-orange-500/15 text-orange-400" :
                      "bg-destructive/15 text-destructive"
                    }`}>
                      {it.falhaTipo === "rate_limit" ? "rate-limit" :
                       it.falhaTipo === "credits_exhausted" ? "402 créditos" : "erro"}
                    </span>
                  )}
                  {it.status === "ok" && <span className="text-xs text-primary">gerado</span>}
                  {it.status === "gerando" && <span className="text-xs text-muted-foreground">gerando…</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "err" | "warn" }) {
  const cls =
    tone === "ok" ? "text-primary" :
    tone === "err" ? "text-destructive" :
    tone === "warn" ? "text-amber-400" : "text-foreground";
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className={`text-2xl font-serif ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <Check className="h-4 w-4 text-primary" />;
  if (status === "falha") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (status === "gerando") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  return <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />;
}
