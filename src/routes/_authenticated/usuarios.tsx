import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, ShieldOff, UserCog } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listarUsuarios, definirRole } from "@/lib/usuarios.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Destilados & Coquetéis" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const listar = useServerFn(listarUsuarios);
  const definir = useServerFn(definirRole);
  const [busyId, setBusyId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listar(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="font-serif text-3xl text-foreground">Acesso restrito</h1>
          <p className="text-muted-foreground mt-2">Apenas administradores podem gerenciar usuários.</p>
        </main>
      </div>
    );
  }

  const toggle = async (userId: string, role: "admin" | "editor", conceder: boolean) => {
    setBusyId(userId + role);
    try {
      await definir({ data: { userId, role, conceder } });
      toast.success(conceder ? `Papel "${role}" concedido.` : `Papel "${role}" removido.`);
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-foreground flex items-center gap-3">
            <UserCog className="h-7 w-7 text-primary" /> Usuários
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as permissões da sua equipe. <strong>Editor</strong> pode criar, editar e remover itens.
            <strong> Administrador</strong> pode tudo, inclusive gerenciar usuários. Usuários sem papel ficam em modo somente leitura.
          </p>
        </div>

        {query.isLoading ? (
          <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Carregando…</div>
        ) : query.error ? (
          <div className="p-8 text-center text-destructive">Erro: {(query.error as Error).message}</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Usuário</th>
                  <th className="text-left px-4 py-3">Papéis</th>
                  <th className="px-4 py-3 w-72 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(query.data ?? []).map((u) => {
                  const isAdminU = u.roles.includes("admin");
                  const isEditorU = u.roles.includes("editor");
                  const self = u.id === user?.id;
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-secondary/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.display_name || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email}{self && " · você"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {isAdminU && <Badge>admin</Badge>}
                          {isEditorU && <Badge variant="secondary">editor</Badge>}
                          {u.roles.length === 0 && <Badge variant="outline">somente leitura</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          size="sm"
                          variant={isEditorU ? "outline" : "secondary"}
                          disabled={busyId === u.id + "editor"}
                          onClick={() => toggle(u.id, "editor", !isEditorU)}
                        >
                          {isEditorU ? <><ShieldOff className="h-3.5 w-3.5 mr-1" />Remover editor</> : <><Shield className="h-3.5 w-3.5 mr-1" />Tornar editor</>}
                        </Button>
                        <Button
                          size="sm"
                          variant={isAdminU ? "outline" : "default"}
                          disabled={busyId === u.id + "admin"}
                          onClick={() => toggle(u.id, "admin", !isAdminU)}
                        >
                          {isAdminU ? <><ShieldOff className="h-3.5 w-3.5 mr-1" />Remover admin</> : <><Shield className="h-3.5 w-3.5 mr-1" />Tornar admin</>}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
