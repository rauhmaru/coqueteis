import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Send, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Comentario = {
  id: string;
  user_id: string;
  texto: string;
  created_at: string;
  profiles: { display_name: string | null; email: string | null } | null;
};

const likesKey = (drinkId: string) => ["drink-likes", drinkId] as const;
const commentsKey = (drinkId: string) => ["drink-comentarios", drinkId] as const;

export function DrinkSocial({ drinkId }: { drinkId: string }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");

  // Likes
  const likesQ = useQuery({
    queryKey: likesKey(drinkId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drink_likes")
        .select("user_id")
        .eq("drink_id", drinkId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const total = likesQ.data?.length ?? 0;
  const liked = !!user && !!likesQ.data?.some((l) => l.user_id === user.id);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login para curtir.");
      if (liked) {
        const { error } = await supabase
          .from("drink_likes")
          .delete()
          .eq("drink_id", drinkId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("drink_likes")
          .insert({ drink_id: drinkId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: likesKey(drinkId) }),
    onError: (e: Error) => toast.error(e.message),
  });

  // Comentários
  const comentariosQ = useQuery({
    queryKey: commentsKey(drinkId),
    queryFn: async (): Promise<Comentario[]> => {
      const { data, error } = await supabase
        .from("drink_comentarios")
        .select("id, user_id, texto, created_at, profiles(display_name, email)")
        .eq("drink_id", drinkId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Comentario[];
    },
  });

  const criarComentario = useMutation({
    mutationFn: async (t: string) => {
      if (!user) throw new Error("Faça login para comentar.");
      const { error } = await supabase
        .from("drink_comentarios")
        .insert({ drink_id: drinkId, user_id: user.id, texto: t });
      if (error) throw error;
    },
    onSuccess: () => {
      setTexto("");
      qc.invalidateQueries({ queryKey: commentsKey(drinkId) });
      toast.success("Comentário publicado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removerComentario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drink_comentarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentsKey(drinkId) }),
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    if (t.length > 1000) {
      toast.error("Comentário muito longo (máx. 1000 caracteres).");
      return;
    }
    criarComentario.mutate(t);
  };

  return (
    <section className="space-y-6 border-t border-border pt-8">
      {/* Curtir */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={liked ? "default" : "outline"}
          size="sm"
          disabled={loading || toggleLike.isPending || !user}
          onClick={() => toggleLike.mutate()}
          aria-pressed={liked}
        >
          <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`} />
          {liked ? "Curtido" : "Curtir"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "curtida" : "curtidas"}
        </span>
        {!user && !loading && (
          <span className="text-xs text-muted-foreground ml-auto">
            <Link to="/auth" className="text-primary underline">Entre</Link> para curtir e comentar
          </span>
        )}
      </div>

      {/* Comentários */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5" /> Comentários
        </h2>

        {user ? (
          <form onSubmit={onSubmit} className="space-y-2">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Compartilhe sua experiência com esse drink..."
              rows={3}
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{texto.length}/1000</span>
              <Button type="submit" size="sm" disabled={criarComentario.isPending || !texto.trim()}>
                <Send className="h-3.5 w-3.5 mr-2" /> Publicar
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary underline">Faça login</Link> para comentar.
          </p>
        )}

        {comentariosQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando comentários...</p>
        ) : (comentariosQ.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          <ul className="space-y-3">
            {comentariosQ.data!.map((c) => {
              const autor = c.profiles?.display_name || c.profiles?.email || "Anônimo";
              const mine = user?.id === c.user_id;
              return (
                <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{autor}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    {mine && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removerComentario.mutate(c.id)}
                        aria-label="Remover comentário"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{c.texto}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
