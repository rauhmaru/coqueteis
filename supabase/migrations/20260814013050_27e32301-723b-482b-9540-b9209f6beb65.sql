
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION unaccent SET SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.slugify(_txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT trim(both '-' from regexp_replace(lower(extensions.unaccent(_txt)), '[^a-z0-9]+', '-', 'g'))
$$;

REVOKE ALL ON FUNCTION public.slugify(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_drink_slug() FROM PUBLIC, anon, authenticated;
