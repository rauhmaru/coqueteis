import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import type { MouseEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const allFavKey = (userId: string | undefined) => ["favoritos-ids", userId ?? "anon"] as const;

export function useFavoritos() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: allFavKey(user?.id),
    enabled: !!user,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("drink_favoritos")
        .select("drink_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.drink_id));
    },
  });
  return q.data ?? new Set<string>();
}

export function FavoriteIconButton({
  drinkId,
  className = "",
}: {
  drinkId: string;
  className?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const favoritos = useFavoritos();
  const favorito = favoritos.has(drinkId);

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
      qc.invalidateQueries({ queryKey: allFavKey(user?.id) });
      qc.invalidateQueries({ queryKey: ["favoritos", user?.id] });
      qc.invalidateQueries({ queryKey: ["drink-favorito", user?.id, drinkId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Faça login para favoritar.");
      return;
    }
    toggle.mutate();
  };

  return (
    <button
      type="button"
      onClick={handle}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={toggle.isPending}
      aria-label={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorito}
      title={favorito ? "Remover dos favoritos" : "Favoritar"}
      className={`inline-flex items-center justify-center rounded-full h-8 w-8 backdrop-blur bg-background/70 border border-border hover:bg-background transition-colors ${
        favorito ? "text-primary" : "text-muted-foreground hover:text-primary"
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${favorito ? "fill-current" : ""}`} />
    </button>
  );
}
