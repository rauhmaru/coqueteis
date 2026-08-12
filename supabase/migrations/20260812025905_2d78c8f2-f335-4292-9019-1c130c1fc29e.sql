-- 1. Novos campos
ALTER TABLE public.drinks
  ADD COLUMN IF NOT EXISTS passos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS copo text,
  ADD COLUMN IF NOT EXISTS metodo_preparo text,
  ADD COLUMN IF NOT EXISTS guarnicao text;

ALTER TABLE public.drinks
  ADD CONSTRAINT drinks_metodo_preparo_check
  CHECK (metodo_preparo IS NULL OR metodo_preparo IN ('shake','stir','build','muddle','blend','layer','cook'));

-- 2. Tabela de redirecionamentos
CREATE TABLE IF NOT EXISTS public.drink_redirects (
  old_id uuid PRIMARY KEY,
  new_id uuid NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drink_redirects TO anon, authenticated;
GRANT ALL ON public.drink_redirects TO service_role;
ALTER TABLE public.drink_redirects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drink_redirects public read" ON public.drink_redirects FOR SELECT USING (true);
CREATE POLICY "drink_redirects admin write" ON public.drink_redirects FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.drink_redirects (old_id, new_id) VALUES
  ('05c5a5f5-eeda-43b2-9445-a421cd2608e0','a33c52eb-bee7-4605-bad1-1b6655d0f78b'),
  ('0b3bfc3a-00e3-41ba-883c-dd0aedf332e5','2c747e3c-bc46-48bc-8747-35c43338bcb7'),
  ('cf71c565-c237-47dc-b9e5-5e75cbe1a151','4468d7bd-6492-4f51-ad25-a39ec5297be2')
ON CONFLICT (old_id) DO NOTHING;

-- 3. Migra curtidas / favoritos / comentarios
UPDATE public.drink_likes l SET drink_id = r.new_id
FROM public.drink_redirects r
WHERE l.drink_id = r.old_id
  AND NOT EXISTS (SELECT 1 FROM public.drink_likes l2 WHERE l2.drink_id = r.new_id AND l2.user_id = l.user_id);

UPDATE public.drink_favoritos f SET drink_id = r.new_id
FROM public.drink_redirects r
WHERE f.drink_id = r.old_id
  AND NOT EXISTS (SELECT 1 FROM public.drink_favoritos f2 WHERE f2.drink_id = r.new_id AND f2.user_id = f.user_id);

UPDATE public.drink_comentarios c SET drink_id = r.new_id
FROM public.drink_redirects r WHERE c.drink_id = r.old_id;

DELETE FROM public.drinks d USING public.drink_redirects r WHERE d.id = r.old_id;

-- 4. Backfill de passos a partir do texto de preparo
UPDATE public.drinks d SET passos = COALESCE((
  SELECT jsonb_agg(jsonb_build_object('ordem', ord, 'texto', txt) ORDER BY ord)
  FROM (
    SELECT row_number() OVER () AS ord,
           upper(left(trim(s), 1)) || right(trim(s), -1) AS txt
    FROM regexp_split_to_table(
      regexp_replace(
        replace(replace(replace(replace(replace(replace(
          d.preparo,
          ' e complete com ', '. Complete com '),
          ' e decore com ', '. Decore com '),
          ' e finalize com ', '. Finalize com '),
          ', mexa e sirva ', '. Mexa bem. Sirva '),
          '; ', '. '),
          ' Em seguida, ', '. Em seguida, '),
        '\s+', ' ', 'g'),
      '(?<=[.!?])\s+'
    ) AS s
    WHERE length(trim(s)) > 2
  ) x
), '[]'::jsonb)
WHERE COALESCE(d.preparo, '') <> '';

-- 5. Backfill de copo
WITH ctx AS (
  SELECT d.id,
         lower(d.nome) AS n,
         lower(coalesce(d.preparo,'')) AS p,
         lower(coalesce(string_agg(dc.nome, ' '), '')) AS cats
  FROM public.drinks d
  LEFT JOIN public.drink_drink_categorias ddc ON ddc.drink_id = d.id
  LEFT JOIN public.drink_categorias dc ON dc.id = ddc.categoria_id
  GROUP BY d.id, d.nome, d.preparo
)
UPDATE public.drinks d SET copo = CASE
  WHEN ctx.cats LIKE '%xarope%' OR ctx.n LIKE 'xarope%' THEN 'Não se aplica (xarope)'
  WHEN ctx.p LIKE '%caneca de cobre%' OR ctx.n LIKE '%mule%' THEN 'Caneca de cobre'
  WHEN ctx.p LIKE '%shot%' OR ctx.n LIKE '%shot%' OR ctx.n LIKE '%b-52%' THEN 'Copo shot'
  WHEN ctx.p LIKE '%hurricane%' THEN 'Taça hurricane'
  WHEN ctx.p LIKE '%fl_te%' OR ctx.p LIKE '%prosecco%' OR ctx.p LIKE '%espumante%' OR ctx.p LIKE '%champanhe%' THEN 'Taça flûte'
  WHEN ctx.p LIKE '%martini%' OR ctx.p LIKE '%coupe%' THEN 'Taça martini (ou coupe)'
  WHEN ctx.p LIKE '%taça de vinho%' THEN 'Taça de vinho'
  WHEN ctx.cats LIKE '%cerveja%' OR ctx.p LIKE '%pint%' OR ctx.p LIKE '%caneca%' THEN 'Copo de cerveja (pint)'
  WHEN ctx.p LIKE '%copo alto%' OR ctx.p LIKE '%highball%' OR ctx.p LIKE '%collins%' OR ctx.p LIKE '%copo longo%' THEN 'Copo highball'
  WHEN ctx.p LIKE '%copo baixo%' OR ctx.p LIKE '%old fashioned%' OR ctx.p LIKE '%rocks%' OR ctx.p LIKE '%whisky%' THEN 'Copo old fashioned'
  WHEN ctx.p LIKE '%taça%' THEN 'Taça'
  WHEN ctx.p LIKE '%liquidificador%' THEN 'Taça hurricane'
  ELSE 'Copo highball'
END
FROM ctx WHERE ctx.id = d.id;

-- 6. Backfill de metodo_preparo
UPDATE public.drinks d SET metodo_preparo = CASE
  WHEN lower(coalesce(d.preparo,'')) ~ '(panela|fogo|ferva|aque(ç|c)a|fervura|dissolv)' THEN 'cook'
  WHEN lower(coalesce(d.preparo,'')) LIKE '%liquidificador%' THEN 'blend'
  WHEN lower(coalesce(d.preparo,'')) ~ '(camada|costas da colher|despeje em camadas)' THEN 'layer'
  WHEN lower(coalesce(d.preparo,'')) ~ '(macere|amasse|soc(a|á)|maceran)' THEN 'muddle'
  WHEN lower(coalesce(d.preparo,'')) ~ '(bata|coqueteleira|shaker|batido)' THEN 'shake'
  WHEN lower(coalesce(d.preparo,'')) ~ 'mexa|misture' AND lower(coalesce(d.preparo,'')) LIKE '%coe%' THEN 'stir'
  ELSE 'build'
END;

-- 7. Backfill de guarnicao
UPDATE public.drinks d SET guarnicao = COALESCE(
  NULLIF(trim(both ' .' FROM (
    regexp_match(
      coalesce(d.preparo,''),
      '(?:[Dd]ecore com|[Ff]inalize com|[Dd]ecorad[oa] com|[Dd]ecorado por|[Ff]inalize|[Ss]irva decorado com)\s+([^.]+)'
    )
  )[1]), ''),
  'Sem guarnição'
);

UPDATE public.drinks
SET guarnicao = upper(left(guarnicao,1)) || right(guarnicao, -1)
WHERE guarnicao IS NOT NULL AND guarnicao <> '';

UPDATE public.drinks SET guarnicao = 'Sem guarnição'
WHERE guarnicao IS NULL OR length(guarnicao) < 3 OR length(guarnicao) > 90;
