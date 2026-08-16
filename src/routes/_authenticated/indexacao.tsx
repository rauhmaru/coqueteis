import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  carregarPainelIndexacao,
  consultarIndexacao,
  atualizarSitemap,
  type UrlMonitorada,
} from "@/lib/indexacao.functions";

export const Route = createFileRoute("/_authenticated/indexacao")({
  head: () => ({
    meta: [
      { title: "Painel de indexação — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Painel interno para acompanhar o status de indexação das URLs de drinks e categorias no Google Search Console.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel de indexação — Destilados & Coquetéis" },
      {
        property: "og:description",
        content: "Status de indexação das URLs por slug e categorias, com histórico de consultas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Painel de indexação — Destilados & Coquetéis" },
      {
        name: "twitter:description",
        content: "Status de indexação das URLs por slug e categorias, com histórico de consultas.",
      },
    ],
  }),
  component: PainelIndexacaoPage,
  errorComponent: ({ error }) => (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="p-12 text-center text-destructive">{error.message}</div>
    </div>
  ),
});

const TIPOS = [
  { valor: "todos", label: "Todos" },
  { valor: "drink", label: "Drinks (slug)" },
  { valor: "categoria", label: "Categorias" },
  { valor: "lista", label: "Listas" },
  { valor: "home", label: "Home" },
] as const;

const POR_PAGINA = 25;

