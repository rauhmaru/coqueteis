import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { FileDown, Loader2, QrCode, Search, X } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { drinksQuery } from "@/lib/queries";
import { gerarCartaPdf } from "@/lib/carta-pdf";

const MIN = 3;
const MAX = 5;

export const Route = createFileRoute("/carta")({
  head: () => ({
    meta: [
      { title: "Carta de drinks para eventos — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Selecione de 3 a 5 receitas e gere uma carta de drinks em PDF com QR Code para os convidados escanearem na festa.",
      },
      { property: "og:title", content: "Carta de drinks para eventos" },
      {
        property: "og:description",
        content: "Monte sua carta de drinks em PDF com QR Code, pronta para imprimir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(drinksQuery),
  component: CartaPage,
});

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function CartaPage() {
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [gerando, setGerando] = useState(false);

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    const base = q
      ? drinks.filter(
          (d) =>
            norm(d.nome).includes(q) ||
            d.drink_ingredientes.some((di) => norm(di.ingredientes?.nome ?? "").includes(q)),
        )
      : drinks;
    return base.slice(0, 60);
  }, [drinks, busca]);

  const selecionados = useMemo(
    () => sel.map((id) => drinks.find((d) => d.id === id)).filter(Boolean),
    [sel, drinks],
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

  const gerar = async () => {
    if (sel.length < MIN) return;
    setGerando(true);
    try {
      await gerarCartaPdf({
        titulo: titulo.trim() || "Nossa Carta",
        subtitulo,
        baseUrl: window.location.origin,
        drinks: selecionados.map((d) => ({
          id: d!.id,
          nome: d!.nome,
          dificuldade: d!.dificuldade,
          ingredientes: d!.drink_ingredientes.map((di) => di.ingredientes?.nome ?? "").filter(Boolean),
        })),
      });
      toast.success("Carta gerada! Verifique seus downloads.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
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
          Escolha de {MIN} a {MAX} receitas, personalize o título e gere um PDF elegante com QR
          Code por drink. Imprima, coloque na mesa e seus convidados escaneiam para ver a receita
          completa no celular.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
          <section aria-labelledby="escolher-titulo" className="space-y-4">
            <h2 id="escolher-titulo" className="font-serif text-xl text-foreground">
              1. Escolha os drinks
              <span className="ml-2 text-sm font-sans text-muted-foreground">
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
                      className={`flex w-full min-h-11 flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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

          <aside aria-labelledby="carta-resumo" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <h2 id="carta-resumo" className="font-serif text-xl text-foreground">
              2. Personalize e gere
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
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum drink escolhido ainda.
                </p>
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

            <Button
              onClick={gerar}
              disabled={sel.length < MIN || gerando}
              className="w-full min-h-11"
            >
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

            <p className="inline-flex items-start gap-2 text-xs text-muted-foreground">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Cada drink recebe um QR Code que leva à receita completa no site.
            </p>
            <Badge variant="secondary">Formato A4 · pronto para imprimir</Badge>
          </aside>
        </div>
      </main>
    </div>
  );
}
