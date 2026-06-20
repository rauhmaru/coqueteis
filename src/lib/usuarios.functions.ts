import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type UsuarioRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  roles: ("admin" | "editor")[];
};

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioRow[]> => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, created_at")
      .order("created_at", { ascending: true });
    if (pErr) throw new Error(pErr.message);

    const { data: rolesRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const rolesMap = new Map<string, ("admin" | "editor")[]>();
    for (const r of rolesRows ?? []) {
      const list = rolesMap.get(r.user_id) ?? [];
      list.push(r.role as "admin" | "editor");
      rolesMap.set(r.user_id, list);
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      created_at: p.created_at,
      roles: rolesMap.get(p.id) ?? [],
    }));
  });

function validarToggle(input: unknown) {
  const i = input as { userId?: unknown; role?: unknown; conceder?: unknown };
  if (typeof i.userId !== "string" || !i.userId) throw new Error("userId obrigatório");
  if (i.role !== "admin" && i.role !== "editor") throw new Error("role inválido");
  if (typeof i.conceder !== "boolean") throw new Error("conceder obrigatório");
  return { userId: i.userId, role: i.role as "admin" | "editor", conceder: i.conceder };
}

export const definirRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarToggle)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.conceder) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !/duplicate/i.test(error.message)) throw new Error(error.message);
    } else {
      // Impede o admin de remover o próprio papel admin se for o último admin
      if (data.role === "admin" && data.userId === context.userId) {
        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) throw new Error("Você é o último administrador — não é possível remover.");
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
