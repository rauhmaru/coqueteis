import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUp, List } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

/** Ordem de leitura dos artigos de mixologia (usada em anterior/próximo). */
export const MIXOLOGIA_ARTIGOS = [
  { to: "/mixologia/origem", label: "Origem e história" },
  { to: "/mixologia/tipos", label: "Tipos de coquetéis" },
  { to: "/mixologia/materiais", label: "Materiais e utensílios" },
  { to: "/mixologia/copos", label: "Copos e taças" },
  { to: "/mixologia/bebidas", label: "Bebidas etílicas" },
  { to: "/mixologia/xaropes", label: "Xaropes e bitters" },
  { to: "/mixologia/gelo", label: "Gelo: de coadjuvante a estrela" },
  { to: "/mixologia/tecnicas", label: "Técnicas de bartending" },
  { to: "/mixologia/sabores", label: "Balanço de sabores" },
] as const;

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Barra fina de progresso de leitura fixada abaixo do header. */
function ProgressoLeitura({ alvo }: { alvo: React.RefObject<HTMLElement | null> }) {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    const calcular = () => {
      const el = alvo.current;
      if (!el) return;
      const inicio = el.offsetTop;
      const total = el.offsetHeight - window.innerHeight * 0.35;
      const atual = window.scrollY - inicio;
      const pct = total > 0 ? (atual / total) * 100 : 100;
      setProgresso(Math.min(100, Math.max(0, pct)));
    };
    calcular();
    window.addEventListener("scroll", calcular, { passive: true });
    window.addEventListener("resize", calcular);
    return () => {
      window.removeEventListener("scroll", calcular);
      window.removeEventListener("resize", calcular);
    };
  }, [alvo]);

  const valor = Math.round(progresso);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"
      role="progressbar"
      aria-label="Progresso de leitura do artigo"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
      aria-valuetext={`${valor}% do artigo lido`}
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progresso}%` }}
      />
    </div>
  );
}

type Secao = { id: string; label: string };

/** Sumário clicável gerado a partir dos títulos de seção do artigo. */
function Sumario({ secoes, ativo }: { secoes: Secao[]; ativo: string | null }) {
  if (secoes.length < 2) return null;
  return (
    <nav
      aria-labelledby="sumario-titulo"
      className="not-prose rounded-xl border border-border bg-card/60 p-5"
    >
      <h2
        id="sumario-titulo"
        className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary"
      >
        <List className="h-4 w-4" aria-hidden="true" /> Neste artigo
      </h2>
      <ol className="space-y-1">
        {secoes.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={ativo === s.id ? "true" : undefined}
              className={`flex min-h-9 items-baseline gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                ativo === s.id ? "bg-muted font-medium text-primary" : "text-muted-foreground"
              }`}
            >
              <span aria-hidden="true" className="text-xs tabular-nums text-primary/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Botão flutuante para retornar ao topo da página. */
function VoltarAoTopo() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Button
      type="button"
      size="icon"
      aria-label="Voltar ao topo da página"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("conteudo")?.focus?.();
      }}
      className={`fixed bottom-6 right-4 z-40 min-h-11 min-w-11 rounded-full shadow-lg transition-opacity focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-8 sm:right-8 ${
        visivel ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      tabIndex={visivel ? 0 : -1}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
}

export function MixologiaPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const artigoRef = useRef<HTMLElement | null>(null);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [ativo, setAtivo] = useState<string | null>(null);
  const { pathname } = useLocation();

  const { prev, next } = useMemo(() => {
    const limpo = pathname.replace(/\/$/, "");
    const i = MIXOLOGIA_ARTIGOS.findIndex((a) => a.to === limpo);
    if (i === -1) return { prev: undefined, next: undefined };
    return {
      prev: MIXOLOGIA_ARTIGOS[i - 1],
      next: MIXOLOGIA_ARTIGOS[i + 1],
    };
  }, [pathname]);

  useEffect(() => {
    const el = artigoRef.current;
    if (!el) return;
    const headings = Array.from(el.querySelectorAll<HTMLHeadingElement>("h2"));
    const lista: Secao[] = headings.map((h, i) => {
      const label = h.textContent?.trim() ?? `Seção ${i + 1}`;
      if (!h.id) h.id = slugify(label) || `secao-${i + 1}`;
      h.style.scrollMarginTop = "5rem";
      return { id: h.id, label };
    });
    setSecoes(lista);

    const observer = new IntersectionObserver(
      (entries) => {
        const visivel = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtivo(visivel.target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className="min-h-dvh">
      <ProgressoLeitura alvo={artigoRef} />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link
          to="/mixologia"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mixologia
        </Link>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Mixologia</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">{title}</h1>
          {subtitle && <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
        </header>
        <Sumario secoes={secoes} ativo={ativo} />
        <article
          ref={artigoRef}
          className="prose-mixologia space-y-6 text-foreground/90 leading-relaxed"
        >
          {children}
        </article>
        <MixologiaNav prev={prev} next={next} />
      </main>
      <VoltarAoTopo />
    </div>
  );
}

export function MixImg({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="m-0 inline-block w-full max-w-[300px]">
      <img
        src={src}
        alt={alt}
        width={300}
        height={300}
        loading="lazy"
        className="aspect-square w-full rounded-lg border border-border object-cover"
      />
      {caption && (
        <figcaption className="mt-2 text-xs text-muted-foreground text-center">{caption}</figcaption>
      )}
    </figure>
  );
}

export function MixImgRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-4 justify-center py-2">{children}</div>;
}

export function MixSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 id={slugify(title)} className="font-serif text-2xl text-primary scroll-mt-20">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MixologiaNav({
  prev,
  next,
}: {
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
}) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="Navegação entre artigos de mixologia"
      className="border-t border-border pt-8 mt-8 not-prose"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {prev ? (
          <Link
            to={prev.to}
            aria-label={`Artigo anterior: ${prev.label}`}
            rel="prev"
            className="group flex flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft
              className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
              aria-hidden="true"
            />
            <div className="min-w-0 text-left">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                Anterior
              </span>
              <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {prev.label}
              </span>
            </div>
          </Link>
        ) : (
          <span className="flex-1" aria-hidden="true" />
        )}
        {next ? (
          <Link
            to={next.to}
            aria-label={`Próximo artigo: ${next.label}`}
            rel="next"
            className="group flex flex-1 items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="min-w-0 text-right">
              <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                Próximo
              </span>
              <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {next.label}
              </span>
            </div>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <span className="flex-1" aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
