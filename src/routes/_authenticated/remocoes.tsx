import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/remocoes")({
  head: () => ({
    meta: [
      { title: "Log de remoções de receitas | Gestão de Coquetéis" },
      {
        name: "description",
        content:
          "Registro interno das receitas removidas do catálogo, com usuário, data e motivo informado.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Log de remoções de receitas" },
      {
        property: "og:description",
        content: "Auditoria de remoções de drinks: usuário, data, receita e motivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RemocoesPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">Erro: {error.message}</div>
  ),
});

export type RemocaoLog = {
  id: string;
  drink_nome: string;
  drink_slug: string | null;
  motivo: string;
  removido_por_email: string | null;
  created_at: string;
};

export function useRemocoesLog(enabled = true) {
  return useQuery({
    queryKey: ["remocoes-log"],
    enabled,
    queryFn: async (): Promise<RemocaoLog[]> => {
      const { data, error } = await supabase
        .from("drink_remocoes_log")
        .select("id, drink_nome, drink_slug, motivo, removido_por_email, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function RemocoesPage() {
  const { isAdmin } = useAuth();
  const { data, isLoading, error } = useRemocoesLog(isAdmin);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl flex items-center gap-2">
            <History className="h-7 w-7 text-primary" aria-hidden="true" /> Log de remoções
          </h1>
          <p className="text-muted-foreground text-sm">
            Histórico das receitas removidas do catálogo, com usuário, data e motivo.
          </p>
        </header>

        {!isAdmin && (
          <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Apenas administradores podem visualizar o log de remoções.
          </p>
        )}

        {isAdmin && isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Carregando registros…
          </p>
        )}

        {isAdmin && error && (
          <p className="text-sm text-destructive">Erro ao carregar: {error.message}</p>
        )}

        {isAdmin && data && data.length === 0 && (
          <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Nenhuma remoção registrada até agora.
          </p>
        )}

        {isAdmin && data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{r.drink_nome}</span>
                  <Badge variant="outline">{fmt(r.created_at)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Removido por: {r.removido_por_email ?? "usuário desconhecido"}
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Motivo: </span>
                  {r.motivo}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
