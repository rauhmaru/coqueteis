import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type MixologiaPostagem = Database["public"]["Tables"]["mixologia_postagens"]["Row"];
export type MixologiaPostagemResumo = Pick<
  MixologiaPostagem,
  "id" | "titulo" | "slug" | "resumo" | "imagem_url" | "imagem_alt" | "publicado_em" | "updated_at"
>;

const idSchema = z.object({ id: z.string().uuid() });
const slugSchema = z.object({ slug: z.string().trim().min(1).max(140) });
const postagemSchema = z.object({
  id: z.string().uuid().optional(),
  titulo: z.string().trim().min(3).max(120),
  slug: z.string().trim().max(140),
  resumo: z.string().trim().min(10).max(220),
  conteudo_markdown: z.string().trim().min(20).max(100_000),
  imagem_url: z.string().trim().max(1_000),
  imagem_alt: z.string().trim().max(180),
  publicado: z.boolean(),
});

async function ensureAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listarPostagensPublicadas = createServerFn({ method: "GET" }).handler(
  async (): Promise<MixologiaPostagemResumo[]> => {
    const { data, error } = await publicClient()
      .from("mixologia_postagens")
      .select("id, titulo, slug, resumo, imagem_url, imagem_alt, publicado_em, updated_at")
      .eq("publicado", true)
      .order("publicado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const obterPostagemPublicada = createServerFn({ method: "GET" })
  .validator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }): Promise<MixologiaPostagem | null> => {
    const { data: postagem, error } = await publicClient()
      .from("mixologia_postagens")
      .select("id, titulo, slug, resumo, conteudo_markdown, imagem_url, imagem_alt, publicado, publicado_em, created_by, created_at, updated_at")
      .eq("slug", data.slug)
      .eq("publicado", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return postagem;
  });

export const listarPostagensAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MixologiaPostagem[]> => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("mixologia_postagens")
      .select("id, titulo, slug, resumo, conteudo_markdown, imagem_url, imagem_alt, publicado, publicado_em, created_by, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const salvarPostagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => postagemSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    if (data.publicado && (!data.imagem_url || data.imagem_alt.length < 3)) {
      throw new Error("Informe a imagem e o texto alternativo antes de publicar.");
    }
    const values = {
      titulo: data.titulo,
      slug: data.slug,
      resumo: data.resumo,
      conteudo_markdown: data.conteudo_markdown,
      imagem_url: data.imagem_url || null,
      imagem_alt: data.imagem_alt || null,
      publicado: data.publicado,
    };
    const query = data.id
      ? context.supabase.from("mixologia_postagens").update(values).eq("id", data.id)
      : context.supabase.from("mixologia_postagens").insert({ ...values, created_by: context.userId });
    const { data: postagem, error } = await query
      .select("id, titulo, slug, resumo, conteudo_markdown, imagem_url, imagem_alt, publicado, publicado_em, created_by, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return postagem;
  });

export const removerPostagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("mixologia_postagens").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });