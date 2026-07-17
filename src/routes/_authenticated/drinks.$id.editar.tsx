import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { drinkQuery, ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/drinks/$id/editar")({
  head: () => ({ meta: [{ title: "Editar drink — Destilados & Coquetéis" }] }),
  loader: async ({ context, params }) => {
    const [drink] = await Promise.all([
      context.queryClient.ensureQueryData(drinkQuery(params.id)),
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]);
    if (!drink) throw notFound();
    return drink;
  },
  component: EditDrink,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Drink não encontrado.</div>,
});

function EditDrink() {
  const { id } = Route.useParams();
  const { data: drink } = useSuspenseQuery(drinkQuery(id));
  const { user, isAdmin } = useAuth();
  const canManage = !!(drink && user && (isAdmin || drink.created_by === user.id));

  if (!canManage) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <h1 className="font-serif text-3xl text-foreground">Sem permissão</h1>
          <p className="text-muted-foreground">
            Você só pode editar receitas que você cadastrou.
          </p>
          <Link
            to="/drinks/$id"
            params={{ id }}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Ver o drink
          </Link>
        </main>
      </div>
    );
  }

  return <DrinkForm existing={drink} />;
}
