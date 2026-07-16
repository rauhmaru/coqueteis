import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { drinkQuery, ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const canManage = isAdmin || (user && drink?.created_by === user.id);
  useEffect(() => {
    if (drink && user && !canManage) {
      toast.error("Você só pode editar drinks que você cadastrou.");
      navigate({ to: "/drinks/$id", params: { id } });
    }
  }, [drink, user, canManage, navigate, id]);
  return <DrinkForm existing={drink} />;
}
