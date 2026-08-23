import type { DrinkComIngredientes } from "@/lib/queries";
import type { ItemBar } from "@/lib/meu-bar";

/**
 * Cobertura de uma receita pelo estoque do usuário (Meu Bar).
 *
 * Ingredientes considerados opcionais (guarnições, bitters, especiarias, gelo e
 * água) não impedem que a receita seja marcada como "dá para fazer" — eles são
 * listados separadamente como faltas opcionais.
 */
const CATEGORIAS_OPCIONAIS = new Set([
  "Especiarias & Guarnições",
  "Bitters",
]);

const NOMES_OPCIONAIS = ["gelo", "agua", "água", "agua com gas", "sal", "pimenta", "canela"];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function ingredienteOpcional(nome: string, categoria?: string | null): boolean {
  if (categoria && CATEGORIAS_OPCIONAIS.has(categoria)) return true;
  const n = norm(nome);
  return NOMES_OPCIONAIS.some((o) => n === norm(o));
}

export type IngredienteCobertura = {
  id: string;
  nome: string;
  tem: boolean;
  opcional: boolean;
};

export type Cobertura = {
  itens: IngredienteCobertura[];
  /** Faltas que realmente impedem o preparo. */
  faltando: IngredienteCobertura[];
  /** Faltas apenas de itens opcionais (guarnição, gelo etc.). */
  faltandoOpcionais: IngredienteCobertura[];
  /** true quando todos os ingredientes obrigatórios estão no estoque. */
  completo: boolean;
  /** Nome do único ingrediente obrigatório faltante, se faltar exatamente um. */
  falta1: string | null;
};

export function coberturaDrink(
  drink: DrinkComIngredientes,
  estoque: Set<string>,
): Cobertura {
  const itens: IngredienteCobertura[] = drink.drink_ingredientes.map((di) => {
    const nome = di.ingredientes?.nome ?? "Ingrediente";
    return {
      id: di.ingrediente_id,
      nome,
      tem: estoque.has(di.ingrediente_id),
      opcional: ingredienteOpcional(nome, di.ingredientes?.categorias?.nome ?? null),
    };
  });

  const faltando = itens.filter((i) => !i.tem && !i.opcional);
  const faltandoOpcionais = itens.filter((i) => !i.tem && i.opcional);

  return {
    itens,
    faltando,
    faltandoOpcionais,
    completo: itens.length > 0 && faltando.length === 0,
    falta1: faltando.length === 1 ? faltando[0]!.nome : null,
  };
}

/** Conjunto de ids de ingredientes presentes no estoque. */
export const idsDoEstoque = (estoque: ItemBar[] | undefined) =>
  new Set((estoque ?? []).map((i) => i.ingrediente_id));
