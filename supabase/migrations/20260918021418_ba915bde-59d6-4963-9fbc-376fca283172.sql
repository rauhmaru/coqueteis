ALTER FUNCTION public.set_mixologia_postagem_fields() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.set_mixologia_postagem_fields() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_mixologia_postagem_fields() TO service_role;