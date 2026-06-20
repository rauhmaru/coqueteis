import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Martini, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Destilados & Coquetéis" },
      { name: "description", content: "Acesse sua conta para gerenciar drinks, ingredientes e categorias." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    router.invalidate();
    navigate({ to: "/", replace: true });
  };

  const cadastrar = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
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
      redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Falha no login com Google");
      return;
    }
    if (result.redirected) return;
    router.invalidate();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-2 group">
          <Martini className="h-7 w-7 text-primary group-hover:rotate-12 transition-transform" />
          <span className="font-serif text-2xl text-foreground">Destilados &amp; Coquetéis</span>
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <Tabs defaultValue="entrar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="space-y-4 pt-4">
              <form onSubmit={entrar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email-in">Email</Label>
                  <Input id="email-in" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-in">Senha</Label>
                  <Input id="senha-in" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar" className="space-y-4 pt-4">
              <form onSubmit={cadastrar} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome-up">Nome de exibição</Label>
                  <Input id="nome-up" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como devemos te chamar?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-up">Email</Label>
                  <Input id="email-up" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha-up">Senha</Label>
                  <Input id="senha-up" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
                </div>
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
