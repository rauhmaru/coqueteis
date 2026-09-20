DROP POLICY IF EXISTS "read all drink_categorias" ON public.drink_categorias;
CREATE POLICY "read valid drink_categorias"
ON public.drink_categorias
FOR SELECT
TO anon, authenticated
USING (id IS NOT NULL AND nome IS NOT NULL);

DROP POLICY IF EXISTS "read all drink_drink_categorias" ON public.drink_drink_categorias;
CREATE POLICY "read valid drink_drink_categorias"
ON public.drink_drink_categorias
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_drink_categorias.drink_id)
  AND EXISTS (SELECT 1 FROM public.drink_categorias c WHERE c.id = drink_drink_categorias.categoria_id)
);

DROP POLICY IF EXISTS "drink_ing public read" ON public.drink_ingredientes;
CREATE POLICY "drink_ing valid public read"
ON public.drink_ingredientes
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_ingredientes.drink_id)
  AND EXISTS (SELECT 1 FROM public.ingredientes i WHERE i.id = drink_ingredientes.ingrediente_id)
);

DROP POLICY IF EXISTS "ingredientes read all" ON public.ingredientes;
CREATE POLICY "ingredientes valid public read"
ON public.ingredientes
FOR SELECT
TO anon, authenticated
USING (id IS NOT NULL AND nome IS NOT NULL);

DROP POLICY IF EXISTS "Comentários visíveis para todos" ON public.drink_comentarios;
CREATE POLICY "Comentarios de drinks validos sao publicos"
ON public.drink_comentarios
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_comentarios.drink_id));

DROP POLICY IF EXISTS "Curtidas visíveis para todos" ON public.drink_likes;
CREATE POLICY "Curtidas de drinks validos sao publicas"
ON public.drink_likes
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_likes.drink_id));

DROP POLICY IF EXISTS "drinks read all" ON public.drinks;
CREATE POLICY "drinks validos sao publicos"
ON public.drinks
FOR SELECT
TO anon, authenticated
USING (id IS NOT NULL AND nome IS NOT NULL AND slug IS NOT NULL);

DROP POLICY IF EXISTS "categorias public read" ON public.categorias;
CREATE POLICY "categorias validas sao publicas"
ON public.categorias
FOR SELECT
TO anon, authenticated
USING (id IS NOT NULL AND nome IS NOT NULL);

DROP POLICY IF EXISTS "drink_redirects public read" ON public.drink_redirects;
CREATE POLICY "redirects para drinks validos sao publicos"
ON public.drink_redirects
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.drinks d WHERE d.id = drink_redirects.new_id));

DROP POLICY IF EXISTS "Curtidas de comentários visíveis para todos" ON public.comentario_likes;
CREATE POLICY "Curtidas de comentarios validos sao publicas"
ON public.comentario_likes
FOR SELECT
TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.drink_comentarios c WHERE c.id = comentario_likes.comentario_id));

DROP POLICY IF EXISTS "drink images read" ON storage.objects;