import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validarPublicacaoSelecionada } from "./drink-publication";

const alterarSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  publicar: z.boolean(),
});

export const listarDrinksParaRevisao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Acesso restrito a administradores.");
    const { data, error } = await context.supabase.from("drinks")
      .select("id, nome, slug, imagem_url, publicado, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const alterarPublicacaoDrinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => alterarSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("Acesso restrito a administradores.");
    const { data: drinks, error: fetchError } = await context.supabase.from("drinks")
      .select("id, publicado, imagem_url").in("id", data.ids);
    if (fetchError) throw new Error(fetchError.message);
    const erro = validarPublicacaoSelecionada(drinks ?? [], data.ids, data.publicar);
    if (erro) throw new Error(erro);
    const { data: atualizados, error } = await context.supabase.from("drinks")
      .update({ publicado: data.publicar })
      .in("id", data.ids)
      .eq("publicado", !data.publicar)
      .select("id");
    if (error) throw new Error(error.message);
    if (atualizados?.length !== data.ids.length) throw new Error("Algumas receitas mudaram durante a operação. Atualize a lista.");
    return { total: atualizados.length };
  });