import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";


export function MixologiaPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link
          to="/mixologia"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Mixologia
        </Link>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Mixologia</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground">{title}</h1>
          {subtitle && <p className="text-base text-muted-foreground sm:text-lg">{subtitle}</p>}
        </header>
        <article className="prose-mixologia space-y-6 text-foreground/90 leading-relaxed">
          {children}
        </article>
      </main>
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
      <h2 className="font-serif text-2xl text-primary">{title}</h2>
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
  return (
    <nav
      aria-label="Navegação entre artigos"
      className="border-t border-border pt-8 mt-8 not-prose"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {prev ? (
          <Link
            to={prev.to}
            className="group flex flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          <span className="flex-1" />
        )}
        {next ? (
          <Link
            to={next.to}
            className="group flex flex-1 items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          <span className="flex-1" />
        )}
      </div>
    </nav>
  );
}

