/**
 * Normalização de nomes de ingredientes no cadastro/edição.
 * Espelha a regra do banco (índice único sobre slugify(nome)):
 * - remove espaços extras e colapsa múltiplos espaços
 * - primeira letra maiúscula, demais preservadas (nomes próprios/marcas)
 */
export function normalizarNomeIngrediente(nome: string): string {
  const limpo = nome.trim().replace(/\s+/g, " ");
  if (!limpo) return limpo;
  return limpo.charAt(0).toLocaleUpperCase("pt-BR") + limpo.slice(1);
}
