export const ORDENS_DRINKS = [
  { id: "nome-asc", nome: "Alfabética (A–Z)" },
  { id: "nome-desc", nome: "Alfabética (Z–A)" },
  { id: "facilidade", nome: "Mais fáceis primeiro" },
  { id: "ingredientes", nome: "Menos ingredientes primeiro" },
  { id: "curtidas", nome: "Mais curtidos" },
] as const;

export type OrdemDrinks = (typeof ORDENS_DRINKS)[number]["id"];

export const ORDEM_PADRAO: OrdemDrinks = "nome-asc";

export function ordemDrinksValida(valor: unknown): OrdemDrinks {
  return ORDENS_DRINKS.some((opcao) => opcao.id === valor)
    ? (valor as OrdemDrinks)
    : ORDEM_PADRAO;
}

export function nomeDaOrdem(ordem: OrdemDrinks): string {
  return ORDENS_DRINKS.find((opcao) => opcao.id === ordem)?.nome ?? ORDENS_DRINKS[0].nome;
}