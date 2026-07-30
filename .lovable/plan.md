## Objetivo
Ferramenta interativa para estimar o teor alcoólico (ABV) de um drink, reforçando moderação e consumo responsável. Sem mudanças no banco.

## Nova rota `/calculadora-abv`
- Título: "Calculadora de teor alcoólico", com aviso de que o resultado é uma **estimativa**.
- Lista editável de componentes; cada linha tem: nome do ingrediente, volume em ml e teor (% ABV).
- Ao escolher um ingrediente conhecido, o teor é preenchido automaticamente por uma tabela de referência local (cachaça/vodka/gin/rum/tequila/whisky 40%, licores 20–30%, vermute 16–18%, espumante 12%, vinho 12%, cerveja 5%, bitters 40%, sucos/xaropes/tônica 0%). Teor sempre editável.
- Campo de diluição por gelo (padrão ~20% de água derretida), com opção de desligar.
- Resultado exibido em cards:
  - **ABV final** (%), volume total (ml) e álcool puro (ml).
  - **Doses padrão** (unidades de álcool, 14 g / ~17,7 ml de etanol puro por dose).
  - Faixa qualitativa: Leve (< 10%), Moderado (10–20%), Forte (20–30%), Muito forte (> 30%) — usando os tokens de cor do tema.
- Bloco de consumo responsável com link para `/consumo-responsavel`.

## Integração com as receitas
- Na página do drink (`/drinks/$id`), botão **"Calcular teor alcoólico"** ao lado de Compartilhar/YouTube.
- Ele abre `/calculadora-abv?drink=<id>`: a calculadora carrega o drink, monta uma linha por ingrediente da receita, já com o teor sugerido pela tabela de referência e volume padrão sugerido por tipo (destilado 50 ml, licor 15 ml, sucos 30 ml, tônica/espumante 100 ml, itens sólidos 0 ml). O usuário ajusta os ml.
- Cabeçalho mostra nome e imagem do drink quando vier de uma receita.

## Detalhes técnicos
- `src/lib/abv.ts`: tabela de referência (match por nome normalizado, sem acentos), volumes sugeridos e funções puras `calcularAbv()` / `classificarAbv()` — com testes unitários em `src/lib/abv.test.ts`.
- `src/routes/calculadora-abv.tsx`: rota com `head()` próprio (title/description/og), `validateSearch` para o parâmetro opcional `drink`, estado local com `useState`, dados da receita via `drinksQuery`/`drinkQuery` existentes.
- Inputs numéricos validados (ml 0–2000, ABV 0–96), sem valores negativos.
- Link "Calculadora ABV" adicionado ao menu em `src/components/site-header.tsx`.
- Nenhuma migração, nenhuma nova coluna, nenhum dado gravado.
