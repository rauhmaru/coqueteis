## Objetivo
Adicionar, ao lado do botão "Compartilhar" na página de detalhes do drink, um botão que abre uma busca no YouTube pela receita do drink.

## Mudanças
- **`src/routes/drinks.$id.index.tsx`**: incluir um novo `Button` (variant `outline`, com ícone `Youtube` do `lucide-react`) posicionado imediatamente antes do `<ShareDrink />` no `flex flex-wrap gap-2`.
  - `onClick`: abre `https://www.youtube.com/results?search_query=` + `encodeURIComponent(\`receita ${drink.nome}\`)` em nova aba (`_blank`, `noopener,noreferrer`).
  - Texto do botão: "Ver no YouTube".

## Fora de escopo
- Nenhuma alteração de dados, backend, ou outras rotas.
- Sem embed do YouTube na página — apenas link externo.
