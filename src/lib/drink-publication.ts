export type DrinkPublicationRow = { id: string; publicado: boolean; imagem_url: string | null };

export function validarPublicacaoSelecionada(
  drinks: DrinkPublicationRow[], ids: string[], publicar: boolean,
): string | null {
  if (ids.length === 0 || ids.length > 100 || new Set(ids).size !== ids.length) {
    return "Selecione de 1 a 100 receitas distintas.";
  }
  if (drinks.length !== ids.length || drinks.some((drink) => drink.publicado === publicar)) {
    return "Atualize a lista e selecione apenas receitas no estado esperado.";
  }
  if (publicar && drinks.some((drink) => !drink.imagem_url?.trim())) {
    return "Adicione uma imagem a cada receita antes de publicar.";
  }
  return null;
}