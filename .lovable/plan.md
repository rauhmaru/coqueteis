# Filtros compartilháveis no catálogo

## O que será feito

- Definir um único formato para os parâmetros de filtro: ingredientes, dificuldades, categorias, quantidade/comparador, busca, estoque, ordem e página.
- Inicializar os controles a partir da URL, incluindo abrir automaticamente os grupos que contêm filtros ativos.
- Atualizar a URL com substituição do histórico sempre que um filtro mudar, voltando à primeira página sem alterar a posição de rolagem.
- Reutilizar o mesmo estado nas páginas `/drinks`, `/busca` e nas páginas de categoria, preservando o filtro fixo da categoria atual.
- Manter a paginação no banco e garantir que links copiados ou favoritos reconstruam a mesma lista.

## Detalhes técnicos

- Criar validação e serialização compartilhadas, com valores inválidos descartados com segurança.
- Passar o estado validado ao painel compartilhado de filtros, tornando-o controlado pela URL.
- Usar navegação com `replace: true` e `resetScroll: false` para filtros; “Carregar mais” continuará preservando a rolagem.
- Validar tipos, testes e o comportamento de recarregar/copiar URLs nas três páginas.