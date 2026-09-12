import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type CategoriaAdmin = {
  id: string;
  nome: string;
  created_at: string;
};

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

const nomeSchema = z
  .string()
  .trim()
  .min(2, "Informe um nome com pelo menos 2 caracteres.")
  .max(80, "O nome deve ter no máximo 80 caracteres.");

const categoriaSchema = z.object({
  id: z.string().uuid(),
  nome: nomeSchema,
});

const categoriaIdSchema = z.object({ id: z.string().uuid() });

export const listarCategoriasAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CategoriaAdmin[]> => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("categorias")
      .select("id, nome, created_at")
      .order("nome");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ nome: nomeSchema }).parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: categoria, error } = await context.supabase
      .from("categorias")
      .insert({ nome: data.nome })
      .select("id, nome, created_at")
      .single();
    if (error) throw new Error(error.message);
    return categoria;
  });

export const atualizarCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categoriaSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: categoria, error } = await context.supabase
      .from("categorias")
      .update({ nome: data.nome })
      .eq("id", data.id)
      .select("id, nome, created_at")
      .single();
    if (error) throw new Error(error.message);
    return categoria;
  });

export const removerCategoria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => categoriaIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("categorias").delete().eq("id", data.id);
    if (error) {
      if (error.code === "23503") {
        throw new Error("Esta categoria está vinculada a ingredientes e não pode ser removida.");
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });