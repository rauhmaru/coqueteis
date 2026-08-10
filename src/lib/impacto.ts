import type { DrinkAvaliado, ItemBar } from "@/lib/meu-bar";
import { normalizar } from "@/lib/abv";

export type ImpactoIngrediente = {
  /** chave normalizada do ingrediente faltante */
  chave: string;
  nome: string;
  /** receitas que passam a ser possíveis com a compra deste único ingrediente */
  drinks: { id: string; nome: string }[];
  /** preço médio estimado com base nas garrafas já cadastradas (null se não houver base) */
  precoEstimado: number | null;
  /** soma do custo por dose das receitas desbloqueadas (parcial quando faltam preços) */
  valorDesbloqueado: number;
};

/** Preço médio das garrafas já cadastradas — usado como estimativa de compra. */
export function precoMedioGarrafa(estoque: ItemBar[]): number | null {
  const precos = estoque
    .map((i) => i.preco_garrafa)
    .filter((p): p is number => typeof p === "number" && p > 0);
  if (precos.length === 0) return null;
  return precos.reduce((s, p) => s + p, 0) / precos.length;
}

/**
 * Agrupa as receitas "quase lá" pelo ingrediente que falta e ordena por impacto:
 * quantas receitas cada compra desbloqueia (desempate por valor e nome).
 */
export function agruparPorImpacto(
  quaseLa: DrinkAvaliado[],
  estoque: ItemBar[],
): ImpactoIngrediente[] {
  const precoEstimado = precoMedioGarrafa(estoque);
  const mapa = new Map<string, ImpactoIngrediente>();

  for (const a of quaseLa) {
    const nome = a.faltando[0];
    if (!nome) continue;
    const chave = normalizar(nome);
    const atual =
      mapa.get(chave) ??
      ({ chave, nome, drinks: [], precoEstimado, valorDesbloqueado: 0 } as ImpactoIngrediente);
    atual.drinks.push({ id: a.drink.id, nome: a.drink.nome });
    atual.valorDesbloqueado += a.custo;
    mapa.set(chave, atual);
  }

  return [...mapa.values()]
    .map((i) => ({
      ...i,
      drinks: [...i.drinks].sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR")),
    }))
    .sort(
      (a, b) =>
        b.drinks.length - a.drinks.length ||
        b.valorDesbloqueado - a.valorDesbloqueado ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
}
