import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Categoria = { id: string; nome: string };
export type Ingrediente = {
  id: string;
  nome: string;
  categoria_id: string | null;
  quantidade: number;
  created_by: string | null;
  categorias?: { nome: string } | null;
};
export type DrinkCategoria = { id: string; nome: string };
export type Drink = {
  id: string;
  nome: string;
  preparo: string;
  imagem_url: string | null;
  created_by: string | null;
};
export type DrinkComIngredientes = Drink & {
  drink_ingredientes: { ingrediente_id: string; ingredientes: Ingrediente | null }[];
  drink_drink_categorias: { categoria_id: string; drink_categorias: DrinkCategoria | null }[];
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

const DRINK_SELECT =
  "*, drink_ingredientes(ingrediente_id, ingredientes(*, categorias(nome))), drink_drink_categorias(categoria_id, drink_categorias(id, nome))";

export const drinksQuery = queryOptions({
  queryKey: ["drinks"],
  queryFn: async (): Promise<DrinkComIngredientes[]> => {
    const { data, error } = await supabase
      .from("drinks")
      .select(DRINK_SELECT)
      .order("nome");
    if (error) throw error;
    return (data ?? []) as unknown as DrinkComIngredientes[];
  },
});

export const drinkQuery = (id: string) =>
  queryOptions({
    queryKey: ["drinks", id],
    queryFn: async (): Promise<DrinkComIngredientes | null> => {
      const { data, error } = await supabase
        .from("drinks")
        .select(DRINK_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DrinkComIngredientes | null;
    },
  });

export const drinkCategoriasQuery = queryOptions({
  queryKey: ["drink_categorias"],
  queryFn: async (): Promise<DrinkCategoria[]> => {
    const { data, error } = await supabase
      .from("drink_categorias")
      .select("id, nome")
      .order("nome");
    if (error) throw error;
    return data ?? [];
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
