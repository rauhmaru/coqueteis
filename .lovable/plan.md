## Objetivo
Adicionar a categoria de drinks "Não alcoólicos" e cadastrar no mínimo 20 receitas (mocktails/sucos/refrescos clássicos) com ingredientes vinculados e imagens 400×400.

## Receitas propostas (23)
Virgin Mojito, Virgin Piña Colada, Shirley Temple, Nojito, Virgin Mary, Limonada Suíça, Limonada Rosa, Cranberry Fizz, Ginger Beer Mocktail, Cucumber Cooler, Passion Fruit Spritz (sem álcool), Berry Lemonade, Coconut Cooler, Apple Ginger Fizz, Watermelon Cooler, Pineapple Mint Refresher, Peach Iced Tea, Mango Lassi, Hibiscus Cooler, Citrus Punch, Grape Spritzer, Blueberry Lemonade, Espresso Tonic.

## Mudanças no banco (via migrations/insert)
1. Inserir categoria em `drink_categorias`: **Não alcoólicos**.
2. Inserir em `ingredientes` os que ainda não existem (ex.: água de coco, chá preto/gelado, hibisco seco, iogurte natural, manga, mirtilo, melancia, pêssego, uva, cranberry, ginger beer/ginger ale, café espresso, água tônica, framboesa/mirtilo, hortelã/limão já podem existir — usar upsert por nome).
3. Inserir cada drink em `drinks` (created_by = admin, para ficarem públicos como as demais), vincular a `drink_drink_categorias` (categoria Não alcoólicos) e a `drink_ingredientes`.

## Imagens
- Gerar 23 imagens estilo fotografia de bar/produto (mocktail com guarnição, fundo claro), 400×400.
- Enviar ao bucket `drink-images` e vincular via `imagem_url` em cada drink.

## Fora de escopo
- Nenhuma alteração de UI, rotas, ou lógica de filtros — as receitas aparecem automaticamente no filtro de categorias em `/drinks`.
- Sem novo ingrediente/categoria além do necessário para essas receitas.