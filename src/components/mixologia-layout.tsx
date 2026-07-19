import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link
          to="/mixologia"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Mixologia
        </Link>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Mixologia</p>
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
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
    <figure className="inline-block m-0">
      <img
        src={src}
        alt={alt}
        width={300}
        height={300}
        loading="lazy"
        className="w-[300px] h-[300px] rounded-lg object-cover border border-border"
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
