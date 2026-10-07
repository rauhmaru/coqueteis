import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { listarReceitasComVideo } from "@/lib/mixologia-postagens.functions";
import { DrinkImage } from "@/components/drink-image";
import { SiteHeader } from "@/components/site-header";
import { Input } from "@/components/ui/input";

const URL = "https://coqueteis.lovable.app/mixologia/videos";
const TITULO = "Receitas em vídeo — Mixologia";
const DESC = "Todas as receitas do catálogo com o vídeo de origem, para ver cada drink sendo preparado no contexto original.";

export const Route = createFileRoute("/mixologia/videos")({
  loader: () => listarReceitasComVideo(),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESC },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-center text-destructive">Não foi possível carregar as receitas: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Nenhuma receita encontrada.</div>,
  component: ReceitasEmVideo,
});

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function ReceitasEmVideo() {
  const receitas = Route.useLoaderData();
  const [termo, setTermo] = useState("");
  const filtradas = useMemo(() => {
    const t = normalizar(termo.trim());
    return t ? receitas.filter((r) => normalizar(r.nome).includes(t)) : receitas;
  }, [receitas, termo]);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-12 space-y-8">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Mixologia</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground">Receitas em vídeo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {receitas.length} receitas com o vídeo de origem. Abra a receita completa ou assista ao preparo no contexto original.
          </p>
        </section>

        <div className="max-w-md mx-auto">
          <label htmlFor="busca-videos" className="sr-only">Buscar receita</label>
          <Input id="busca-videos" type="search" placeholder="Buscar receita…" value={termo} onChange={(e) => setTermo(e.target.value)} />
        </div>
        <p className="sr-only" aria-live="polite">{filtradas.length} receitas encontradas</p>

        {filtradas.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma receita corresponde à busca.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtradas.map((r) => (
              <li key={r.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                <Link to="/drinks/$id" params={{ id: r.slug }} className="group block focus-visible:ring-2 focus-visible:ring-ring">
                  <DrinkImage path={r.imagem_url} alt={r.nome} width={400} height={225} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-video w-full object-cover" />
                  <div className="p-4 pb-2">
                    <h2 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">{r.nome}</h2>
                    <p className="text-sm text-muted-foreground">{r.dificuldade}</p>
                  </div>
                </Link>
                <div className="mt-auto flex flex-wrap gap-2 p-4 pt-2">
                  <Link to="/drinks/$id" params={{ id: r.slug }} className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:border-primary focus-visible:ring-2 focus-visible:ring-ring">
                    Ver receita
                  </Link>
                  <a href={r.video_url} target="_blank" rel="noopener noreferrer" aria-label={`Assistir ao vídeo de ${r.nome} (abre em nova aba)`} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring">
                    <PlayCircle className="h-4 w-4" aria-hidden /> Assistir vídeo <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
