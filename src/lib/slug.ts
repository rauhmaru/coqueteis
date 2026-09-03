/** Utilitários de URL amigável (slug) usados em rotas de drinks e categorias. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/** "Não alcoólicos" -> "nao-alcoolicos" */
/** Remove acentos, aplica minúsculas e corta espaços das pontas. */
export function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Caminho canônico de um drink: usa o slug quando existir. */
export function drinkParam(drink: { id: string; slug?: string | null }): string {
  return drink.slug?.trim() || drink.id;
}
