import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, FileDown, Link2, Loader2, QrCode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { drinksQuery, ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
import { useDrinkFilters } from "@/components/drink-filters";

import { gerarCartaPdf } from "@/lib/carta-pdf";
import { CARTA_TEMPLATES, QR_TAMANHOS, qrMm, type QrTamanhoId } from "@/lib/carta-templates";
import { urlDaCarta } from "@/lib/carta-link";
import {
  MAX_CONVIDADOS,
  MAX_DRINKS_POR_CONVIDADO,
  calcularListaCompras,
  formatarVolume,
} from "@/lib/porcoes";

const MIN = 3;
const MAX = 5;

export const Route = createFileRoute("/carta")({
  head: () => ({
    meta: [
      { title: "Carta de drinks para eventos — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Selecione de 3 a 5 receitas, escolha o estilo, calcule as porções da festa e gere uma carta de drinks em PDF com QR Code ou link público.",
      },
      { property: "og:title", content: "Carta de drinks para eventos" },
      {
        property: "og:description",
        content:
          "Monte sua carta de drinks em PDF com QR Code, lista de compras e link compartilhável.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(drinksQuery),
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]),

  component: CartaPage,
});

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function parseNum(valor: string, max: number): { n: number | null; erro: string | null } {
  const t = valor.trim();
  if (!t) return { n: null, erro: "Informe um número." };
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n)) return { n: null, erro: "Use apenas números." };
  if (n < 1) return { n: null, erro: "O mínimo é 1." };
  if (n > max) return { n: null, erro: `O máximo é ${max}.` };
  return { n: Math.floor(n), erro: null };
}

function CartaPage() {
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { data: ingredientes } = useSuspenseQuery(ingredientesQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [gerando, setGerando] = useState(false);
  const [template, setTemplate] = useState(CARTA_TEMPLATES[0]!.id);
  const [tamanhoQr, setTamanhoQr] = useState<QrTamanhoId>("m");
  const [convidados, setConvidados] = useState("20");
  const [porPessoa, setPorPessoa] = useState("2");
  const [incluirCompras, setIncluirCompras] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const { filtered: porFiltros, element: filtrosUI } = useDrinkFilters({
    drinks,
    ingredientes,
    categorias,
    idPrefix: "carta-filtro",
  });

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    const base = q
      ? porFiltros.filter(
          (d) =>
            norm(d.nome).includes(q) ||
            d.drink_ingredientes.some((di) => norm(di.ingredientes?.nome ?? "").includes(q)),
        )
      : porFiltros;
    return base.slice(0, 60);
  }, [porFiltros, busca]);


  const selecionados = useMemo(
    () => sel.map((id) => drinks.find((d) => d.id === id)).filter(Boolean),
    [sel, drinks],
  );

  const c = parseNum(convidados, MAX_CONVIDADOS);
  const p = parseNum(porPessoa, MAX_DRINKS_POR_CONVIDADO);
  const totalPorcoes = c.n !== null && p.n !== null ? c.n * p.n : 0;
  const porcoesPorReceita =
    totalPorcoes > 0 && sel.length > 0 ? Math.ceil(totalPorcoes / sel.length) : 0;

  const receitas = useMemo(
    () =>
      selecionados.map((d) => ({
        ingredientes: d!.drink_ingredientes
          .map((di) => di.ingredientes?.nome ?? "")
          .filter(Boolean),
      })),
    [selecionados],
  );

  const compras = useMemo(
    () => calcularListaCompras(receitas, porcoesPorReceita),
    [receitas, porcoesPorReceita],
  );

  const alternar = (id: string) => {
    setSel((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= MAX) {
        toast.info(`Escolha no máximo ${MAX} drinks por carta.`);
        return atual;
      }
      return [...atual, id];
    });
  };

  const payload = () => ({
    t: titulo.trim() || "Nossa Carta",
    s: subtitulo.trim() || undefined,
    d: sel,
    tpl: template,
    c: c.n ?? undefined,
    p: p.n ?? undefined,
  });

  const gerar = async () => {
    if (sel.length < MIN) return;
    setGerando(true);
    try {
      const link = urlDaCarta(window.location.origin, payload());
      await gerarCartaPdf({
        titulo: titulo.trim() || "Nossa Carta",
        subtitulo,
        baseUrl: window.location.origin,
        template,
        qrMm: qrMm(tamanhoQr),
        linkPublico: link,
        drinks: selecionados.map((d) => ({
          id: d!.id,
          nome: d!.nome,
          dificuldade: d!.dificuldade,
          ingredientes: d!.drink_ingredientes
            .map((di) => di.ingredientes?.nome ?? "")
            .filter(Boolean),
        })),
        compras:
          incluirCompras && porcoesPorReceita > 0 && compras.itens.length > 0
            ? {
                convidados: c.n ?? 0,
                porPessoa: p.n ?? 0,
                porcoesPorReceita,
                itens: compras.itens,
                volumeTotalMl: compras.volumeTotalMl,
              }
            : undefined,
      });
      toast.success("Carta gerada! Verifique seus downloads.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  };

  const copiarLink = async () => {
    if (sel.length < MIN) return;
    const link = urlDaCarta(window.location.origin, payload());
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      toast.success("Link da carta copiado!");
    } catch {
      toast.info(link);
    }
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
          Carta de drinks para eventos
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Escolha de {MIN} a {MAX} receitas, defina o estilo, informe o número de convidados e gere
          um PDF com QR Code, lista de compras e link público para os convidados.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-8">
            <section aria-labelledby="escolher-titulo" className="space-y-4">
              <h2 id="escolher-titulo" className="font-serif text-xl text-foreground">
                1. Escolha os drinks
                <span className="ml-2 font-sans text-sm text-muted-foreground">
                  {sel.length}/{MAX} selecionados
                </span>
              </h2>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Label htmlFor="carta-busca" className="sr-only">
                  Buscar drink por nome ou ingrediente
                </Label>
                <Input
                  id="carta-busca"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou ingrediente…"
                  className="min-h-11 pl-9"
                />
              </div>

              <ul className="grid gap-2 sm:grid-cols-2">
                {filtrados.map((d) => {
                  const ativo = sel.includes(d.id);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => alternar(d.id)}
                        aria-pressed={ativo}
                        className={`flex min-h-11 w-full flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          ativo
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/40 hover:bg-secondary/50"
                        }`}
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-foreground">
                          {ativo ? "✓ " : ""}
                          {d.nome}
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {d.drink_ingredientes
                            .map((di) => di.ingredientes?.nome)
                            .filter(Boolean)
                            .join(" · ") || "Sem ingredientes"}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filtrados.length === 0 && (
                  <li className="text-sm text-muted-foreground">Nenhum drink encontrado.</li>
                )}
              </ul>
            </section>

            <section aria-labelledby="estilo-titulo" className="space-y-4">
              <h2 id="estilo-titulo" className="font-serif text-xl text-foreground">
                2. Estilo da carta
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {CARTA_TEMPLATES.map((t) => {
                  const ativo = template === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setTemplate(t.id)}
                        aria-pressed={ativo}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                          ativo ? "border-primary bg-primary/10" : "border-border bg-card/40"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-12 w-12 shrink-0 place-items-center rounded border border-border font-serif text-lg"
                          style={{ background: t.preview.fundo, color: t.preview.tinta }}
                        >
                          <span style={{ color: t.preview.destaque }}>Aa</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">
                            {ativo ? "✓ " : ""}
                            {t.nome}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {t.descricao}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">Tamanho do QR Code</legend>
                <div className="flex flex-wrap gap-2">
                  {QR_TAMANHOS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setTamanhoQr(q.id)}
                      aria-pressed={tamanhoQr === q.id}
                      className={`min-h-11 rounded-full border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        tamanhoQr === q.id
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card/40 text-muted-foreground"
                      }`}
                    >
                      {q.nome} · {q.mm} mm
                    </button>
                  ))}
                </div>
              </fieldset>
            </section>

            <section aria-labelledby="porcoes-titulo" className="space-y-4">
              <h2 id="porcoes-titulo" className="font-serif text-xl text-foreground">
                3. Porções da festa
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="carta-convidados">Convidados</Label>
                  <Input
                    id="carta-convidados"
                    inputMode="numeric"
                    value={convidados}
                    onChange={(e) => setConvidados(e.target.value)}
                    aria-invalid={!!c.erro}
                    aria-describedby={c.erro ? "erro-carta-convidados" : undefined}
                    className={`min-h-11 ${c.erro ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {c.erro && (
                    <p id="erro-carta-convidados" className="text-xs text-destructive">
                      {c.erro}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="carta-por-pessoa">Drinks por convidado</Label>
                  <Input
                    id="carta-por-pessoa"
                    inputMode="numeric"
                    value={porPessoa}
                    onChange={(e) => setPorPessoa(e.target.value)}
                    aria-invalid={!!p.erro}
                    aria-describedby={p.erro ? "erro-carta-por-pessoa" : undefined}
                    className={`min-h-11 ${p.erro ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {p.erro && (
                    <p id="erro-carta-por-pessoa" className="text-xs text-destructive">
                      {p.erro}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex min-h-11 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={incluirCompras}
                  onChange={(e) => setIncluirCompras(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Incluir lista de compras no PDF (segunda página)
              </label>

              {porcoesPorReceita > 0 && compras.itens.length > 0 ? (
                <>
                  <p aria-live="polite" className="text-sm text-foreground">
                    <strong className="font-medium">{totalPorcoes} porções</strong> no total ·{" "}
                    {porcoesPorReceita} de cada receita · volume aproximado de{" "}
                    <strong className="font-medium">{formatarVolume(compras.volumeTotalMl)}</strong>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[32rem] text-sm">
                      <caption className="sr-only">
                        Lista de compras para {totalPorcoes} porções
                      </caption>
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Ingrediente
                          </th>
                          <th scope="col" className="py-2 pr-3 font-medium">
                            Total
                          </th>
                          <th scope="col" className="py-2 font-medium">
                            Comprar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {compras.itens.map((i) => (
                          <tr key={i.nome} className="border-b border-border/60 last:border-0">
                            <td className="py-2 pr-3 text-foreground">{i.nome}</td>
                            <td className="py-2 pr-3 text-foreground">{i.quantidade}</td>
                            <td className="py-2 text-muted-foreground">
                              {i.garrafas !== null
                                ? `${i.garrafas} × ${i.embalagem}`
                                : "a gosto"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Selecione drinks e informe os convidados para ver as quantidades.
                </p>
              )}
            </section>
          </div>

          <aside
            aria-labelledby="carta-resumo"
            className="space-y-4 lg:sticky lg:top-24 lg:self-start"
          >
            <h2 id="carta-resumo" className="font-serif text-xl text-foreground">
              4. Personalize e gere
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="carta-titulo">Título da carta</Label>
              <Input
                id="carta-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Aniversário da Ana"
                className="min-h-11"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carta-subtitulo">Subtítulo (opcional)</Label>
              <Input
                id="carta-subtitulo"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Ex.: 12 de agosto · Sítio das Palmeiras"
                className="min-h-11"
                maxLength={80}
              />
            </div>

            <div className="rounded-lg border border-border bg-card/40 p-3">
              <h3 className="text-xs uppercase tracking-[0.2em] text-primary">Selecionados</h3>
              {selecionados.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Nenhum drink escolhido ainda.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selecionados.map((d) => (
                    <li key={d!.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {d!.nome}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        aria-label={`Remover ${d!.nome} da carta`}
                        onClick={() => alternar(d!.id)}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {sel.length > 0 && sel.length < MIN && (
                <p className="mt-2 text-xs text-destructive">
                  Escolha pelo menos {MIN} drinks para gerar a carta.
                </p>
              )}
            </div>

            <Button onClick={gerar} disabled={sel.length < MIN || gerando} className="w-full min-h-11">
              {gerando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Gerando…
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" aria-hidden="true" /> Baixar carta em PDF
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={copiarLink}
              disabled={sel.length < MIN}
              className="w-full min-h-11"
            >
              {copiado ? (
                <>
                  <Check className="mr-2 h-4 w-4" aria-hidden="true" /> Link copiado
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" aria-hidden="true" /> Copiar link público
                </>
              )}
            </Button>

            <p className="inline-flex items-start gap-2 text-xs text-muted-foreground">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Cada drink recebe um QR Code que leva à receita completa. O link público abre a carta
              inteira no navegador, sem baixar nada.
            </p>
            <Badge variant="secondary">Formato A4 · pronto para imprimir</Badge>
          </aside>
        </div>
      </main>
    </div>
  );
}
