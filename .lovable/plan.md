## Objetivo
Deixar o site totalmente utilizável em telas pequenas e acessível (teclado, leitores de tela, contraste), sem alterar regras de negócio.

## 1. Cabeçalho mobile (maior problema hoje)
`src/components/site-header.tsx` usa `flex flex-wrap` com logo + 5 links públicos + links de editor + favoritos + tema + conta. Em 411px isso empilha e quebra.
- Em `< md`: manter logo + tema + avatar/entrar na barra e mover a navegação para um menu lateral (Sheet) acionado por botão com `aria-label="Abrir menu"`.
- Aplicar `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0`/`truncate` no bloco do logo e `shrink-0` nos ícones.
- Em `md+`: layout atual preservado.

## 2. Idioma e landmarks
- `src/routes/__root.tsx`: `<html lang="en">` → `lang="pt-BR"` (leitores de tela hoje leem português com voz inglesa).
- Traduzir os textos das telas de erro/404 do root que ainda estão em inglês ("Try again", "Go home", título do erro).
- Garantir exatamente um `<main>` por página (revisar rotas de mixologia, que combinam layout + página, e as rotas autenticadas com dois `<main>` em `usuarios.tsx`).

## 3. Contraste e legibilidade
- Revisar o tema claro em `src/styles.css`: `--muted-foreground` claro (oklch 0.45) sobre cards brancos fica no limite AA em textos de 11–12px; ajustar para ~0.42 e conferir `--border`/`--input`.
- Eliminar usos de cor fixa fora dos tokens e opacidades agressivas (`text-muted-foreground/50`, `text-[10px]` em textos informativos) — mínimo de 12px para texto secundário e uppercase com `tracking` só em rótulos curtos.
- Não usar apenas cor para status: badges de dificuldade e mensagens de erro dos formulários ganham ícone/texto além da cor.
- Foco visível consistente: `focus-visible:ring-2 ring-ring ring-offset-2` nos elementos customizados (toggles de visualização, chips de filtro, cards clicáveis).

## 4. Alvos de toque e formulários
- Botões `size="icon"` (tema, remover componente na calculadora, editar/remover comentário, favoritar, alternar grade/lista) passam a `min-h-11 min-w-11` no mobile.
- Chips de filtro em `/drinks` e `/favoritos`: altura mínima 44px e área de toque com espaçamento adequado.
- Todos os inputs com `<Label htmlFor>` associado; ids únicos por linha nas listas (calculadora, formulário de drink).
- Mensagens de erro ligadas ao campo via `aria-describedby` + `aria-invalid`.

## 5. Responsividade por rota
- `/drinks` e `/favoritos`: grade `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, modo lista com `min-w-0`/`truncate` para nomes longos; barra de filtros em coluna única no mobile.
- Detalhe do drink: imagem em wrapper `aspect-square` com `object-cover`, botões de ação (compartilhar, YouTube, favoritar, calcular ABV) em `flex-wrap` com largura total no mobile.
- Calculadora ABV: as linhas de componente (ingrediente/ml/%) empilham no mobile em vez de comprimir os campos.
- Mixologia: imagens e tabelas com rolagem horizontal contida (`overflow-x-auto`) e sem estouro de largura.
- Trocar `min-h-screen` por `min-h-dvh` nos contêineres de página (barra de endereço no iOS).
- Home: campo de busca e sugestões em largura total no mobile, lista de sugestões com `role="listbox"`/`aria-activedescendant`.

## 6. Imagens e conteúdo
- Todas as `<img>` com `alt` descritivo (ou `alt=""` quando decorativa) e `loading="lazy"` — revisar mixologia e cards.
- Hierarquia de títulos sem saltos (um `h1` por página; seções em `h2`/`h3`).
- `AgeGate`: foco preso no diálogo, fechamento por teclado bloqueado corretamente e `min-h-dvh`.

## 7. Verificação
- Capturar telas em 390px, 768px e 1280px nas rotas principais (home, /drinks, detalhe, /calculadora-abv, /mixologia, /favoritos) para conferir que nada estoura.
- Rodar checagem automática de acessibilidade (axe) nas mesmas rotas e corrigir os achados críticos/sérios restantes.

## Notas técnicas
Mudanças ficam em componentes de apresentação, tokens em `src/styles.css` e no root route. Nenhuma alteração de banco, consultas ou regras de permissão.
