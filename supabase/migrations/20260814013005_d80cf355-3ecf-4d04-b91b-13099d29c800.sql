
CREATE EXTENSION IF NOT EXISTS unaccent;

ALTER TABLE public.drinks ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent(_txt)), '[^a-z0-9]+', '-', 'g'))
$$;

-- backfill com desambiguação por sufixo numérico
WITH base AS (
  SELECT id, public.slugify(nome) AS s,
         row_number() OVER (PARTITION BY public.slugify(nome) ORDER BY created_at, id) AS rn
  FROM public.drinks
  WHERE slug IS NULL OR slug = ''
)
UPDATE public.drinks d
SET slug = CASE WHEN b.rn = 1 THEN b.s ELSE b.s || '-' || b.rn END
FROM base b
WHERE d.id = b.id;

UPDATE public.drinks SET slug = 'drink-' || left(id::text, 8) WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS drinks_slug_key ON public.drinks (slug);

CREATE OR REPLACE FUNCTION public.set_drink_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS drinks_set_slug ON public.drinks;
CREATE TRIGGER drinks_set_slug
BEFORE INSERT OR UPDATE OF nome, slug ON public.drinks
FOR EACH ROW EXECUTE FUNCTION public.set_drink_slug();
