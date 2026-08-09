export const DRINK_SELECT =
  "id, nome, preparo, historia, dificuldade, imagem_url, drink_ingredientes(ingredientes(nome)), drink_drink_categorias(drink_categorias(nome))";

export type DrinkRow = {
  id: string;
  nome: string;
  preparo: string | null;
  historia: string | null;
  dificuldade: string | null;
  imagem_url: string | null;
  drink_ingredientes: { ingredientes: { nome: string } | null }[] | null;
  drink_drink_categorias: { drink_categorias: { nome: string } | null }[] | null;
};

export type DrinkFormatado = {
  id: string;
  nome: string;
  dificuldade: string | null;
  ingredientes: string[];
  categorias: string[];
  preparo: string | null;
  historia: string | null;
};

export function formatarDrink(d: DrinkRow): DrinkFormatado {
  return {
    id: d.id,
    nome: d.nome,
    dificuldade: d.dificuldade,
    ingredientes: (d.drink_ingredientes ?? [])
      .map((di) => di.ingredientes?.nome ?? "")
      .filter(Boolean),
    categorias: (d.drink_drink_categorias ?? [])
      .map((dc) => dc.drink_categorias?.nome ?? "")
      .filter(Boolean),
    preparo: d.preparo,
    historia: d.historia,
  };
}

export function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
