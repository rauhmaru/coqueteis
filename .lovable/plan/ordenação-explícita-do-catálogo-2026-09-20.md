# Ordenação explícita do catálogo

## Objetivo
Adicionar uma ordenação consistente às listagens de receitas, executada no banco antes da paginação e refletida em `?ordem=`.

## Implementação
- Criar um seletor compartilhado “Ordenar por”, posicionado ao lado do alternador grade/lista.
- Oferecer: alfabética A–Z, alfabética Z–A, mais fáceis primeiro, menos ingredientes primeiro e mais curtidos.
- Usar A–Z como padrão; manter o parâmetro padrão fora da URL e validar valores desconhecidos com retorno seguro ao padrão.
- Ampliar a consulta paginada do catálogo para receber a ordem escolhida e ordenar no banco antes de aplicar limite/deslocamento.
- Incluir na visão enxuta do catálogo a contagem pública de curtidas necessária para “mais curtidos”, com desempate alfabético estável.
- Reiniciar a paginação ao mudar a ordem, preservando os demais parâmetros da URL e sem saltos indevidos de rolagem.
- Anunciar quantidade e ordem atual na região `aria-live` já existente.
- Aplicar o mesmo controle e comportamento à listagem principal e às páginas de categoria.
- Como não existe hoje uma página `/busca` independente, criar essa rota como listagem pesquisável paginada, com termo e ordem na URL, reutilizando os mesmos cards e consulta ordenada.

## Detalhes técnicos
- Atualizar a função `buscar_drinks_lista` por migração, acrescentando parâmetros de termo e ordem com uma lista fechada de valores aceitos.
- Ordenações estáveis: nome como critério de desempate e, por fim, ID.
- Atualizar os tipos e a chave de cache da consulta para incluir ordem/termo.
- Validar catálogo, busca e categoria em telas móvel e desktop, incluindo troca de ordem, URL, paginação e anúncio acessível.
