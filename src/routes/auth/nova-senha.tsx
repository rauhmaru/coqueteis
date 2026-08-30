import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Martini, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/nova-senha")({
  head: () => ({
    meta: [
      { title: "Definir nova senha — Destilados & Coquetéis" },
      { name: "description", content: "Defina uma nova senha para acessar sua conta." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: NovaSenhaPage,
});

function NovaSenhaPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [busy, setBusy] = useState(false);
  const [validando, setValidando] = useState(true);
  const [sessaoValida, setSessaoValida] = useState(false);
  const [recEmail, setRecEmail] = useState("");
  const [recBusy, setRecBusy] = useState(false);
  const [recCooldown, setRecCooldown] = useState(0);

  useEffect(() => {
    if (recCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setRecCooldown((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recCooldown > 0]);

  const reenviarLink = async (e: FormEvent) => {
    e.preventDefault();
    if (recBusy || recCooldown > 0) return;
    setRecBusy(true);
    await supabase.auth.resetPasswordForEmail(recEmail, {
      redirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/nova-senha`
          : undefined,
    });
    setRecBusy(false);
    setRecCooldown(60);
    // Mensagem idêntica mesmo se o e-mail não existir (segurança).
    toast.success("Enviamos um link de recuperação para seu e-mail. Verifique a caixa de entrada.");
  };

  useEffect(() => {
    let mounted = true;

    // A sessão de recuperação chega via hash (#type=recovery) ou code exchange.
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (sess && event === "SIGNED_IN")) {
        setSessaoValida(true);
        setValidando(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) setSessaoValida(true);
      setValidando(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2 group">
          <Martini className="h-7 w-7 text-primary group-hover:rotate-12 transition-transform" />
          <span className="font-serif text-2xl text-foreground">Destilados &amp; Coquetéis</span>
        </Link>

        <h1 className="text-center font-serif text-2xl text-foreground">Definir nova senha</h1>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          {validando ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando seu link de recuperação…
            </p>
          ) : !sessaoValida ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                O link de recuperação é inválido ou já expirou. Informe seu e-mail para receber um novo link.
              </p>
              <form onSubmit={reenviarLink} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label htmlFor="email-reenvio">Email</Label>
                  <Input
                    id="email-reenvio"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={recBusy || recCooldown > 0} className="w-full">
                  {recBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {recBusy
                    ? "Enviando…"
                    : recCooldown > 0
                      ? `Aguarde ${recCooldown}s para reenviar`
                      : "Reenviar link de recuperação"}
                </Button>
              </form>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={salvar} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nova-senha">Nova senha</Label>
                <Input
                  id="nova-senha"
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  required
                  minLength={6}
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar nova senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
