
-- 1. created_by em drinks e ingredientes (primeiro, para policies dependerem)
ALTER TABLE public.drinks ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.ingredientes ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.drinks SET created_by = 'f036ce84-37f3-445f-ae1c-ba84c9588825' WHERE created_by IS NULL;
UPDATE public.ingredientes SET created_by = 'f036ce84-37f3-445f-ae1c-ba84c9588825' WHERE created_by IS NULL;
CREATE INDEX drinks_created_by ON public.drinks(created_by);
CREATE INDEX ingredientes_created_by ON public.ingredientes(created_by);

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER drinks_set_created_by BEFORE INSERT ON public.drinks
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
CREATE TRIGGER ingredientes_set_created_by BEFORE INSERT ON public.ingredientes
  FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- 2. drink_categorias
CREATE TABLE public.drink_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drink_categorias TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.drink_categorias TO authenticated;
GRANT ALL ON public.drink_categorias TO service_role;
ALTER TABLE public.drink_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all drink_categorias" ON public.drink_categorias FOR SELECT USING (true);
CREATE POLICY "editors manage drink_categorias" ON public.drink_categorias FOR ALL
  TO authenticated USING (public.can_edit(auth.uid())) WITH CHECK (public.can_edit(auth.uid()));

INSERT INTO public.drink_categorias (nome) VALUES
  ('Clássicos'),('Tropicais'),('Shots'),('Refrescantes'),('Cremosos'),
  ('Sour'),('Tiki'),('Brasileiros'),('Quentes'),('Espumantes')
ON CONFLICT (nome) DO NOTHING;

-- 3. drink_drink_categorias (join)
CREATE TABLE public.drink_drink_categorias (
  drink_id uuid NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES public.drink_categorias(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (drink_id, categoria_id)
);
CREATE INDEX drink_drink_categorias_drink ON public.drink_drink_categorias(drink_id);
CREATE INDEX drink_drink_categorias_cat ON public.drink_drink_categorias(categoria_id);
GRANT SELECT ON public.drink_drink_categorias TO anon, authenticated;
GRANT INSERT, DELETE ON public.drink_drink_categorias TO authenticated;
GRANT ALL ON public.drink_drink_categorias TO service_role;
ALTER TABLE public.drink_drink_categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all drink_drink_categorias" ON public.drink_drink_categorias FOR SELECT USING (true);
CREATE POLICY "owner manage drink_drink_categorias" ON public.drink_drink_categorias FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_id
      AND (d.created_by = auth.uid() OR public.has_role(auth.uid(),'admin')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_id
      AND (d.created_by = auth.uid() OR public.has_role(auth.uid(),'admin')))
  );

