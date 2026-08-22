import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUuid } from "@/lib/slug";


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
  slug: string | null;
  nome: string;
  preparo: string;
  passos: unknown;
  copo: string | null;
  metodo_preparo: string | null;
  guarnicao: string | null;
  historia: string | null;
  imagem_url: string | null;
  dificuldade: string;
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

/** Aceita o slug (URL amigável) ou o UUID antigo do drink. */
export const drinkQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: ["drinks", idOrSlug],
    queryFn: async (): Promise<DrinkComIngredientes | null> => {
      const coluna = isUuid(idOrSlug) ? "id" : "slug";
      const { data, error } = await supabase
        .from("drinks")
        .select(DRINK_SELECT)
        .eq(coluna, idOrSlug)
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

// URLs de imagem: ver src/lib/image-urls.ts (assinaturas em lote + cache).
export { getImageUrl, getCachedImageUrl, getStableImageUrl } from "@/lib/image-urls";
