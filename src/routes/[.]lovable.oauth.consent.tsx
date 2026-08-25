import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Martini, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthDetails = {
  client?: { name?: string } | null;
  redirect_url?: string;
  redirect_to?: string;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("authorization_id ausente");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { redirect: next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-16 text-center">
      <h1 className="font-serif text-2xl text-foreground">Não foi possível carregar a autorização</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nomeCliente = details?.client?.name ?? "este aplicativo";

  async function decidir(aprovar: boolean) {
    setBusy(true);
    setErro(null);
    const { data, error } = aprovar
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErro(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setErro("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl border border-border bg-card/40 p-6 text-center">
        <Martini className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-2xl text-foreground">
          Conectar {nomeCliente} à sua conta
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {nomeCliente} poderá consultar receitas, seus favoritos e o seu bar, agindo como você em
          Destilados &amp; Coquetéis. Você pode revogar o acesso quando quiser.
        </p>
        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button className="min-h-11 flex-1" disabled={busy} onClick={() => decidir(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Autorizar"}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 flex-1"
            disabled={busy}
            onClick={() => decidir(false)}
          >
            Recusar
          </Button>
        </div>
      </div>
    </main>
  );
}
