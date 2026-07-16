import { createFileRoute } from "@tanstack/react-router";
import { ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";

export const Route = createFileRoute("/_authenticated/drinks/novo")({
  head: () => ({ meta: [{ title: "Novo drink — Destilados & Coquetéis" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ingredientesQuery),
      context.queryClient.ensureQueryData(drinkCategoriasQuery),
    ]),
  component: () => <DrinkForm />,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});
