## Objetivo
Adicionar 15 novas receitas de drinks à base de cerveja ao catálogo, com ingredientes cadastrados, categorização correta e imagem 400×400 para cada uma.

## Nova categoria de drinks
Criar a categoria **Cervejas** (hoje existem 12: Brasileiros, Clássicos, Cremosos, Espumantes, Não alcoólicos, Quentes, Refrescantes, Shots, Sour, Tiki, Tropicais, Xaropes). Cada receita recebe "Cervejas" + categorias adicionais quando fizer sentido (ex.: Refrescantes, Brasileiros, Clássicos, Shots, Tropicais).

## Receitas previstas (clássicos internacionais e brasileiros)
1. Michelada — cerveja, limão, molho inglês, tabasco, sal
2. Chelada — cerveja, limão, sal
3. Shandy (Radler) — cerveja, limonada
4. Beer Margarita (Beergarita) — tequila, cerveja, limão, triple sec
5. Black Velvet — stout + espumante
6. Snakebite — lager + cidra
7. Boilermaker — whisky + cerveja (Shots)
8. Sake Bomb — saquê + cerveja (Shots)
9. Summer Beer — cerveja, limonada, vodka
10. Bloody Beer — cerveja, suco de tomate, limão, temperos
11. Lager & Lime — cerveja + xarope/suco de limão
12. Red Eye — cerveja, suco de tomate
13. Cerveja com Cachaça (Brasileiros) — cerveja, cachaça, limão
14. Skip and Go Naked — cerveja, vodka, limonada
15. Stout Float — stout + sorvete de baunilha (Cremosos)

## Ingredientes
Reaproveitar os existentes (Cerveja, Limão, Suco de limão, Tequila, Vodka, Ginger beer etc.) e cadastrar os que faltarem, cada um no tipo correto: Cerveja lager, Cerveja stout, Cerveja IPA, Cidra, Saquê, Molho inglês, Tabasco, Suco de tomate, Limonada, Sorvete de baunilha, Sal, Pimenta, Whisky bourbon (se ausente).

## Imagens
Gerar 15 imagens em **400×400** (padrão do projeto), enviar ao bucket privado `drink-images` e vincular em `drinks.imagem_url`, seguindo o mesmo fluxo já usado nas importações anteriores.

## Detalhes técnicos
- Migração: inserir a categoria `Cervejas` em `drink_categorias`; os ingredientes e drinks entram como dados (INSERT), com `created_by` = usuário administrador, conforme padrão do projeto.
- Vínculos em `drink_ingredientes` e `drink_drink_categorias`.
- Cada drink com campo `preparo` descritivo passo a passo, em pt-BR.
- Nenhuma alteração de UI é necessária: `/drinks` já lista e filtra por categorias e ingredientes automaticamente.
