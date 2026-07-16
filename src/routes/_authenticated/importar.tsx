import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { gerarReceitasIA, type ReceitaIA } from "@/lib/importer.functions";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const CATEGORIAS_DRINKS = [
  { id: "Clássicos", desc: "Negroni, Manhattan, Old Fashioned…" },
  { id: "Tropicais", desc: "Tiki, frutados, com rum" },
  { id: "Shots", desc: "Doses curtas e intensas" },
  { id: "Refrescantes", desc: "Highballs, longos com gás" },
  { id: "Cremosos", desc: "Com leite, creme, sorvete" },
  { id: "Sour", desc: "Cítricos com clara de ovo" },
  { id: "Tiki", desc: "Estilo polinésio exótico" },
  { id: "Brasileiros", desc: "Caipirinhas, batidas, regionais" },
  { id: "Quentes", desc: "Quentão, hot toddy, café" },
  { id: "Espumantes", desc: "Mimosa, Bellini, Spritz" },
] as const;

export const Route = createFileRoute("/_authenticated/importar")({
  head: () => ({
    meta: [
      { title: "Importar drinks — Destilados & Coquetéis" },
      { name: "description", content: "Importe receitas de drinks famosos por categoria, com geração automática via IA." },
    ],
  }),
  component: ImportarPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

type ResultadoItem = {
  nome: string;
  status: "criado" | "duplicado" | "erro";
  detalhe?: string;
};

function ImportarPage() {
  const qc = useQueryClient();
  const gerar = useServerFn(gerarReceitasIA);
  const { user } = useAuth();
  const [selecionadas, setSelecionadas] = useState<string[]>(["Clássicos"]);
  const [quantidade, setQuantidade] = useState(3);
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState<string>("");
  const [resultados, setResultados] = useState<ResultadoItem[]>([]);

  const toggle = (id: string) => {
    setSelecionadas((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const importar = async () => {
    if (selecionadas.length === 0) {
      toast.error("Selecione ao menos uma categoria.");
      return;
    }
    setLoading(true);
    setResultados([]);
    setProgresso("Gerando receitas com IA…");

    try {
      const { receitas } = await gerar({ data: { categorias: selecionadas, quantidade } });
      if (!receitas.length) {
        toast.error("A IA não retornou receitas.");
        setLoading(false);
        return;
      }

      // Carrega caches locais
      setProgresso("Buscando catálogo atual…");
      const [{ data: cats }, { data: ings }, { data: drks }, { data: dcats }] = await Promise.all([
        supabase.from("categorias").select("id, nome"),
        supabase.from("ingredientes").select("id, nome"),
        supabase.from("drinks").select("id, nome"),
        supabase.from("drink_categorias").select("id, nome"),
      ]);
      const catMap = new Map<string, string>((cats ?? []).map((c) => [c.nome.toLowerCase(), c.id]));
      const ingMap = new Map<string, string>((ings ?? []).map((i) => [i.nome.toLowerCase(), i.id]));
      const drinkNomes = new Set<string>((drks ?? []).map((d) => d.nome.toLowerCase()));
      const drinkCatMap = new Map<string, string>((dcats ?? []).map((c) => [c.nome.toLowerCase(), c.id]));

      const out: ResultadoItem[] = [];
      let idx = 0;

      for (const r of receitas) {
        idx++;
        setProgresso(`Processando ${idx} de ${receitas.length}: ${r.nome}`);
        try {
          if (drinkNomes.has(r.nome.trim().toLowerCase())) {
            out.push({ nome: r.nome, status: "duplicado" });
            continue;
          }

          // Resolve ingredientes (cria categoria + ingrediente se necessário)
          const ingredienteIds: string[] = [];
          for (const ing of r.ingredientes ?? []) {
            const ingKey = ing.nome.trim().toLowerCase();
            let ingId = ingMap.get(ingKey);
            if (!ingId) {
              const catNome = (ing.categoria || "Outros").trim();
              let catId = catMap.get(catNome.toLowerCase());
              if (!catId) {
                const { data: novaCat, error: catErr } = await supabase
                  .from("categorias")
                  .insert({ nome: catNome })
                  .select("id")
                  .single();
                if (catErr || !novaCat) throw new Error(`categoria: ${catErr?.message}`);
                catId = novaCat.id;
                catMap.set(catNome.toLowerCase(), catId);
              }
              const { data: novoIng, error: ingErr } = await supabase
                .from("ingredientes")
                .insert({ nome: ing.nome.trim(), categoria_id: catId, quantidade: 500, created_by: user?.id ?? null })
                .select("id")
                .single();
              if (ingErr || !novoIng) throw new Error(`ingrediente: ${ingErr?.message}`);
              ingId = novoIng.id;
              ingMap.set(ingKey, ingId);
            }
            ingredienteIds.push(ingId);
          }

          // Cria drink
          const { data: novoDrink, error: drkErr } = await supabase
            .from("drinks")
            .insert({ nome: r.nome.trim(), preparo: r.preparo ?? "", created_by: user?.id ?? null })
            .select("id")
            .single();
          if (drkErr || !novoDrink) throw new Error(`drink: ${drkErr?.message}`);

          // Vincula ingredientes
          if (ingredienteIds.length) {
            const links = ingredienteIds.map((iid) => ({ drink_id: novoDrink.id, ingrediente_id: iid }));
            const { error: linkErr } = await supabase.from("drink_ingredientes").insert(links);
            if (linkErr) throw new Error(`vínculos: ${linkErr.message}`);
          }

          // Vincula categorias
          const catIds = (r.categorias ?? selecionadas)
            .map((c) => drinkCatMap.get(c.toLowerCase()))
            .filter((v): v is string => !!v);
          if (catIds.length) {
            const catLinks = catIds.map((cid) => ({ drink_id: novoDrink.id, categoria_id: cid }));
            const { error: catLinkErr } = await supabase.from("drink_drink_categorias").insert(catLinks);
            if (catLinkErr) throw new Error(`categorias: ${catLinkErr.message}`);
          }
          drinkNomes.add(r.nome.toLowerCase());
          out.push({ nome: r.nome, status: "criado" });
        } catch (e: unknown) {
          out.push({ nome: r.nome, status: "erro", detalhe: e instanceof Error ? e.message : String(e) });
        }
      }

      setResultados(out);
      const criados = out.filter((x) => x.status === "criado").length;
      toast.success(`${criados} drink(s) importado(s)!`);
      qc.invalidateQueries();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setProgresso("");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" /> Importar drinks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Escolha as categorias e a quantidade. A IA gera receitas famosas e o sistema vincula
            ingredientes automaticamente (criando os que ainda não existem).
          </p>
        </div>

        <section className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div className="space-y-3">
            <Label>Categorias de drinks</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIAS_DRINKS.map((c) => {
                const ativo = selecionadas.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      ativo
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-secondary/30"
                    }`}
                  >
                    <Checkbox checked={ativo} onCheckedChange={() => toggle(c.id)} className="mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{c.id}</div>
                      <div className="text-xs text-muted-foreground">{c.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="qtd">Quantidade por categoria</Label>
              <Input
                id="qtd"
                type="number"
                min={1}
                max={10}
                value={quantidade}
                onChange={(e) => setQuantidade(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                className="w-32"
              />
            </div>
            <Button onClick={importar} disabled={loading} className="ml-auto">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Importar {selecionadas.length * quantidade} drinks</>
              )}
            </Button>
          </div>

          {progresso && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {progresso}
            </div>
          )}
        </section>

        {resultados.length > 0 && (
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border text-sm text-muted-foreground">
              Resultado da importação
            </div>
            <ul className="divide-y divide-border">
              {resultados.map((r, i) => (
                <li key={i} className="px-5 py-3 flex items-center gap-3 text-sm">
                  {r.status === "criado" && <Check className="h-4 w-4 text-primary" />}
                  {r.status === "duplicado" && <AlertCircle className="h-4 w-4 text-muted-foreground" />}
                  {r.status === "erro" && <AlertCircle className="h-4 w-4 text-destructive" />}
                  <span className="flex-1 text-foreground">{r.nome}</span>
                  <span className={`text-xs ${
                    r.status === "criado" ? "text-primary" :
                    r.status === "erro" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {r.status === "criado" ? "criado" : r.status === "duplicado" ? "já existia" : `erro: ${r.detalhe}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
