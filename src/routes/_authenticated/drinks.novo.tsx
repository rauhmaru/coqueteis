import { createFileRoute } from "@tanstack/react-router";
import { ingredientesQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";

export const Route = createFileRoute("/_authenticated/drinks/novo")({
  head: () => ({ meta: [{ title: "Novo drink — Destilados & Coquetéis" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ingredientesQuery),
  component: () => <DrinkForm />,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Não encontrado.</div>,
});
