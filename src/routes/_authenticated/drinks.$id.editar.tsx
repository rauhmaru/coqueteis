import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { drinkQuery, ingredientesQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";

export const Route = createFileRoute("/drinks/$id/editar")({
  head: () => ({ meta: [{ title: "Editar drink — Destilados & Coquetéis" }] }),
  loader: async ({ context, params }) => {
    const [drink] = await Promise.all([
      context.queryClient.ensureQueryData(drinkQuery(params.id)),
      context.queryClient.ensureQueryData(ingredientesQuery),
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
  return <DrinkForm existing={drink} />;
}
