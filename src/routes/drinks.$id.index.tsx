import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { drinkQuery } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrinkImage } from "@/components/drink-image";
import { DrinkSocial } from "@/components/drink-social";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/drinks/$id/")({
  head: () => ({
    meta: [{ title: "Drink — Destilados & Coquetéis" }],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(drinkQuery(params.id));
    if (!data) throw notFound();
    return data;
  },
  component: DrinkDetail,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="p-12 text-center text-muted-foreground">Drink não encontrado.</div>
    </div>
  ),
});

function DrinkDetail() {
  const { id } = Route.useParams();
  const { data: drink } = useSuspenseQuery(drinkQuery(id));
  const { canEdit } = useAuth();
  if (!drink) return null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        <Link to="/drinks" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar para drinks
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <DrinkImage
            path={drink.imagem_url}
            alt={drink.nome}
            className="aspect-square w-full object-cover rounded-xl border border-border bg-secondary/40"
          />
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-5xl text-foreground">{drink.nome}</h1>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Ingredientes</h2>
              <div className="flex flex-wrap gap-2">
                {drink.drink_ingredientes.map((di) => (
                  <Badge key={di.ingrediente_id} variant="secondary">
                    {di.ingredientes?.nome ?? "?"}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Preparo</h2>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {drink.preparo || <span className="text-muted-foreground italic">Sem instruções de preparo.</span>}
              </p>
            </div>
            {canEdit && (
              <Button asChild>
                <Link to="/drinks/$id/editar" params={{ id: drink.id }}>
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
