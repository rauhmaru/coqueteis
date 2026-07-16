import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowLeft, Martini } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { categoriasQuery, drinksQuery } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { DrinkImage } from "@/components/drink-image";

export const Route = createFileRoute("/categorias/$id")({
  head: () => ({
    meta: [
      { title: "Drinks por categoria — Destilados & Coquetéis" },
      { name: "description", content: "Drinks que usam ingredientes desta categoria." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriasQuery),
      context.queryClient.ensureQueryData(drinksQuery),
    ]),
  component: CategoriaDrinks,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Categoria não encontrada.</div>,
});

function CategoriaDrinks() {
  const { id } = Route.useParams();
  const { data: categorias } = useSuspenseQuery(categoriasQuery);
  const { data: drinks } = useSuspenseQuery(drinksQuery);

  const categoria = categorias.find((c) => c.id === id);

  const filtered = useMemo(() => {
    return drinks.filter((d) =>
      d.drink_ingredientes.some((di) => di.ingredientes?.categoria_id === id),
    );
  }, [drinks, id]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div>
          <Link
            to="/categorias"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Categorias
          </Link>
          <h1 className="font-serif text-4xl text-foreground">
            {categoria ? categoria.nome : "Categoria"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} {filtered.length === 1 ? "drink usa" : "drinks usam"} ingredientes desta categoria
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Martini className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              Nenhum drink cadastrado com ingredientes desta categoria.
            </p>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <li
                key={d.id}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors"
              >
                <Link to="/drinks/$id" params={{ id: d.id }} className="block">
                  <DrinkImage
                    path={d.imagem_url}
                    alt={d.nome}
                    className="aspect-[4/3] w-full object-cover bg-secondary/40"
                  />
                  <div className="p-4">
                    <h3 className="font-serif text-xl text-foreground">{d.nome}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.drink_ingredientes
                        .filter((di) => di.ingredientes?.categoria_id === id)
                        .slice(0, 4)
                        .map((di) => (
                          <Badge key={di.ingrediente_id} variant="secondary" className="text-[10px]">
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
      </main>
    </div>
  );
}
