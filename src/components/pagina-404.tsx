import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Calculator, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DrinkImage } from "@/components/drink-image";
import { AutocompleteDrinks } from "@/components/drink-search";
import { drinksQuery } from "@/lib/queries";
import { drinkParam } from "@/lib/slug";

const ATALHOS = [
  { to: "/drinks", label: "Todas as receitas", icon: Martini },
  { to: "/mixologia", label: "Mixologia", icon: BookOpen },
  { to: "/calculadora-abv", label: "Calculadora ABV", icon: Calculator },
] as const;

/** Página 404 do site: busca, atalhos e receitas sugeridas. */
export function Pagina404() {
  const { data: drinks } = useQuery(drinksQuery);

  const sugestoes = useMemo(() => {
    const lista = drinks ?? [];
    if (lista.length === 0) return [];
    const inicio = Math.floor(Math.random() * lista.length);
    return Array.from({ length: Math.min(3, lista.length) }, (_, i) => lista[(inicio + i) % lista.length]!);
  }, [drinks]);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="conteudo" className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        <p className="font-serif text-6xl text-primary sm:text-7xl">404</p>
        <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
          Página não encontrada
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          O endereço não existe ou foi movido. Busque uma receita ou use os atalhos abaixo.
        </p>

        <div className="mt-8">
          <h2 className="mb-2 text-sm font-medium text-foreground">Buscar drinks</h2>
          <AutocompleteDrinks limite={8} />
        </div>

        <nav aria-label="Atalhos" className="mt-8 grid gap-3 sm:grid-cols-3">
          {ATALHOS.map(({ to, label, icon: Icone }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Icone className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        {sugestoes.length > 0 && (
          <section className="mt-10" aria-labelledby="sugestoes-404">
            <h2 id="sugestoes-404" className="mb-3 font-serif text-xl text-foreground">
              Receitas para experimentar
            </h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {sugestoes.map((d) => (
                <li key={d.id}>
                  <Link
                    to="/drinks/$id"
                    params={{ id: drinkParam(d) }}
                    className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <DrinkImage
                      path={d.imagem_url}
                      alt={`Foto do drink ${d.nome}`}
                      className="aspect-square w-full object-cover"
                      sizes="(min-width: 640px) 280px, 100vw"
                    />
                    <div className="p-3">
                      <h3 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {d.nome}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
