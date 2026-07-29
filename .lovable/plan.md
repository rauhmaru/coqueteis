## Objetivo
Permitir expandir/recolher cada bloco de filtros na rota `/drinks`, para ocultar as opções e deixar a lista mais limpa.

## Comportamento
- Cada uma das três seções de filtro (Dificuldade, Categorias, Ingredientes) recebe um botão de alternância no próprio cabeçalho.
- Clicar no cabeçalho (ou no ícone de seta) expande/recolhe o conteúdo daquela seção; a seta gira 180° na transição.
- Estado inicial: **recolhido** para as três seções, mantendo a página enxuta no mobile (411px) — os cards de drinks aparecem logo abaixo.
- Quando recolhido, o cabeçalho mostra um contador dos filtros ativos daquela seção (ex.: "Ingredientes · 3"), para que nada fique escondido sem aviso.
- O botão "Limpar" continua visível no cabeçalho e não dispara o recolhimento.
- A filtragem em si não muda: continua lógica E entre seções e E entre itens de ingredientes.

## Detalhes técnicos
- Arquivo único: `src/routes/drinks.index.tsx`.
- Extrair um pequeno componente local `FiltroSection` (título, ícone, contagem de ativos, ação de limpar, `children`) para evitar repetir a marcação três vezes.
- Estado com `useState<boolean>` por seção (ou um objeto único de abertos), usando `ChevronDown` do lucide-react com `rotate-180` em transição.
- Acessibilidade: `<button>` no cabeçalho com `aria-expanded` e `aria-controls` apontando para o painel.
- Sem mudanças de dados, queries ou backend.
