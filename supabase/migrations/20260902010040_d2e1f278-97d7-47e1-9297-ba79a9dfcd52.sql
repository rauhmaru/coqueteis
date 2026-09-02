GRANT EXECUTE ON FUNCTION public.slugify(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.set_drink_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base text;
  candidate text;
  i int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;
  base := public.slugify(NEW.nome);
  IF base = '' OR base IS NULL THEN
    base := 'drink';
  END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.drinks WHERE slug = candidate AND id <> NEW.id) LOOP
    i := i + 1;
    candidate := base || '-' || i;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_drink_slug() FROM anon, authenticated;