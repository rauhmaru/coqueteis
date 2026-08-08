import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sugerirIngrediente } from "@/lib/abv";
import { DOSE_PADRAO_ML } from "@/lib/perfil";

import type { DrinkComIngredientes } from "@/lib/queries";

export type ItemBar = {
  id: string;
  ingrediente_id: string;
  preco_garrafa: number | null;
  volume_garrafa_ml: number | null;
  observacoes: string | null;
  ingredientes: { id: string; nome: string; categorias?: { nome: string } | null } | null;
};

export const meuBarQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["meu-bar", userId],
    enabled: !!userId,
    queryFn: async (): Promise<ItemBar[]> => {
      const { data, error } = await supabase
        .from("meu_bar")
        .select(
          "id, ingrediente_id, preco_garrafa, volume_garrafa_ml, observacoes, ingredientes(id, nome, categorias(nome))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ItemBar[];
    },
  });


export type CustoIngrediente = {
  ingredienteId: string;
  nome: string;
  ml: number;
  custo: number | null;
};

export type DrinkAvaliado = {
  drink: DrinkComIngredientes;
  faltando: string[];
  /** custo estimado de uma unidade do drink (soma dos ingredientes com preço informado) */
  custo: number;
  /** true quando todos os ingredientes possuem preço e volume cadastrados */
  custoCompleto: boolean;
  componentes: CustoIngrediente[];
};

/** Custo por ml de um item do bar (null se faltar preço ou volume). */
export function custoPorMl(item: ItemBar): number | null {
  const preco = item.preco_garrafa;
  const volume = item.volume_garrafa_ml;
  if (!preco || !volume || preco <= 0 || volume <= 0) return null;
  return preco / volume;
}

/**
 * Cruza o estoque do usuário com o catálogo de drinks.
 * Retorna, para cada drink, quais ingredientes faltam e o custo estimado.
 * `doseMl` é o tamanho de dose configurado no perfil: as quantidades sugeridas
 * de cada ingrediente são proporcionais a ele (referência: 50 ml).
 */
export function avaliarDrinks(
  drinks: DrinkComIngredientes[],
  estoque: ItemBar[],
  doseMl: number = DOSE_PADRAO_ML,
): DrinkAvaliado[] {
  const fator = doseMl > 0 ? doseMl / DOSE_PADRAO_ML : 1;
  const porIngrediente = new Map<string, ItemBar>();
  estoque.forEach((i) => porIngrediente.set(i.ingrediente_id, i));

  return drinks.map((drink) => {
    const faltando: string[] = [];
    const componentes: CustoIngrediente[] = [];
    let custo = 0;
    let custoCompleto = drink.drink_ingredientes.length > 0;


    for (const di of drink.drink_ingredientes) {
      const nome = di.ingredientes?.nome ?? "Ingrediente";
      const item = porIngrediente.get(di.ingrediente_id);
      if (!item) {
        faltando.push(nome);
        custoCompleto = false;
        continue;
      }
      const ml = Math.round(sugerirIngrediente(nome).ml * fator);
      const porMl = custoPorMl(item);
      if (porMl === null) {
        custoCompleto = false;
        componentes.push({ ingredienteId: di.ingrediente_id, nome, ml, custo: null });
        continue;
      }
      const parcial = porMl * ml;
      custo += parcial;
      componentes.push({ ingredienteId: di.ingrediente_id, nome, ml, custo: parcial });
    }

    return { drink, faltando, custo, custoCompleto, componentes };
  });
}

export const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
