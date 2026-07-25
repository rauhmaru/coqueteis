## Objetivo
Permitir alternar entre tema **escuro** (atual, padrão) e um novo tema **claro** compatível, preservando a identidade âmbar/copper do bar lounge. Preferência persistida entre sessões.

## Mudanças

### 1. Tema claro em `src/styles.css`
- Manter `:root` como está (padrão dark lounge) — o tema padrão continua o escuro.
- Adicionar um bloco `.light { ... }` com paleta clara compatível:
  - `--background`: creme quente muito claro (ex.: `oklch(0.98 0.01 80)`)
  - `--foreground`: espresso profundo (ex.: `oklch(0.20 0.02 60)`)
  - `--card` / `--popover`: branco levemente amarelado
  - `--primary`: âmbar/copper mais saturado para contraste em fundo claro (ex.: `oklch(0.62 0.16 55)`)
  - `--primary-foreground`: creme quase branco
  - `--secondary` / `--muted`: bege quente
  - `--accent`: copper avermelhado
  - `--border` / `--input`: bege médio
  - `--sidebar*`: seguem a mesma lógica
- Não alterar fontes, radius nem `@theme inline` — a troca é 100% via variáveis CSS, então todas as telas continuam funcionando sem tocar em componentes.

### 2. Hook `useTheme`
Novo arquivo: `src/hooks/use-theme.tsx`
- Contexto React com estado `"light" | "dark"` (padrão `"dark"`).
- Lê preferência de `localStorage` (`theme`) em `useEffect` para evitar mismatch de hidratação SSR.
- Aplica classe no `<html>`: adiciona `light` para claro, remove para escuro (o `.dark` variant existente continua funcionando pois usamos ausência de `.light` = dark padrão).
- Expõe `theme` e `toggleTheme()`.
- Envolver `AuthProvider` com `ThemeProvider` em `src/routes/__root.tsx`.

### 3. Botão de toggle
Novo arquivo: `src/components/theme-toggle.tsx`
- Botão ícone (Sun/Moon do `lucide-react`) que chama `toggleTheme()`.
- Aria-label dinâmico ("Ativar tema claro" / "Ativar tema escuro").
- Estilo consistente com os botões do header (ghost/outline size sm).

### 4. Integração no header
Arquivo: `src/components/site-header.tsx`
- Adicionar `<ThemeToggle />` na área direita (antes do botão Entrar / avatar), visível para todos (autenticado ou não).

## Fora de escopo
- Não altera cores hardcoded em componentes (não há — tudo usa tokens semânticos).
- Não persiste preferência no backend.
- Sem mudança em rotas, queries, RLS ou lógica de negócio.
