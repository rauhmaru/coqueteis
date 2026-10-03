# Ordenação por adicionados recentemente

## O que será feito

- Adicionar “Adicionados recentemente” ao seletor “Ordenar por” da listagem de Drinks.
- Refletir a escolha na URL, mantendo os filtros e a paginação existentes.
- Ordenar no banco pela data de cadastro mais recente, com nome e ID como desempates estáveis.
- Disponibilizar a mesma opção nas listagens que reutilizam o seletor: catálogo, busca e categorias.
- Adicionar um teste para garantir que essa opção continue válida e corretamente identificada.

## Detalhes técnicos

- Expor `created_at` na visão enxuta do catálogo e atualizar a função paginada `buscar_drinks_lista` para aceitar a nova ordem.
- Preservar “Alfabética (A–Z)” como padrão e reiniciar a página ao trocar a ordenação.
- Validar a URL, os primeiros resultados e o anúncio acessível da ordem ativa.
