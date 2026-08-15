import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Martini, Search, ArrowRight, Wine, Sparkles, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DrinkImage } from "@/components/drink-image";
import { FavoriteIconButton } from "@/components/favorite-icon-button";
import { useAuth } from "@/hooks/use-auth";
import { countsQuery, drinksQuery, drinkCategoriasQuery } from "@/lib/queries";
import { drinkParam, slugify } from "@/lib/slug";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:url", content: "https://coqueteis.lovable.app/" },
      { title: "Receitas de drinks e coquetéis — Destilados & Coquetéis" },
      {
        name: "description",
        content:
          "Catálogo de receitas de coquetéis, xaropes e drinks sem álcool: ingredientes, preparo, dificuldade e ferramentas de bar.",
      },
      { property: "og:title", content: "Receitas de drinks e coquetéis — Destilados & Coquetéis" },
      {
        property: "og:description",
        content:
          "Catálogo de receitas de coquetéis, xaropes e drinks sem álcool: ingredientes, preparo, dificuldade e ferramentas de bar.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://coqueteis.lovable.app/" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(countsQuery),
      context.queryClient.ensureQueryData(drinksQuery),
    ]),
  component: HomePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});

function HomePage() {
  const { data: counts } = useSuspenseQuery(countsQuery);
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const scored = drinks
      .map((d) => {
        const nome = norm(d.nome);
        const cats = d.drink_drink_categorias
          .map((c) => norm(c.drink_categorias?.nome ?? ""))
          .join(" ");
        const ings = d.drink_ingredientes
          .map((i) => norm(i.ingredientes?.nome ?? ""))
          .join(" ");
        let score = 0;
        if (nome.startsWith(q)) score = 4;
        else if (nome.includes(q)) score = 3;
        else if (cats.includes(q)) score = 2;
        else if (ings.includes(q)) score = 1;
        return { d, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.d.nome.localeCompare(b.d.nome))
      .slice(0, 8)
      .map((x) => x.d);
    return scored;
  }, [query, drinks]);

  const sugestao = useMemo(
    () => (drinks.length ? drinks[Math.floor(Math.random() * drinks.length)] : null),
    [drinks],
  );


  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-12 space-y-12">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Bem-vindo ao seu bar</p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground">
            Sua coqueteleria,<br />organizada com elegância.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Cadastre ingredientes, descubra quais drinks você pode preparar agora mesmo e
            mantenha suas receitas favoritas sempre à mão.
          </p>
        </section>

        <section aria-labelledby="busca-titulo" className="max-w-2xl mx-auto">
          <h2 id="busca-titulo" className="sr-only">
            Buscar drinks
          </h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl">
            <Command shouldFilter={false} className="bg-transparent">
              <div className="flex items-center px-4 border-b border-border">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Buscar um drink pelo nome…"
                  className="border-0 focus:ring-0 text-base"
                />
              </div>
              <CommandList className={query.trim() ? "max-h-64" : "hidden"}>
                {query.trim() && (
                  <CommandEmpty>Nenhum drink encontrado.</CommandEmpty>
                )}
                {query.trim() && (
                  <CommandGroup>
                    {filtered.map((d) => (
                      <CommandItem
                        key={d.id}
                        value={d.id}
                        onSelect={() => navigate({ to: "/drinks/$id", params: { id: d.id } })}
                        className="cursor-pointer"
                      >
                        <Martini className="h-4 w-4 mr-2 text-primary shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{d.nome}</span>
                        {d.drink_drink_categorias[0]?.drink_categorias?.nome && (
                          <span className="ml-2 text-xs text-muted-foreground truncate">
                            {d.drink_drink_categorias[0].drink_categorias.nome}
                          </span>
                        )}
                        {user && (
                          <span className="ml-2 shrink-0">
                            <FavoriteIconButton drinkId={d.id} />
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        </section>

        <section
          aria-labelledby="meu-bar-titulo"
          className="mx-auto max-w-2xl rounded-xl border border-primary/40 bg-primary/5 p-5 sm:p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Meu Bar</p>
          <h2 id="meu-bar-titulo" className="mt-2 font-serif text-2xl text-foreground sm:text-3xl">
            Cadastre seu bar e descubra o que já pode preparar hoje
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Informe as garrafas e ingredientes que você tem em casa. Mostramos na hora todos os
            drinks que <span className="text-foreground">dá para fazer agora</span>, os que estão{" "}
            <span className="text-foreground">quase lá</span> (falta só 1 ingrediente) e um ranking
            de compras: qual ingrediente desbloqueia mais receitas de uma vez. Ainda calculamos o
            custo por dose com o preço que você pagou.
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-center gap-2">
              <Wine className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Estoque pessoal
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Tag “quase
              lá”
            </li>
            <li className="flex items-center gap-2">
              <Wallet className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Custo por dose
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/meu-bar"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Cadastrar meu bar <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {!user && (
              <span className="text-xs text-muted-foreground">
                É preciso entrar na conta — leva menos de 1 minuto.
              </span>
            )}
          </div>
        </section>

        <section className="max-w-2xl mx-auto">
          <StatCard
            icon={<Martini className="h-6 w-6" />}
            label="Receitas cadastradas"
            value={counts.drinks}
            to="/drinks"
          />
        </section>


        {sugestao && (
          <section className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-primary text-center">
              Sugestão do bartender
            </h2>
            <Link
              to="/drinks/$id"
              params={{ id: drinkParam(sugestao) }}
              className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <DrinkImage
                path={sugestao.imagem_url}
                alt={`Foto do drink ${sugestao.nome}`}
                className="aspect-square w-full object-cover"
              />
              <div className="p-4 text-center">
                <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors">
                  {sugestao.nome}
                </h3>
              </div>
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, to,
}: { icon: React.ReactNode; label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="group flex min-h-11 items-center gap-4 rounded-xl border border-border bg-card p-5 sm:p-6 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div aria-hidden="true" className="shrink-0 rounded-full bg-secondary p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-3xl font-serif text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}

