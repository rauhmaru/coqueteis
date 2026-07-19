## Sugestão do bartender na home

Adicionar uma seção na home (`src/routes/index.tsx`), logo abaixo do card "Receitas cadastradas", exibindo um drink aleatório do catálogo.

### Implementação

- Em `HomePage`, reutilizar `drinksQuery` (já carregado no loader).
- Escolher aleatoriamente **uma vez por montagem** com `useMemo(() => drinks[Math.floor(Math.random()*drinks.length)], [drinks])`, para não trocar a cada render.
- Renderizar seção com:
  - Título pequeno em caixa alta (mesmo estilo "Bem-vindo ao seu bar"): "Sugestão do bartender".
  - Card `<Link to="/drinks/$id" params={{ id: drink.id }}>` contendo `<DrinkImage>` (aspect-square, borda arredondada) + nome em fonte serif.
  - Layout compacto centralizado, largura `max-w-2xl` alinhado ao card de estatística existente.
- Se o catálogo estiver vazio, não renderiza a seção.

### Não muda

- Nenhuma alteração de rota, backend, RLS, permissões ou queries.
- Sem novo estado global; sem shuffle no servidor.
