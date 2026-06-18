import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Categoria = { id: string; nome: string };
export type Ingrediente = {
  id: string;
  nome: string;
  categoria_id: string | null;
  quantidade: number;
  categorias?: { nome: string } | null;
};
export type Drink = {
  id: string;
  nome: string;
  preparo: string;
  imagem_url: string | null;
};
export type DrinkComIngredientes = Drink & {
  drink_ingredientes: { ingrediente_id: string; ingredientes: Ingrediente | null }[];
};

export const categoriasQuery = queryOptions({
  queryKey: ["categorias"],
  queryFn: async (): Promise<Categoria[]> => {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data ?? [];
  },
});

export const ingredientesQuery = queryOptions({
  queryKey: ["ingredientes"],
  queryFn: async (): Promise<Ingrediente[]> => {
    const { data, error } = await supabase
      .from("ingredientes")
      .select("*, categorias(nome)")
      .order("nome");
    if (error) throw error;
    return (data ?? []) as Ingrediente[];
  },
});

export const drinksQuery = queryOptions({
  queryKey: ["drinks"],
  queryFn: async (): Promise<DrinkComIngredientes[]> => {
    const { data, error } = await supabase
      .from("drinks")
      .select("*, drink_ingredientes(ingrediente_id, ingredientes(*, categorias(nome)))")
      .order("nome");
    if (error) throw error;
    return (data ?? []) as DrinkComIngredientes[];
  },
});

export const drinkQuery = (id: string) =>
  queryOptions({
    queryKey: ["drinks", id],
    queryFn: async (): Promise<DrinkComIngredientes | null> => {
      const { data, error } = await supabase
        .from("drinks")
        .select("*, drink_ingredientes(ingrediente_id, ingredientes(*, categorias(nome)))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as DrinkComIngredientes | null;
    },
  });

export const countsQuery = queryOptions({
  queryKey: ["counts"],
  queryFn: async () => {
    const [ing, drk] = await Promise.all([
      supabase.from("ingredientes").select("*", { count: "exact", head: true }),
      supabase.from("drinks").select("*", { count: "exact", head: true }),
    ]);
    return {
      ingredientes: ing.count ?? 0,
      drinks: drk.count ?? 0,
    };
  },
});

// Gera URL assinada (1 ano) para imagem do bucket privado
export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("drink-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error) return null;
  return data.signedUrl;
}
