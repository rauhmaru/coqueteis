WITH pares(drink_nome, cat_nome) AS (VALUES
 ('Appletini','Refrescantes'),
 ('Bees Knees','Clássicos'),('Bees Knees','Sour'),
 ('Bloody Mary','Clássicos'),
 ('Blue Lagoon','Refrescantes'),('Blue Lagoon','Tropicais'),
 ('Bramble','Clássicos'),('Bramble','Refrescantes'),
 ('Buttery Nipple','Shots'),('Buttery Nipple','Cremosos'),
 ('Caipirissima','Brasileiros'),('Caipirissima','Refrescantes'),
 ('Caipirosca de Frutas Vermelhas','Brasileiros'),('Caipirosca de Frutas Vermelhas','Refrescantes'),
 ('Campari Tropical','Tropicais'),('Campari Tropical','Refrescantes'),
 ('Corpse Reviver Nº 2','Clássicos'),
 ('Cuba Libre','Clássicos'),('Cuba Libre','Refrescantes'),
 ('French Martini','Clássicos'),
 ('Frozen Daiquiri','Refrescantes'),('Frozen Daiquiri','Tropicais'),
 ('Frozen Margarita','Refrescantes'),('Frozen Margarita','Tropicais'),
 ('Garibaldi','Refrescantes'),
 ('Gin Basil Smash','Sour'),('Gin Basil Smash','Refrescantes'),
 ('Godfather','Clássicos'),
 ('Godmother','Clássicos'),
 ('Hemingway Daiquiri','Clássicos'),('Hemingway Daiquiri','Sour'),
 ('Irish Car Bomb','Shots'),('Irish Car Bomb','Cervejas'),
 ('Jägerbomb','Shots'),
 ('Kamikaze','Shots'),('Kamikaze','Sour'),
 ('Last Word','Clássicos'),('Last Word','Sour'),
 ('Long Island Iced Tea','Clássicos'),('Long Island Iced Tea','Refrescantes'),
 ('Mai Tai','Tiki'),('Mai Tai','Tropicais'),
 ('Mezcalita','Sour'),('Mezcalita','Refrescantes'),
 ('Mint Julep','Clássicos'),('Mint Julep','Refrescantes'),
 ('Mulled Wine','Quentes'),
 ('Oaxacan Old Fashioned','Clássicos'),
 ('Pickleback','Shots'),
 ('Red Headed Slut','Shots'),
 ('Rob Roy','Clássicos'),
 ('Rusty Nail','Clássicos'),
 ('Sangria','Refrescantes'),
 ('Sex on the Beach','Tropicais'),('Sex on the Beach','Refrescantes'),
 ('Sherry Cobbler','Clássicos'),('Sherry Cobbler','Refrescantes'),
 ('Singapore Sling','Clássicos'),('Singapore Sling','Tiki'),
 ('Spicy Margarita','Sour'),('Spicy Margarita','Refrescantes'),
 ('Strawberry Daiquiri','Tropicais'),('Strawberry Daiquiri','Refrescantes'),
 ('Tequila Sunrise','Clássicos'),('Tequila Sunrise','Tropicais'),
 ('Tommys Margarita','Clássicos'),('Tommys Margarita','Sour'),
 ('Vesper Martini','Clássicos'),
 ('Vodka Martini','Clássicos'),
 ('Washington Apple','Shots')
)
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT d.id, c.id
FROM pares p
JOIN public.drinks d ON d.nome = p.drink_nome
JOIN public.drink_categorias c ON c.nome = p.cat_nome
WHERE NOT EXISTS (
  SELECT 1 FROM public.drink_drink_categorias x WHERE x.drink_id = d.id
)
ON CONFLICT DO NOTHING;