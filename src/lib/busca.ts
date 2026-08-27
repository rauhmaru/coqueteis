import type { DrinkLista } from "@/lib/queries";

/** Normalização única (acentos + caixa) usada por toda a busca do site. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Casa o termo com nome, categorias ou ingredientes do drink. */
export function combina(drink: DrinkLista, termo: string): boolean {
  return pontuar(drink, norm(termo.trim())) > 0;
}

function pontuar(d: DrinkLista, q: string): number {
  if (!q) return 0;
  const nome = norm(d.nome);
  if (nome.startsWith(q)) return 4;
  if (nome.includes(q)) return 3;
  if (d.drink_drink_categorias.some((c) => norm(c.drink_categorias?.nome ?? "").includes(q))) return 2;
  if (d.drink_ingredientes.some((i) => norm(i.ingredientes?.nome ?? "").includes(q))) return 1;
  return 0;
}

/** Busca por nome, categoria ou ingrediente, ordenada por relevância. */
export function buscarDrinks<T extends DrinkLista>(
  drinks: T[],
  termo: string,
  limite?: number,
): T[] {
  const q = norm(termo.trim());
  if (!q) return [];
  const resultado = drinks
    .map((d) => ({ d, score: pontuar(d, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.d.nome.localeCompare(b.d.nome, "pt-BR"))
    .map((x) => x.d);
  return typeof limite === "number" ? resultado.slice(0, limite) : resultado;
}
