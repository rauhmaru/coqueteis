import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2, Send, MessageCircle, Pencil, X, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Comentario = {
  id: string;
  user_id: string;
  texto: string;
  created_at: string;
};

type Autor = { display_name: string | null; email: string | null };
type Ordem = "relevantes" | "recentes";

const likesKey = (drinkId: string) => ["drink-likes", drinkId] as const;
const commentsKey = (drinkId: string) => ["drink-comentarios", drinkId] as const;
const commentLikesKey = (drinkId: string) => ["comentario-likes", drinkId] as const;

export function DrinkSocial({ drinkId }: { drinkId: string }) {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editTexto, setEditTexto] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Curtir drink
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
        .select("id, user_id, texto, created_at")
        .eq("drink_id", drinkId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Comentario[];
    },
  });

  const comentarios = comentariosQ.data ?? [];
  const comentarioIds = comentarios.map((c) => c.id);

  // Autores
  const userIds = Array.from(new Set(comentarios.map((c) => c.user_id)));
  const autoresQ = useQuery({
    queryKey: ["comentario-autores", userIds.sort().join(",")],
    enabled: userIds.length > 0,
    queryFn: async (): Promise<Record<string, Autor>> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);
      if (error) throw error;
      const map: Record<string, Autor> = {};
      for (const p of data ?? []) map[p.id] = { display_name: p.display_name, email: p.email };
      return map;
    },
  });

  // Curtidas dos comentários
  const commentLikesQ = useQuery({
    queryKey: [...commentLikesKey(drinkId), comentarioIds.sort().join(",")],
    enabled: comentarioIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comentario_likes")
        .select("comentario_id, user_id")
        .in("comentario_id", comentarioIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const likesPorComentario = useMemo(() => {
    const map: Record<string, { total: number; likedByMe: boolean }> = {};
    for (const id of comentarioIds) map[id] = { total: 0, likedByMe: false };
    for (const row of commentLikesQ.data ?? []) {
      const entry = map[row.comentario_id];
      if (!entry) continue;
      entry.total += 1;
      if (user && row.user_id === user.id) entry.likedByMe = true;
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentLikesQ.data, comentariosQ.data, user?.id]);

  const comentariosOrdenados = useMemo(() => {
    const arr = [...comentarios];
    if (ordem === "relevantes") {
      arr.sort((a, b) => {
        const la = likesPorComentario[a.id]?.total ?? 0;
        const lb = likesPorComentario[b.id]?.total ?? 0;
        if (lb !== la) return lb - la;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return arr;
  }, [comentarios, ordem, likesPorComentario]);

  const toggleCommentLike = useMutation({
    mutationFn: async (comentarioId: string) => {
      if (!user) throw new Error("Faça login para curtir.");
      const liked = likesPorComentario[comentarioId]?.likedByMe;
      if (liked) {
        const { error } = await supabase
          .from("comentario_likes")
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("comentario_likes")
          .insert({ comentario_id: comentarioId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: commentLikesKey(drinkId) }),
    onError: (e: Error) => toast.error(e.message),
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

  const editarComentario = useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { error } = await supabase
        .from("drink_comentarios")
        .update({ texto })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditandoId(null);
      setEditTexto("");
      qc.invalidateQueries({ queryKey: commentsKey(drinkId) });
      toast.success("Comentário atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removerComentario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drink_comentarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setConfirmId(null);
      qc.invalidateQueries({ queryKey: commentsKey(drinkId) });
      toast.success("Comentário removido.");
    },
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

  const salvarEdicao = (id: string) => {
    const t = editTexto.trim();
    if (!t) { toast.error("Comentário vazio."); return; }
    if (t.length > 1000) { toast.error("Máx. 1000 caracteres."); return; }
    editarComentario.mutate({ id, texto: t });
  };

  return (
    <section className="space-y-6 border-t border-border pt-8">
      {/* Curtir drink */}
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5" /> Comentários
          </h2>
          {comentarios.length > 1 && (
            <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setOrdem("recentes")}
                className={`px-3 py-1.5 transition-colors ${
                  ordem === "recentes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Mais recentes
              </button>
              <button
                type="button"
                onClick={() => setOrdem("relevantes")}
                className={`px-3 py-1.5 border-l border-border transition-colors ${
                  ordem === "relevantes"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Mais relevantes
              </button>
            </div>
          )}
        </div>

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
        ) : comentariosOrdenados.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum comentário ainda. Seja o primeiro!</p>
        ) : (
          <ul className="space-y-3">
            {comentariosOrdenados.map((c) => {
              const a = autoresQ.data?.[c.user_id];
              const autor = a?.display_name || a?.email || "Anônimo";
              const mine = user?.id === c.user_id;
              const stats = likesPorComentario[c.id] ?? { total: 0, likedByMe: false };
              const editando = editandoId === c.id;

              return (
                <li key={c.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{autor}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    {mine && !editando && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => { setEditandoId(c.id); setEditTexto(c.texto); }}
                          aria-label="Editar comentário"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setConfirmId(c.id)}
                          aria-label="Remover comentário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {editando ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={editTexto}
                        onChange={(e) => setEditTexto(e.target.value)}
                        rows={3}
                        maxLength={1000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{editTexto.length}/1000</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditandoId(null); setEditTexto(""); }}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => salvarEdicao(c.id)}
                            disabled={editarComentario.isPending || !editTexto.trim()}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">{c.texto}</p>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={stats.likedByMe ? "default" : "ghost"}
                      className="h-7 px-2"
                      disabled={!user || toggleCommentLike.isPending}
                      onClick={() => toggleCommentLike.mutate(c.id)}
                      aria-pressed={stats.likedByMe}
                    >
                      <Heart className={`h-3.5 w-3.5 mr-1 ${stats.likedByMe ? "fill-current" : ""}`} />
                      {stats.total}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover comentário?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && removerComentario.mutate(confirmId)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