-- 4. Reescrever policies de drinks
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='drinks' LOOP
    EXECUTE format('DROP POLICY %I ON public.drinks', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "drinks read all" ON public.drinks FOR SELECT USING (true);
CREATE POLICY "drinks insert own" ON public.drinks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "drinks update own" ON public.drinks FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "drinks delete own" ON public.drinks FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

-- 5. Reescrever policies de ingredientes
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='ingredientes' LOOP
    EXECUTE format('DROP POLICY %I ON public.ingredientes', r.policyname);
  END LOOP;
END $$;
CREATE POLICY "ingredientes read all" ON public.ingredientes FOR SELECT USING (true);
CREATE POLICY "ingredientes insert own" ON public.ingredientes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ingredientes update own" ON public.ingredientes FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ingredientes delete own" ON public.ingredientes FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

-- 6. Classificação automática de drinks existentes
-- Sour
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT di.drink_id, dc.id
FROM public.drink_ingredientes di
JOIN public.ingredientes i ON i.id = di.ingrediente_id
JOIN public.drink_categorias dc ON dc.nome='Sour'
WHERE lower(i.nome) LIKE '%clara%ovo%'
ON CONFLICT DO NOTHING;

-- Brasileiros (cachaça OU nome contém caipirinha/caipiroska/batida)
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT d.id, dc.id
FROM public.drinks d
JOIN public.drink_categorias dc ON dc.nome='Brasileiros'
LEFT JOIN public.drink_ingredientes di ON di.drink_id = d.id
LEFT JOIN public.ingredientes i ON i.id = di.ingrediente_id
WHERE lower(coalesce(i.nome,'')) LIKE '%cachaça%'
   OR lower(coalesce(i.nome,'')) LIKE '%cachaca%'
   OR lower(d.nome) LIKE '%caipirinha%'
   OR lower(d.nome) LIKE '%caipiroska%'
   OR lower(d.nome) LIKE '%batida%'
ON CONFLICT DO NOTHING;

-- Clássicos
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT d.id, dc.id
FROM public.drinks d
JOIN public.drink_categorias dc ON dc.nome='Clássicos'
WHERE lower(d.nome) IN (
  'manhattan','negroni','old fashioned','martini','dry martini','daiquiri',
  'whiskey sour','whisky sour','margarita','sazerac','boulevardier','aviation',
  'vesper','americano','cosmopolitan','mojito','side car','sidecar','gimlet'
)
ON CONFLICT DO NOTHING;

-- Espumantes
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT di.drink_id, dc.id
FROM public.drink_ingredientes di
JOIN public.ingredientes i ON i.id = di.ingrediente_id
JOIN public.drink_categorias dc ON dc.nome='Espumantes'
WHERE lower(i.nome) LIKE '%espumante%'
   OR lower(i.nome) LIKE '%prosecco%'
   OR lower(i.nome) LIKE '%champagne%'
   OR lower(i.nome) LIKE '%champanhe%'
ON CONFLICT DO NOTHING;

-- Cremosos
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT di.drink_id, dc.id
FROM public.drink_ingredientes di
JOIN public.ingredientes i ON i.id = di.ingrediente_id
JOIN public.drink_categorias dc ON dc.nome='Cremosos'
WHERE lower(i.nome) LIKE '%creme de leite%'
   OR lower(i.nome) LIKE '%leite condensado%'
   OR lower(i.nome) SIMILAR TO '%(sorvete|nata|chantilly)%'
   OR lower(i.nome) = 'leite'
ON CONFLICT DO NOTHING;

-- Quentes
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT d.id, dc.id
FROM public.drinks d
JOIN public.drink_categorias dc ON dc.nome='Quentes'
LEFT JOIN public.drink_ingredientes di ON di.drink_id = d.id
LEFT JOIN public.ingredientes i ON i.id = di.ingrediente_id
WHERE lower(d.nome) SIMILAR TO '%(quent|toddy|grog|café)%'
   OR lower(coalesce(i.nome,'')) LIKE '%café%'
   OR lower(coalesce(i.nome,'')) LIKE '%cafe%'
ON CONFLICT DO NOTHING;

-- Tiki / Tropicais (rum + suco tropical)
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT d.id, dc.id
FROM public.drinks d
JOIN public.drink_categorias dc ON dc.nome IN ('Tropicais','Tiki')
JOIN public.drink_ingredientes di_r ON di_r.drink_id = d.id
JOIN public.ingredientes i_r ON i_r.id = di_r.ingrediente_id AND lower(i_r.nome) LIKE '%rum%'
JOIN public.drink_ingredientes di_f ON di_f.drink_id = d.id
JOIN public.ingredientes i_f ON i_f.id = di_f.ingrediente_id
WHERE lower(i_f.nome) SIMILAR TO '%(abacaxi|maracuj|coco|manga|goiaba)%'
ON CONFLICT DO NOTHING;

-- Refrescantes
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT di.drink_id, dc.id
FROM public.drink_ingredientes di
JOIN public.ingredientes i ON i.id = di.ingrediente_id
JOIN public.drink_categorias dc ON dc.nome='Refrescantes'
WHERE lower(i.nome) SIMILAR TO '%(tônica|tonica|club soda|água com gás|agua com gas|ginger|gengibre)%'
ON CONFLICT DO NOTHING;

-- Shots
INSERT INTO public.drink_drink_categorias (drink_id, categoria_id)
SELECT DISTINCT d.id, dc.id
FROM public.drinks d
JOIN public.drink_categorias dc ON dc.nome='Shots'
WHERE lower(d.nome) LIKE '%shot%' OR lower(d.nome) LIKE '%shooter%'
ON CONFLICT DO NOTHING;
