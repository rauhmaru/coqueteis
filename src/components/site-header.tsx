import { Link } from "@tanstack/react-router";
import { Martini } from "lucide-react";

const nav = [
  { to: "/", label: "Início" },
  { to: "/drinks", label: "Drinks" },
  { to: "/ingredientes", label: "Ingredientes" },
  { to: "/categorias", label: "Categorias" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Martini className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
          <div className="leading-tight">
            <div className="font-serif text-lg text-foreground">Destilados &amp; Coquetéis</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sistema de gestão</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              activeProps={{ className: "px-3 py-1.5 rounded-md text-primary bg-secondary/80" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
