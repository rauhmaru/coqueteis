import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Martini, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { caminhoInternoSeguro, mensagemRedirect } from "@/lib/auth-redirect";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const destino = caminhoInternoSeguro(s.redirect) ?? caminhoInternoSeguro(s.next);
    return destino ? { redirect: destino } : {};
  },

  head: () => ({
    meta: [
      { title: "Entrar — Destilados & Coquetéis" },
      { name: "description", content: "Acesse sua conta para gerenciar drinks, ingredientes e categorias." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: AuthPage,
});

const SENHA_MIN = 8;

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string | null;
}

function PasswordField({ id, label, value, onChange, autoComplete, error }: PasswordFieldProps) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={mostrar ? "text" : "password"}
          required
          minLength={SENHA_MIN}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "border-destructive pr-10" : "pr-10"}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-erro` : undefined}
        />
        <button
          type="button"
          onClick={() => setMostrar((v) => !v)}
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const { redirect: next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);
  const [erros, setErros] = useState<{ senha?: string; confirmar?: string }>({});

  const irParaDestino = () => {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/", replace: true });
  };

  useEffect(() => {
    if (!loading && user) {
      if (next) window.location.href = next;
      else navigate({ to: "/", replace: true });
    }
  }, [user, loading, navigate, next]);

  const [recOpen, setRecOpen] = useState(false);
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

  const validarSenha = (valor: string) => {
    if (valor.length < SENHA_MIN) {
      return `A senha deve ter pelo menos ${SENHA_MIN} caracteres.`;
    }
    return "";
  };

  const recuperarSenha = async (e: FormEvent) => {
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
    setRecOpen(false);
    setRecCooldown(60);
    // Mensagem idêntica mesmo se o e-mail não existir (segurança).
    toast.success("Enviamos um link de recuperação para seu e-mail. Verifique a caixa de entrada.");
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    const erroSenha = validarSenha(senha);
    if (erroSenha) {
      setErros({ senha: erroSenha });
      return;
    }
    setErros({});
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    router.invalidate();
    irParaDestino();
  };

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault();
    const erroSenha = validarSenha(senha);
    const erroConfirmar = senha !== confirmarSenha ? "As senhas não coincidem." : "";
    if (erroSenha || erroConfirmar) {
      setErros({ senha: erroSenha || undefined, confirmar: erroConfirmar || undefined });
      return;
    }
    setErros({});
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}${next ?? ""}`
            : undefined,
        data: { display_name: nome || email },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada! Verifique seu email para confirmar (se exigido) e faça login.");
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri:
        typeof window !== "undefined" ? `${window.location.origin}${next ?? ""}` : undefined,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Falha no login com Google");
      return;
    }
    if (result.redirected) return;
    router.invalidate();
    irParaDestino();
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2 group">
          <Martini className="h-7 w-7 text-primary group-hover:rotate-12 transition-transform" />
          <span className="font-serif text-2xl text-foreground">Destilados &amp; Coquetéis</span>
        </Link>

        <h1 className="text-center font-serif text-2xl text-foreground">Acesse sua conta</h1>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          {next ? (
            <p
              role="status"
              className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground"
            >
              {mensagemRedirect(next)}
            </p>
          ) : null}

          <Tabs defaultValue="entrar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="space-y-4 pt-4">
              <form onSubmit={entrar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-in">Email</Label>
                  <Input
                    id="email-in"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <PasswordField
                  id="senha-in"
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  autoComplete="current-password"
                  error={erros.senha}
                />
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecEmail(email);
                      setRecOpen(true);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Entrar
                </Button>
              </form>

              <Dialog open={recOpen} onOpenChange={setRecOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Recuperar senha</DialogTitle>
                    <DialogDescription>
                      Informe o e-mail da sua conta e enviaremos um link para definir uma nova senha.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={recuperarSenha} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-rec">Email</Label>
                      <Input
                        id="email-rec"
                        type="email"
                        required
                        value={recEmail}
                        onChange={(e) => setRecEmail(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={recBusy} className="w-full">
                      {recBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Enviar link de recuperação
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="criar" className="space-y-4 pt-4">
              <form onSubmit={cadastrar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome-up">Nome de exibição</Label>
                  <Input
                    id="nome-up"
                    name="name"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como devemos te chamar?"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input
                    id="email-up"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <PasswordField
                  id="senha-up"
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  autoComplete="new-password"
                  error={erros.senha}
                />
                <PasswordField
                  id="confirmar-senha-up"
                  label="Confirmar senha"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  autoComplete="new-password"
                  error={erros.confirmar}
                />
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button variant="outline" type="button" disabled={busy} onClick={google} className="w-full">
            Continuar com Google
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Visitantes podem navegar e visualizar todo o catálogo sem entrar. Faça login para criar, editar ou remover itens.
        </p>
        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
