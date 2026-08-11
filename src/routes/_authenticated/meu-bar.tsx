import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Plus, Trash2, Wine, Wallet, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { drinksQuery, ingredientesQuery } from "@/lib/queries";
import { avaliarDrinks, brl, custoPorMl, meuBarQuery, type ItemBar } from "@/lib/meu-bar";
import { DOSE_PADRAO_ML, perfilQuery, salvarDoseMl } from "@/lib/perfil";

import { IngredienteAutocomplete } from "@/components/ingrediente-autocomplete";
import { normalizar } from "@/lib/abv";
import { agruparPorImpacto } from "@/lib/impacto";
import { ImpactoCompras } from "@/components/impacto-compras";
import { EstoqueLista } from "@/components/estoque-lista";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";

export const Route = createFileRoute("/_authenticated/meu-bar")({
  head: () => ({
    meta: [
      { title: "Meu Bar — estoque e custo por dose" },
      {
        name: "description",
        content:
          "Cadastre as garrafas que você tem em casa, veja os coquetéis possíveis de fazer e calcule o custo por dose.",
      },
      { property: "og:title", content: "Meu Bar — estoque e custo por dose" },
      {
        property: "og:description",
        content: "Veja o que dá para preparar com o seu estoque e quanto custa cada drink.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeuBarPage,
});

function MeuBarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { data: ingredientes } = useQuery(ingredientesQuery);
  const { data: estoque, isLoading } = useQuery(meuBarQuery(user?.id));
  const { data: perfil } = useQuery(perfilQuery(user?.id));
  const doseMl = perfil?.dose_ml ?? DOSE_PADRAO_ML;

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [volume, setVolume] = useState("");
  const [doseInput, setDoseInput] = useState("");
  const [openPossiveis, setOpenPossiveis] = useState(true);
  const [openQuase, setOpenQuase] = useState(true);

  const invalidar = () => qc.invalidateQueries({ queryKey: ["meu-bar"] });

  const salvarDose = useMutation({
    mutationFn: async () => {
      const n = Number(doseInput.trim().replace(",", "."));
      if (!Number.isFinite(n) || n <= 0 || n > 500)
        throw new Error("Informe uma dose entre 1 e 500 ml.");
      await salvarDoseMl(user!.id, n);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Tamanho da dose atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const adicionar = useMutation({
    mutationFn: async () => {
      const limpo = nome.trim();
      if (!limpo) throw new Error("Informe o nome da bebida ou ingrediente.");
      const alvo = normalizar(limpo);
      let ingredienteId = (ingredientes ?? []).find((i) => normalizar(i.nome) === alvo)?.id;

      if (!ingredienteId) {
        const { data, error } = await supabase
          .from("ingredientes")
          .insert({ nome: limpo })
          .select("id")
          .single();
        if (error) throw error;
        ingredienteId = data.id;
      }

      const precoNum = preco.trim() ? Number(preco.replace(",", ".")) : null;
      const volumeNum = volume.trim() ? Number(volume.replace(",", ".")) : null;
      if (precoNum !== null && (!Number.isFinite(precoNum) || precoNum < 0))
        throw new Error("Preço inválido.");
      if (volumeNum !== null && (!Number.isFinite(volumeNum) || volumeNum <= 0))
        throw new Error("Volume inválido.");

      const { error } = await supabase.from("meu_bar").upsert(
        {
          user_id: user!.id,
          ingrediente_id: ingredienteId,
          preco_garrafa: precoNum,
          volume_garrafa_ml: volumeNum,
        },
        { onConflict: "user_id,ingrediente_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setNome("");
      setPreco("");
      setVolume("");
      qc.invalidateQueries({ queryKey: ["ingredientes"] });
      invalidar();
      toast.success("Item adicionado ao seu bar.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const salvarPreco = useMutation({
    mutationFn: async (v: {
      id: string;
      preco: number | null;
      volume: number | null;
      observacoes: string | null;
    }) => {
      const { error } = await supabase
        .from("meu_bar")
        .update({
          preco_garrafa: v.preco,
          volume_garrafa_ml: v.volume,
          observacoes: v.observacoes,
        })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Valores atualizados.");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meu_bar").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Item removido do seu bar.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avaliados = useMemo(
    () => avaliarDrinks(drinks, estoque ?? [], doseMl),
    [drinks, estoque, doseMl],
  );

  const possiveis = useMemo(
    () =>
      avaliados
        .filter((a) => a.faltando.length === 0 && a.drink.drink_ingredientes.length > 0)
        .sort((a, b) => a.drink.nome.localeCompare(b.drink.nome, "pt-BR")),
    [avaliados],
  );
  const totalGasto = useMemo(
    () => (estoque ?? []).reduce((soma, i) => soma + (i.preco_garrafa ?? 0), 0),
    [estoque],
  );
  const comPreco = useMemo(
    () => (estoque ?? []).filter((i) => (i.preco_garrafa ?? 0) > 0).length,
    [estoque],
  );

  const quaseBase = useMemo(
    () => avaliados.filter((a) => a.faltando.length === 1),
    [avaliados],
  );

  const impacto = useMemo(() => agruparPorImpacto(quaseBase, estoque ?? []), [quaseBase, estoque]);

  /** Ordenado por impacto: primeiro os que faltam o ingrediente que desbloqueia mais receitas. */
  const quaseLa = useMemo(() => {
    const peso = new Map(impacto.map((i) => [i.chave, i.drinks.length]));
    return [...quaseBase].sort(
      (a, b) =>
        (peso.get(normalizar(b.faltando[0] ?? "")) ?? 0) -
          (peso.get(normalizar(a.faltando[0] ?? "")) ?? 0) ||
        (a.faltando[0] ?? "").localeCompare(b.faltando[0] ?? "", "pt-BR") ||
        a.drink.nome.localeCompare(b.drink.nome, "pt-BR"),
    );
  }, [quaseBase, impacto]);



  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <header className="space-y-2">
          <h1 className="inline-flex items-center gap-3 font-serif text-3xl text-foreground sm:text-4xl">
            <Wine className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" aria-hidden="true" /> Meu Bar
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Cadastre as garrafas e ingredientes que você tem em casa. Mostramos os coquetéis
            possíveis com o seu estoque, sinalizamos os que estão{" "}
            <span className="text-foreground">quase lá</span> (falta 1 ingrediente) e calculamos o
            custo por dose com base no preço que você pagou.
          </p>
        </header>

        {/* Tamanho da dose (perfil) */}
        <section
          aria-labelledby="dose-titulo"
          className="rounded-xl border border-border bg-card/40 p-4 sm:p-6"
        >
          <h2 id="dose-titulo" className="mb-1 font-serif text-xl text-foreground">
            Tamanho da minha dose
          </h2>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Definimos as quantidades das receitas com base nesta dose, salva no seu perfil. Assim o
            custo por dose fica sempre exato para o seu jeito de servir.
          </p>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,12rem)_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              salvarDose.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="dose-ml">Dose (ml)</Label>
              <Input
                id="dose-ml"
                inputMode="decimal"
                value={doseInput === "" ? String(doseMl) : doseInput}
                onChange={(e) => setDoseInput(e.target.value)}
                placeholder="Ex.: 50"
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="min-h-11 sm:min-h-10"
              disabled={salvarDose.isPending}
            >
              {salvarDose.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Salvar dose
            </Button>
          </form>
        </section>

        {/* Cadastro */}
        <section aria-labelledby="add-titulo" className="rounded-xl border border-border bg-card/40 p-4 sm:p-6">

          <h2 id="add-titulo" className="mb-4 font-serif text-xl text-foreground">
            Adicionar ao meu bar
          </h2>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              adicionar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="bar-nome">Bebida ou ingrediente</Label>
              <IngredienteAutocomplete
                id="bar-nome"
                value={nome}
                onChange={setNome}
                onSelect={setNome}
                placeholder="Ex.: Gin"
                aria-label="Bebida ou ingrediente"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bar-preco">Preço da garrafa (R$)</Label>
              <Input
                id="bar-preco"
                inputMode="decimal"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex.: 89,90"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bar-volume">Volume (ml)</Label>
              <Input
                id="bar-volume"
                inputMode="decimal"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Ex.: 750"
              />
            </div>
            <Button type="submit" className="min-h-11 sm:min-h-10" disabled={adicionar.isPending}>
              {adicionar.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Adicionar
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Preço e volume são opcionais — sem eles o item conta para as receitas, mas não entra no
            cálculo de custo.
          </p>
        </section>

        {/* Resumo de gastos */}
        <section
          aria-labelledby="resumo-titulo"
          className="rounded-xl border border-border bg-card/40 p-4 sm:p-6"
        >
          <h2
            id="resumo-titulo"
            className="mb-4 inline-flex items-center gap-2 font-serif text-xl text-foreground"
          >
            <Wallet className="h-5 w-5 text-primary" aria-hidden="true" /> Resumo de gastos
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Total gasto nas bebidas</dt>
              <dd className="font-serif text-2xl text-primary">{brl(totalGasto)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Itens no estoque</dt>
              <dd className="font-serif text-2xl text-foreground">{estoque?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Itens com preço informado</dt>
              <dd className="font-serif text-2xl text-foreground">
                {comPreco}
                <span className="ml-1 text-sm text-muted-foreground">
                  de {estoque?.length ?? 0}
                </span>
              </dd>
            </div>
          </dl>
          {comPreco < (estoque?.length ?? 0) && (
            <p className="mt-3 text-xs text-muted-foreground">
              O total considera apenas os itens com preço de garrafa cadastrado.
            </p>
          )}
        </section>

        {/* Estoque */}
        <section aria-labelledby="estoque-titulo" className="space-y-4">
          <h2 id="estoque-titulo" className="font-serif text-2xl text-foreground">
            Meu estoque{" "}
            <span className="text-base text-muted-foreground">({estoque?.length ?? 0})</span>
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando seu bar...</p>
          ) : (estoque ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Seu bar está vazio. Adicione a primeira garrafa acima.
            </p>
          ) : (
            <EstoqueLista
              itens={estoque ?? []}
              doseMl={doseMl}
              salvando={salvarPreco.isPending}
              onSalvar={(id, preco, volume, observacoes) =>
                salvarPreco.mutate({ id, preco, volume, observacoes })
              }
              onRemover={(id) => remover.mutate(id)}
            />
          )}
        </section>

        {/* Possíveis */}
        <SecaoRecolhivel
          id="possiveis-lista"
          titulo="Dá para fazer agora"
          total={possiveis.length}
          open={openPossiveis}
          onToggle={() => setOpenPossiveis((v) => !v)}
          resumo={possiveis.map((a) => ({
            id: a.drink.id,
            nome: a.drink.nome,
            detalhe: `${a.drink.drink_ingredientes.length} ingrediente${a.drink.drink_ingredientes.length === 1 ? "" : "s"}`,
          }))}
        >
          {possiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma receita completa ainda. Continue cadastrando seu estoque.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {possiveis.map((a) => (
                <CardDrink key={a.drink.id} avaliado={a} />
              ))}
            </ul>
          )}
        </SecaoRecolhivel>

        {/* Ranking de impacto das compras */}
        <ImpactoCompras itens={impacto} />

        {/* Quase lá */}

        <SecaoRecolhivel
          id="quase-lista"
          titulo="Quase lá"
          total={quaseLa.length}
          open={openQuase}
          onToggle={() => setOpenQuase((v) => !v)}
          resumo={quaseLa.map((a) => ({
            id: a.drink.id,
            nome: a.drink.nome,
            detalhe: `falta: ${a.faltando.join(", ")}`,
          }))}
          icone={<Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />}
        >

          {quaseLa.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nada por aqui — receitas com apenas 1 ingrediente faltando aparecem nesta lista.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quaseLa.map((a) => (
                <CardDrink key={a.drink.id} avaliado={a} quase />
              ))}
            </ul>
          )}
        </SecaoRecolhivel>
      </main>
    </div>
  );
}

function SecaoRecolhivel({
  id,
  titulo,
  total,
  open,
  onToggle,
  icone,
  resumo,
  children,
}: {
  id: string;
  titulo: string;
  total: number;
  open: boolean;
  onToggle: () => void;
  icone?: React.ReactNode;
  resumo?: { id: string; nome: string; detalhe: string }[];
  children: React.ReactNode;
}) {
  const [verResumo, setVerResumo] = useState(false);
  const resumoId = `${id}-resumo`;
  const mostrarResumo = !open && verResumo && (resumo?.length ?? 0) > 0;

  return (
    <section aria-label={titulo} className="space-y-4">
      <div className="flex min-h-11 w-full items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex flex-1 items-center gap-2 text-left font-serif text-2xl text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {icone}
          <span>{titulo}</span>
          <ChevronDown
            className={`ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={() => setVerResumo((v) => (open ? true : !v))}
          aria-expanded={mostrarResumo}
          aria-controls={resumoId}
          aria-label={`Ver lista resumida de ${titulo} (${total})`}
          disabled={total === 0}
          className="min-h-11 rounded-full border border-border px-3 text-base text-muted-foreground transition-colors hover:text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ({total})
        </button>
      </div>

      {mostrarResumo && (
        <ul id={resumoId} className="rounded-lg border border-border bg-card/50 p-3 text-sm">
          {resumo!.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0"
            >
              <span className="truncate text-foreground">{r.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.detalhe}</span>
            </li>
          ))}
        </ul>
      )}

      <div id={id} hidden={!open}>
        {children}
      </div>
    </section>
  );
}



function CardDrink({
  avaliado,
  quase = false,
}: {
  avaliado: ReturnType<typeof avaliarDrinks>[number];
  quase?: boolean;
}) {
  const { drink, faltando, custo, custoCompleto } = avaliado;
  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card/40 transition-colors hover:border-primary/50">
      <Link
        to="/drinks/$id"
        params={{ id: drink.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <DrinkImage
          path={drink.imagem_url}
          alt={`Foto do drink ${drink.nome}`}
          className="aspect-square w-full object-cover"
        />
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate font-serif text-lg text-foreground">{drink.nome}</h3>
            {quase && (
              <Badge className="shrink-0 bg-primary/15 text-primary">
                <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" /> Quase lá
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <DifficultyBadge value={drink.dificuldade} />
            {drink.drink_drink_categorias.slice(0, 2).map((c) => (
              <Badge key={c.categoria_id} variant="secondary">
                {c.drink_categorias?.nome ?? "?"}
              </Badge>
            ))}
          </div>
          {quase && faltando.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Falta: <span className="text-foreground">{faltando[0]}</span>
            </p>
          )}
          <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
            <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
            {custo > 0 ? (
              <>
                {brl(custo)} por dose{" "}
                {!custoCompleto && (
                  <span className="text-xs text-muted-foreground">(parcial)</span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                Informe preço e volume das garrafas para ver o custo
              </span>
            )}
          </p>
        </div>
      </Link>
    </li>
  );
}
