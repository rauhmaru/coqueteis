import type { DrinkCategoria, DrinkFiltrosServidor, Ingrediente } from "@/lib/queries";
import { ordemDrinksValida, type OrdemDrinks } from "@/lib/ordenacao-drinks";
import { slugify } from "@/lib/slug";

export type DrinkFilterSearch = {
  ing?: string;
  dif?: string;
  cat?: string;
  qtd?: number;
  comp?: "ate" | "acima";
  q?: string;
  pagina?: number;
  estoque?: boolean;
  ordem?: OrdemDrinks;
};

const lista = (valor: unknown) =>
  typeof valor === "string"
    ? [...new Set(valor.split(",").map((item) => item.trim()).filter(Boolean))]
    : [];

const listaParam = (valor: unknown) => lista(valor).join(",") || undefined;

export function validarBuscaDrinks(search: Record<string, unknown>): DrinkFilterSearch {
  const pagina = Number(search["pagina"]);
  const qtd = Number(search["qtd"]);
  const comp = search["comp"];
  const estoque = search["estoque"] === true || search["estoque"] === "1";
  return {
    ing: listaParam(search["ing"]),
    dif: listaParam(search["dif"]),
    cat: listaParam(search["cat"]),
    qtd: Number.isFinite(qtd) && qtd >= 1 ? Math.min(Math.floor(qtd), 100) : undefined,
    comp: comp === "ate" || comp === "acima" ? comp : undefined,
    q: typeof search["q"] === "string" ? search["q"].slice(0, 100) : undefined,
    pagina: Number.isFinite(pagina) && pagina >= 1 ? Math.min(Math.floor(pagina), 100) : 1,
    ...(estoque ? { estoque: true } : {}),
    ordem: ordemDrinksValida(search["ordem"]),
  };
}

const idsPorTokens = <T extends { id: string; nome: string }>(valor: string | undefined, itens: T[]) => {
  const tokens = new Set(lista(valor));
  return itens.filter((item) => tokens.has(item.id) || tokens.has(slugify(item.nome))).map((item) => item.id);
};

export function filtrosDaBusca(
  search: DrinkFilterSearch,
  ingredientes: Ingrediente[],
  categorias: DrinkCategoria[],
  categoriasFixas: string[] = [],
): DrinkFiltrosServidor {
  return {
    ingredientes: idsPorTokens(search.ing, ingredientes),
    categorias: [...new Set([...categoriasFixas, ...idsPorTokens(search.cat, categorias)])],
    dificuldades: lista(search.dif)
      .map((token) => ["Fácil", "Médio", "Difícil"].find((item) => token === item || token === slugify(item)))
      .filter((item): item is string => Boolean(item)),
    qtd: search.qtd ?? null,
    comparador: search.comp ?? "igual",
  };
}

export function parametrosDosFiltros(
  filtros: DrinkFiltrosServidor,
  ingredientes: Ingrediente[],
  categorias: DrinkCategoria[],
  categoriasIgnoradas: string[] = [],
) {
  const ignoradas = new Set(categoriasIgnoradas);
  const ingredientePorId = new Map(ingredientes.map((item) => [item.id, slugify(item.nome)]));
  const categoriaPorId = new Map(categorias.map((item) => [item.id, slugify(item.nome)]));
  const juntar = (valores: (string | undefined)[]) => valores.filter(Boolean).join(",") || undefined;
  return {
    ing: juntar(filtros.ingredientes.map((id) => ingredientePorId.get(id))),
    dif: juntar(filtros.dificuldades.map(slugify)),
    cat: juntar(filtros.categorias.filter((id) => !ignoradas.has(id)).map((id) => categoriaPorId.get(id))),
    qtd: filtros.qtd ?? undefined,
    comp: filtros.qtd !== null && filtros.comparador !== "igual" ? filtros.comparador as "ate" | "acima" : undefined,
  };
}