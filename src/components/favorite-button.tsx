import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const favKey = (userId: string | undefined, drinkId: string) =>
  ["drink-favorito", userId ?? "anon", drinkId] as const;

export function FavoriteButton({ drinkId }: { drinkId: string }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: favKey(user?.id, drinkId),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drink_favoritos")
        .select("id")
        .eq("drink_id", drinkId)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const favorito = !!q.data;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para favoritar.");
      if (favorito) {
        const { error } = await supabase
          .from("drink_favoritos")
          .delete()
          .eq("drink_id", drinkId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("drink_favoritos")
          .insert({ drink_id: drinkId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: favKey(user?.id, drinkId) });
      qc.invalidateQueries({ queryKey: ["favoritos", user?.id] });
      toast.success(favorito ? "Removido dos favoritos." : "Adicionado aos favoritos!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user && !loading) {
    return (
      <Button asChild variant="outline">
        <Link to="/auth">
          <Bookmark className="h-4 w-4 mr-2" /> Favoritar
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={favorito ? "default" : "outline"}
      onClick={() => toggle.mutate()}
      disabled={loading || toggle.isPending}
      aria-pressed={favorito}
    >
      <Bookmark className={`h-4 w-4 mr-2 ${favorito ? "fill-current" : ""}`} />
      {favorito ? "Favoritado" : "Favoritar"}
    </Button>
  );
}
