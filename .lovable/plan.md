## Objetivo
Permitir alternar entre visualização em **grade** (atual) e **lista** (linear, imagem menor à esquerda + info à direita) nas rotas `/drinks` e `/favoritos`, com preferência lembrada entre sessões.

## Mudanças

### 1. Hook compartilhado `useViewMode`
Novo arquivo: `src/hooks/use-view-mode.ts`

- Estado `"grid" | "list"` persistido em `localStorage` por chave (ex.: `viewmode:drinks`, `viewmode:favoritos`), lido em `useEffect` para evitar mismatch de hidratação SSR.
- Retorna `[mode, setMode]`.

### 2. Componente `ViewModeToggle`
Novo arquivo: `src/components/view-mode-toggle.tsx`

- Dois botões segmentados com ícones `LayoutGrid` e `List` (lucide-react), estilo consistente com os filtros já existentes (pill/border).
- Aria-labels "Visualização em grade" / "Visualização em lista".

### 3. Integração em `/drinks`
Arquivo: `src/routes/drinks.index.tsx`

- Adicionar toggle no cabeçalho (ao lado do botão "Novo drink" no desktop; abaixo no mobile).
- Renderização condicional:
  - **Grid**: mantém `<ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">` atual.
  - **List**: `<ul className="flex flex-col gap-3">` com cada item em layout horizontal — imagem `h-24 w-24` à esquerda, nome + badges de categorias/ingredientes à direita, botão de favoritar no topo direito, ações editar/remover em linha inferior (quando `canManage`).
- Manter todos os filtros e permissões inalterados.

### 4. Integração em `/favoritos`
Arquivo: `src/routes/_authenticated/favoritos.tsx`

- Adicionar toggle na barra de controles existente (junto de busca/categoria/ordenação). Ajustar grid da barra para acomodar (`sm:grid-cols-[1fr_auto_auto_auto]`).
- Renderização condicional dos cards:
  - **Grid**: layout atual (`grid sm:grid-cols-2 lg:grid-cols-3`).
  - **List**: linha horizontal — imagem quadrada pequena à esquerda, nome + badges à direita.
- Estado vazio e mensagens permanecem iguais.

## Fora de escopo
- Sem mudança de banco, RLS ou queries.
- Sem alterar demais rotas (`/ingredientes`, mixologia, etc.).
- Sem persistência server-side da preferência.