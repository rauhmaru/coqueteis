## Objetivo
No primeiro acesso ao site, exibir um portal/banner perguntando se o visitante tem 18 anos ou mais (padrão dos sites de bebidas como o da Brahma). "Sim" libera o site e memoriza a escolha; "Não" leva para uma página de consumo responsável.

## 1. Novo componente `src/components/age-gate.tsx`
- Overlay em tela cheia (`fixed inset-0 z-50`, fundo escuro com blur) sobre o conteúdo, bloqueando a navegação até a resposta.
- Conteúdo centralizado usando tokens semânticos do tema (funciona em claro e escuro):
  - Ícone/marca do bar (Martini) + título serif "Você tem 18 anos ou mais?"
  - Texto curto: "Este site apresenta conteúdo sobre bebidas alcoólicas. O acesso é permitido apenas para maiores de 18 anos."
  - Dois botões: **Sim, tenho 18+** (primary) e **Não** (outline).
  - Rodapé pequeno: "Beba com moderação. Não dirija após consumir álcool."
- Comportamento:
  - Estado lido de `localStorage` (`age-verified`) dentro de `useEffect` para evitar mismatch de hidratação — nada é renderizado no SSR/primeiro paint até saber.
  - "Sim" → grava `localStorage` e fecha o overlay (não volta a aparecer nas próximas visitas do mesmo navegador).
  - "Não" → navega para `/consumo-responsavel` (sem gravar aprovação).
  - Enquanto o overlay estiver aberto, trava o scroll do `body`.
  - O overlay não aparece na própria rota `/consumo-responsavel`.
- Acessibilidade: `role="dialog"`, `aria-modal`, foco inicial no botão "Sim".

## 2. Nova rota `src/routes/consumo-responsavel.tsx`
Página pública, no padrão visual das outras páginas (SiteHeader + `main` com `max-w-3xl`), com `head()` próprio (title/description/og).
Conteúdo:
- Título "Consumo responsável" e aviso de que o acesso ao catálogo é restrito a maiores de 18 anos.
- Blocos com ícones (lucide): venda proibida para menores de 18 anos; não dirija após beber; alterne com água e alimente-se; gravidez e álcool não combinam; medicamentos e álcool; sinais de dependência e onde buscar ajuda (CVV 188, CAPS/AA — apenas menções genéricas, sem inventar links).
- Botão "Voltar ao início" para quem quiser refazer a verificação (a verificação reaparece porque nada foi gravado).

## 3. Integração
- `src/routes/__root.tsx`: renderizar `<AgeGate />` dentro de `ThemeProvider`/`AuthProvider`, ao lado do `<Outlet />`, para valer em todas as rotas.
- `src/components/site-header.tsx`: adicionar link discreto "Consumo responsável" (ou no rodapé do menu mobile) para acesso permanente à página.

## Fora de escopo
- Não pede data de nascimento completa (apenas sim/não, como no exemplo).
- Sem persistência no backend, sem cookies de servidor, sem bloqueio server-side — a verificação é apenas no navegador (mesmo modelo do site de referência).
- Nenhuma mudança em banco, RLS ou lógica de drinks/favoritos.
