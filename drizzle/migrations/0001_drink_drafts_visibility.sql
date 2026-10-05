ALTER TABLE public.drinks ADD COLUMN publicado boolean NOT NULL DEFAULT true;
CREATE INDEX drinks_drafts_created_at_idx ON public.drinks (created_at DESC) WHERE publicado = false;
DROP POLICY "drinks validos sao publicos" ON public.drinks;
CREATE POLICY "drinks publicados para visitantes" ON public.drinks FOR SELECT TO anon USING (publicado = true AND id IS NOT NULL AND nome IS NOT NULL AND slug IS NOT NULL);
CREATE POLICY "drinks publicados ou proprios para equipe" ON public.drinks FOR SELECT TO authenticated USING ((publicado = true AND id IS NOT NULL AND nome IS NOT NULL AND slug IS NOT NULL) OR created_by = (SELECT auth.uid()) OR public.has_role((SELECT auth.uid()), 'admin'));
COMMENT ON COLUMN public.drinks.publicado IS 'Only published drinks are visible to visitors; drafts remain accessible to their authors and administrators.';