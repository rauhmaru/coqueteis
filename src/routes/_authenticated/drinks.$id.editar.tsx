import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { drinkQuery, ingredientesQuery, drinkCategoriasQuery } from "@/lib/queries";
import { DrinkForm } from "@/components/drink-form";
import { useAuth } from "@/hooks/use-auth";
import { canManageItem } from "@/lib/permissions";

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
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const canManage = canManageItem({ user, isAdmin }, drink);

  useEffect(() => {
    if (loading || canManage) return;
    toast.error("Você só pode editar receitas que você mesmo cadastrou.");
    navigate({ to: "/drinks/$id", params: { id }, replace: true });
  }, [canManage, loading, id, navigate]);

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DrinkForm existing={drink} />;
}
