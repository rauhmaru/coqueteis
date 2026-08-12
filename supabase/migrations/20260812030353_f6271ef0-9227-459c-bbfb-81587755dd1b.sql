-- Guarnição: extrai acabamentos descritos sem "decore"
UPDATE public.drinks d SET guarnicao = initcap_first
FROM (
  SELECT id,
         NULLIF(trim(both ' .,' FROM (regexp_match(
           coalesce(preparo,''),
           '(?:com|e)\s+((?:uma?\s+)?(?:fatia|fatias|rodela|rodelas|casca|cascas|raminho|folhas?|cereja|cerejas|azeitona|azeitonas|zest|twist|borda de sal|borda salgada|p(?:e|é)dao?)[^.]*)'
         ))[1]), '') AS trecho
  FROM public.drinks
) m,
LATERAL (SELECT upper(left(m.trecho,1)) || right(m.trecho,-1) AS initcap_first) f
WHERE d.id = m.id
  AND d.guarnicao = 'Sem guarnição'
  AND m.trecho IS NOT NULL
  AND length(m.trecho) BETWEEN 4 AND 90;

-- Copo: clássicos conhecidos
UPDATE public.drinks SET copo = 'Taça margarita (ou coupe)' WHERE nome ILIKE '%margarita%' AND nome NOT ILIKE '%beer%';
UPDATE public.drinks SET copo = 'Taça coupe' WHERE nome IN ('Daiquiri','Sidecar','Clover Club','Corpse Reviver No. 2','Last Word','Aviation','White Lady','Bees Knees','Amaretto Sour','Whisky Sour','Pisco Sour','Gin Sour');
UPDATE public.drinks SET copo = 'Taça martini' WHERE nome ILIKE '%martini%';
UPDATE public.drinks SET copo = 'Copo old fashioned' WHERE nome IN ('Old Fashioned','Negroni','Sazerac','Boulevardier','Black Russian','White Russian','Caipirinha','Caipiroska','Caipirissima','Caipirinha de Morango','Caipirinha de Saquê','Caipirosca de Frutas Vermelhas','Godfather','Rusty Nail');
UPDATE public.drinks SET copo = 'Taça coupe' WHERE nome IN ('Manhattan','Brooklyn','Vieux Carré');
UPDATE public.drinks SET copo = 'Copo highball' WHERE nome IN ('Mojito','Mojito de Morango','Virgin Mojito','Tom Collins','Gin Tônica','Cuba Libre','Dark ''n'' Stormy','Paloma');
UPDATE public.drinks SET copo = 'Caneca de cobre' WHERE nome ILIKE '%mule%';

-- Método: clássicos mexidos
UPDATE public.drinks SET metodo_preparo = 'stir'
WHERE nome IN ('Negroni','Manhattan','Old Fashioned','Sazerac','Boulevardier','Vieux Carré','Rob Roy','Martini','Dry Martini','Brooklyn','Rusty Nail','Godfather');