function dataCurta(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function StatusBadge({ item }: { item: UrlMonitorada }) {
  if (item.erro) return <Badge variant="destructive">Erro</Badge>;
  if (!item.consultado_em) return <Badge variant="outline">Nunca consultada</Badge>;
  const c = item.coverage_state ?? "";
  if (item.verdict === "PASS")
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Indexada</Badge>;
  if (/unknown to Google/i.test(c)) return <Badge variant="secondary">Desconhecida</Badge>;
  if (item.verdict === "FAIL") return <Badge variant="destructive">Não indexada</Badge>;
  return <Badge variant="secondary">{item.verdict ?? "Pendente"}</Badge>;
}

function PainelIndexacaoPage() {
  const carregar = useServerFn(carregarPainelIndexacao);
  const consultar = useServerFn(consultarIndexacao);
  const sitemapFn = useServerFn(atualizarSitemap);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["painel-indexacao"],
    queryFn: () => carregar(),
  });

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]["valor"]>("todos");
  const [pagina, setPagina] = useState(0);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data?.urls ?? []).filter((u) => {
      if (tipo !== "todos" && u.tipo !== tipo) return false;
      if (!termo) return true;
      return u.titulo.toLowerCase().includes(termo) || u.url.toLowerCase().includes(termo);
    });
  }, [data?.urls, busca, tipo]);

  const paginadas = filtradas.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));

  const mutConsulta = useMutation({
    mutationFn: (urls: string[]) => consultar({ data: { urls, tipo } }),
    onSuccess: (res) => {
      if (res.status === "selection_required") {
        toast.error("Há mais de uma propriedade no Search Console. Escolha uma para continuar.");
        return;
      }
      const erros = res.resultados.filter((r) => r.erro).length;
      toast.success(
        `${res.resultados.length} URL(s) consultada(s)${erros ? ` — ${erros} com erro` : ""}.`,
      );
      setSelecionadas([]);
      queryClient.invalidateQueries({ queryKey: ["painel-indexacao"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mutSitemap = useMutation({
    mutationFn: (submeter: boolean) => sitemapFn({ data: { submeter } }),
    onSuccess: (res, submeter) => {
      if (res.status === "selection_required") {
        toast.error("Há mais de uma propriedade no Search Console. Escolha uma para continuar.");
        return;
      }
      toast.success(submeter ? "Sitemap reenviado ao Google." : "Status do sitemap atualizado.");
      queryClient.invalidateQueries({ queryKey: ["painel-indexacao"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ultimoSitemap = data?.sitemap[0];
  const ocupado = mutConsulta.isPending || mutSitemap.isPending;

  function alternar(url: string) {
    setSelecionadas((atual) =>
      atual.includes(url)
        ? atual.filter((u) => u !== url)
        : atual.length >= 10
          ? (toast.error("Máximo de 10 URLs por consulta."), atual)
          : [...atual, url],
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Interno</p>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">Painel de indexação</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status das URLs por slug e das rotas por categoria no Google Search Console.
          </p>
        </header>

        {/* Sitemap */}
        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl text-foreground">Sitemap</h2>
              <p className="text-sm text-muted-foreground">
                {ultimoSitemap
                  ? `Último envio: ${dataCurta(ultimoSitemap.last_submitted)} · Baixado: ${dataCurta(
                      ultimoSitemap.last_downloaded,
                    )} · ${ultimoSitemap.total_urls ?? "—"} URLs · ${ultimoSitemap.errors ?? 0} erros / ${
                      ultimoSitemap.warnings ?? 0
                    } avisos${ultimoSitemap.is_pending ? " · em processamento" : ""}`
                  : "Nenhuma consulta registrada ainda."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => mutSitemap.mutate(false)}
                disabled={ocupado}
                className="min-h-11"
              >
                {mutSitemap.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Consultar status
              </Button>
              <Button onClick={() => mutSitemap.mutate(true)} disabled={ocupado} className="min-h-11">
                <Send className="mr-2 h-4 w-4" aria-hidden="true" /> Reenviar sitemap
              </Button>
            </div>
          </div>

          {data && data.sitemap.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
              {data.sitemap.map((s) => (
                <li key={s.id} className="flex flex-wrap gap-x-2">
                  <span className="text-foreground">{dataCurta(s.criado_em)}</span>
                  <span className="uppercase tracking-wide">{s.acao}</span>
                  {s.erro ? (
                    <span className="text-destructive">{s.erro}</span>
                  ) : (
                    <span>
                      {s.total_urls ?? "—"} URLs · {s.errors ?? 0} erros · {s.warnings ?? 0} avisos
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* URLs */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl text-foreground">URLs monitoradas</h2>
            <Button
              onClick={() => mutConsulta.mutate(selecionadas)}
              disabled={ocupado || selecionadas.length === 0}
              className="min-h-11"
            >
              {mutConsulta.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Consultar selecionadas ({selecionadas.length})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(0);
              }}
              placeholder="Buscar por nome ou URL"
              aria-label="Buscar URL"
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtrar por tipo">
              {TIPOS.map((t) => (
                <button
                  key={t.valor}
                  onClick={() => {
                    setTipo(t.valor);
                    setPagina(0);
                  }}
                  aria-pressed={tipo === t.valor}
                  className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    tipo === t.valor
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando…
            </p>
          )}
          {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {paginadas.map((u) => (
              <li key={u.url} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                <Checkbox
                  checked={selecionadas.includes(u.url)}
                  onCheckedChange={() => alternar(u.url)}
                  aria-label={`Selecionar ${u.titulo}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{u.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.url.replace("https://coqueteis.lovable.app", "")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {u.erro
                      ? u.erro
                      : `${u.coverage_state ?? "Sem dados"} · rastreio: ${dataCurta(u.last_crawl_time)} · consulta: ${dataCurta(u.consultado_em)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge item={u} />
                  {u.inspection_link && (
                    <a
                      href={u.inspection_link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir ${u.titulo} no Search Console`}
                      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </li>
            ))}
            {!isLoading && paginadas.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma URL encontrada.
              </li>
            )}
          </ul>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
              >
                Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                Página {pagina + 1} de {totalPaginas} · {filtradas.length} URLs
              </span>
              <Button
                variant="outline"
                className="min-h-11"
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
              >
                Próxima
              </Button>
            </div>
          )}
        </section>

        {/* Logs */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl text-foreground">Últimas consultas</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-xs">
            {(data?.logs ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className="text-muted-foreground">{dataCurta(l.consultado_em)}</span>
                <span className="truncate text-foreground">
                  {l.url.replace("https://coqueteis.lovable.app", "")}
                </span>
                {l.erro ? (
                  <span className="text-destructive">{l.erro}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {l.verdict ?? "—"} · {l.coverage_state ?? "—"}
                  </span>
                )}
              </li>
            ))}
            {(data?.logs.length ?? 0) === 0 && (
              <li className="p-6 text-center text-muted-foreground">
                Nenhuma consulta registrada ainda.
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
