DROP POLICY IF EXISTS "read valid drink_drink_categorias" ON public.drink_drink_categorias;
CREATE POLICY "published drink categories for visitors"
ON public.drink_drink_categorias FOR SELECT TO anon
USING (
  EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_id AND d.publicado = true)
  AND EXISTS (SELECT 1 FROM public.drink_categorias c WHERE c.id = categoria_id)
);
CREATE POLICY "published or manageable drink categories for team"
ON public.drink_drink_categorias FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drinks d
    WHERE d.id = drink_id
      AND (d.publicado = true OR d.created_by = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'))
  )
  AND EXISTS (SELECT 1 FROM public.drink_categorias c WHERE c.id = categoria_id)
);
DROP POLICY IF EXISTS "drink_ing valid public read" ON public.drink_ingredientes;
CREATE POLICY "published drink ingredients for visitors"
ON public.drink_ingredientes FOR SELECT TO anon
USING (
  EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_id AND d.publicado = true)
  AND EXISTS (SELECT 1 FROM public.ingredientes i WHERE i.id = ingrediente_id)
);
CREATE POLICY "published or manageable drink ingredients for team"
ON public.drink_ingredientes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.drinks d
    WHERE d.id = drink_id
      AND (d.publicado = true OR d.created_by = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'))
  )
  AND EXISTS (SELECT 1 FROM public.ingredientes i WHERE i.id = ingrediente_id)
);