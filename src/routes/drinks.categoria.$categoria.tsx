import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { DrinkImage } from "@/components/drink-image";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { drinksQuery, drinkCategoriasQuery } from "@/lib/queries";
import { slugify, drinkParam } from "@/lib/slug";

type LoaderData = { nome: string; slug: string; total: number };

export const Route = createFileRoute("/drinks/categoria/$categoria")({
  head: ({ params, loaderData }) => {
    const dados = loaderData as unknown as LoaderData | undefined;
    const url = `https://coqueteis.lovable.app/drinks/categoria/${params.categoria}`;
    if (!dados) {
      return {
        meta: [{ title: "Categoria de drinks — Destilados & Coquetéis" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const titulo = `Drinks ${dados.nome} — ${dados.total} receitas`.slice(0, 59);
    const descricao =
      `Receitas de drinks ${dados.nome.toLowerCase()}: ${dados.total} coquetéis com ingredientes, copo indicado, método de preparo e passo a passo.`.slice(
        0,
        158,
      );
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: titulo },
        { name: "twitter:description", content: descricao },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: async ({ context, params }): Promise<LoaderData> => {
    const [drinks, categorias] = await Promise.all([
      context.queryClient.ensureQueryData(drinksQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]);
    const categoria = categorias.find((c) => slugify(c.nome) === params.categoria);
    if (!categoria) throw notFound();
    const total = drinks.filter((d) =>
      d.drink_drink_categorias.some((c) => c.categoria_id === categoria.id),
    ).length;
    return { nome: categoria.nome, slug: params.categoria, total };
  },
  component: CategoriaPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="p-12 text-center text-muted-foreground">Categoria não encontrada.</div>
    </div>
  ),
});

function CategoriaPage() {
  const { categoria: slug } = Route.useParams();
  const { data: drinks } = useSuspenseQuery(drinksQuery);
  const { data: categorias } = useSuspenseQuery(drinkCategoriasQuery);

  const categoria = categorias.find((c) => slugify(c.nome) === slug);
  const lista = categoria
    ? drinks.filter((d) => d.drink_drink_categorias.some((c) => c.categoria_id === categoria.id))
    : [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <Link
          to="/drinks"
          className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Todos os drinks
        </Link>

        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Categoria</p>
          <h1 className="font-serif text-3xl text-foreground sm:text-4xl">
            Drinks {categoria?.nome ?? slug}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lista.length} {lista.length === 1 ? "receita" : "receitas"} nesta categoria.
          </p>
        </header>

        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-muted-foreground">Nenhuma receita nesta categoria ainda.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((d) => (
              <li key={d.id}>
                <Link
                  to="/drinks/$id"
                  params={{ id: drinkParam(d) }}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <DrinkImage
                    path={d.imagem_url}
                    alt={`Foto do drink ${d.nome}`}
                    className="aspect-[4/3] w-full bg-secondary/40 object-cover"
                  />
                  <div className="p-4">
                    <h2 className="font-serif text-xl text-foreground transition-colors group-hover:text-primary">
                      {d.nome}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <DifficultyBadge value={d.dificuldade} />
                      {d.drink_ingredientes.slice(0, 3).map((di) => (
                        <Badge key={di.ingrediente_id} variant="secondary" className="text-xs">
                          {di.ingredientes?.nome ?? "?"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <nav aria-label="Outras categorias" className="space-y-3 border-t border-border pt-6">
          <h2 className="text-xs uppercase tracking-[0.2em] text-primary">Outras categorias</h2>
          <ul className="flex flex-wrap gap-2">
            {categorias
              .filter((c) => slugify(c.nome) !== slug)
              .map((c) => (
                <li key={c.id}>
                  <Link
                    to="/drinks/categoria/$categoria"
                    params={{ categoria: slugify(c.nome) }}
                    className="inline-flex min-h-9 items-center rounded-full border border-border bg-secondary px-3 text-xs text-secondary-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.nome}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
