CREATE OR REPLACE VIEW public.drinks_lista WITH (security_invoker = on) AS
SELECT d.id, d.slug, d.nome, d.imagem_url, d.dificuldade, d.created_by,
  (SELECT count(*) FROM public.drink_ingredientes di WHERE di.drink_id = d.id)::integer AS total_ingredientes,
  (SELECT count(*) FROM public.drink_likes dl WHERE dl.drink_id = d.id)::integer AS total_curtidas,
  d.created_at
FROM public.drinks d
WHERE d.publicado = true;
GRANT SELECT ON public.drinks_lista TO anon, authenticated, service_role;
CREATE OR REPLACE FUNCTION public.drinks_listados_somente_publicados()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $function$
BEGIN
  IF NEW.publicado = true AND (NEW.imagem_url IS NULL OR btrim(NEW.imagem_url) = '') THEN
    RAISE EXCEPTION 'Adicione uma imagem antes de publicar o drink';
  END IF;
  RETURN NEW;
END;
$function$;
COMMENT ON FUNCTION public.drinks_listados_somente_publicados() IS 'Available for validating future publication flows; existing recipes retain their status.';