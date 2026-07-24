
## Objetivo
Aprimorar a área de favoritos com ordenação, busca/filtro por categoria, contador no menu principal e feedback visual (toast) ao favoritar/desfavoritar em qualquer card.

## Mudanças

### 1. Toast ao favoritar/desfavoritar em `FavoriteIconButton`
Arquivo: `src/components/favorite-icon-button.tsx`

Hoje o botão-coração dos cards (home e `/drinks`) faz o toggle silenciosamente — só o `FavoriteButton` da página de detalhes mostra toast. Adicionar no `onSuccess` da mutation:
- `toast.success("Adicionado aos favoritos!")` ou `"Removido dos favoritos."` conforme o estado anterior.
- Mensagem de erro já está no `onError`.

### 2. Contador ao lado de "Favoritos" no menu
Arquivo: `src/components/site-header.tsx`

- Importar o hook `useFavoritos()` já exportado em `favorite-icon-button.tsx`.
- Ao lado do texto "Favoritos", renderizar um pequeno badge (`<span>` estilizado com `bg-primary/15 text-primary`) com o `size` do Set, apenas quando `> 0` e usuário autenticado.
- Como o hook já carrega os IDs em cache global (queryKey `["favoritos-ids", userId]`), não faz nova requisição adicional.

### 3. Busca, filtro por categoria e ordenação em `/favoritos`
Arquivo: `src/routes/_authenticated/favoritos.tsx`

Adicionar no topo da lista uma barra com:
- **Campo de busca** (Input) — filtra por nome do drink (normalização NFD para acentos, como já feito na home).
- **Select de categoria** — opções derivadas dos favoritos carregados (categorias distintas presentes) + "Todas".
- **Select de ordenação** — três opções:
  - "Mais recentes" (padrão, ordem atual — `created_at desc`)
  - "Mais antigos" (`created_at asc`)
  - "Nome A-Z"
  - "Nome Z-A"

Ajustes no query:
- Incluir `created_at` no select (`.select("drink_id, created_at, drinks(...)")`) para permitir ordenação client-side sem refetch.
- Manter ordenação inicial por `created_at desc` no servidor; aplicar sort/filter no cliente com `useMemo`.

UI:
- Barra responsiva: Input full-width no mobile, três controles em linha no desktop.
- Contador no header já existente atualiza para "X de Y drinks" quando há filtro ativo.
- Estado vazio adicional: se filtros zeram resultados mas há favoritos, mostrar mensagem "Nenhum favorito corresponde aos filtros" com botão para limpar.

## Fora de escopo
- Nenhuma mudança de banco de dados, RLS ou schema.
- Sem alteração no `FavoriteButton` da página de detalhes (já tem toast).
- Sem paginação — a lista de favoritos por usuário é pequena o suficiente para filtragem client-side.
