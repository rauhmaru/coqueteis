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
  drink_ingredientes: {
    ingrediente_id: string;
    opcional?: boolean | null;
    unidade?: string | null;
    ingredientes: Ingrediente | null;
  }[];
  drink_drink_categorias: { categoria_id: string; drink_categorias: DrinkCategoria | null }[];
};

/**
 * Projeção enxuta usada em todas as listagens (catálogo, home, carta, busca).
 * Só traz as colunas dos cards + os vínculos mínimos para busca e cruzamento
 * com o estoque. A consulta completa fica na página de detalhe da receita.
 */
export type DrinkLista = {
  id: string;
  slug: string | null;
  nome: string;
  imagem_url: string | null;
  dificuldade: string;
  created_by: string | null;
  /** contagem agregada na view drinks_lista (sem trazer todos os vínculos) */
  total_ingredientes?: number;
  drink_ingredientes: {
    ingrediente_id: string;
    ingredientes: { id: string; nome: string; categorias?: { nome: string } | null } | null;
  }[];
  drink_drink_categorias: { categoria_id: string; drink_categorias: DrinkCategoria | null }[];
};

/** Cache compartilhado: navegar entre catálogo e receita não refaz a consulta. */
const CACHE_DRINKS = { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 };


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

/** Consulta completa — exclusiva da página de detalhe da receita. */
const DRINK_SELECT =
  "*, drink_ingredientes(ingrediente_id, opcional, ingredientes(*, categorias(nome))), drink_drink_categorias(categoria_id, drink_categorias(id, nome))";

/** Projeção explícita das listagens: nada de select=* nem colunas de texto longo. */
const DRINK_LISTA_SELECT =
  "id, slug, nome, imagem_url, dificuldade, created_by, total_ingredientes, drink_ingredientes(ingrediente_id, ingredientes(id, nome, categorias(nome))), drink_drink_categorias(categoria_id, drink_categorias(id, nome))";

export const drinksQuery = queryOptions({
  queryKey: ["drinks", "lista"],
  ...CACHE_DRINKS,
  queryFn: async (): Promise<DrinkLista[]> => {
    const { data, error } = await supabase
      .from("drinks_lista")
      .select(DRINK_LISTA_SELECT)
      .order("nome");
    if (error) throw error;
    return (data ?? []) as unknown as DrinkLista[];
  },
});


/** Aceita o slug (URL amigável) ou o UUID antigo do drink. */
export const drinkQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: ["drinks", "detalhe", idOrSlug],
    ...CACHE_DRINKS,

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

export type DrinkFiltrosServidor = {
  ingredientes: string[];
  categorias: string[];
  dificuldades: string[];
  qtd: number | null;
  comparador: string;
};

export type DrinksPagina = { total: number; drinks: DrinkLista[] };

/**
 * Busca paginada no banco: filtros aplicados no servidor e projeção enxuta
 * (buscar_drinks_lista) — sem textos longos nem colunas fora do card.
 */
export const drinksPaginaQuery = (filtros: DrinkFiltrosServidor, limite: number) =>
  queryOptions({
    queryKey: ["drinks", "pagina", filtros, limite],
    ...CACHE_DRINKS,
    queryFn: async (): Promise<DrinksPagina> => {
      const { data, error } = await supabase.rpc("buscar_drinks_lista" as "buscar_drinks", {
        _ingredientes: filtros.ingredientes,
        _categorias: filtros.categorias,
        _dificuldades: filtros.dificuldades,
        _qtd: filtros.qtd ?? undefined,
        _comparador: filtros.comparador,
        _limite: limite,
        _offset: 0,
      });
      if (error) throw error;
      const r = (data ?? { total: 0, drinks: [] }) as unknown as DrinksPagina;
      return { total: r.total ?? 0, drinks: r.drinks ?? [] };
    },

  });

export type DrinkIndice = {
  id: string;
  dificuldade: string;
  ingredientes: string[];
  categorias: string[];
};

/** Índice leve (sem textos/imagens) usado para contar receitas por ingrediente nos filtros. */
export const drinksIndiceQuery = queryOptions({
  queryKey: ["drinks", "indice"],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<DrinkIndice[]> => {
    const { data, error } = await supabase
      .from("drinks")
      .select("id, dificuldade, drink_ingredientes(ingrediente_id), drink_drink_categorias(categoria_id)");
    if (error) throw error;
    return (data ?? []).map((d: any) => ({
      id: d.id as string,
      dificuldade: d.dificuldade as string,
      ingredientes: (d.drink_ingredientes ?? []).map((x: any) => x.ingrediente_id as string),
      categorias: (d.drink_drink_categorias ?? []).map((x: any) => x.categoria_id as string),
    }));
  },
});
