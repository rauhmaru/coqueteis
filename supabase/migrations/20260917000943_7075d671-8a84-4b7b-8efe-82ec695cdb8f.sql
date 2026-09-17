CREATE TABLE public.mixologia_postagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text NOT NULL,
  resumo text NOT NULL,
  conteudo_markdown text NOT NULL,
  imagem_url text,
  imagem_alt text,
  publicado boolean NOT NULL DEFAULT false,
  publicado_em timestamp with time zone,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT mixologia_postagens_titulo_check CHECK (char_length(btrim(titulo)) BETWEEN 3 AND 120),
  CONSTRAINT mixologia_postagens_slug_check CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT mixologia_postagens_resumo_check CHECK (char_length(btrim(resumo)) BETWEEN 10 AND 220),
  CONSTRAINT mixologia_postagens_conteudo_check CHECK (char_length(btrim(conteudo_markdown)) >= 20),
  CONSTRAINT mixologia_postagens_publicacao_check CHECK (
    NOT publicado OR (
      imagem_url IS NOT NULL AND btrim(imagem_url) <> '' AND
      imagem_alt IS NOT NULL AND char_length(btrim(imagem_alt)) >= 3
    )
  )
);

CREATE UNIQUE INDEX mixologia_postagens_slug_key ON public.mixologia_postagens (slug);
CREATE INDEX mixologia_postagens_publicadas_idx ON public.mixologia_postagens (publicado, publicado_em DESC);

GRANT SELECT ON public.mixologia_postagens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mixologia_postagens TO authenticated;
GRANT ALL ON public.mixologia_postagens TO service_role;

ALTER TABLE public.mixologia_postagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Postagens publicadas sao publicas"
ON public.mixologia_postagens
FOR SELECT
TO anon
USING (publicado = true);

CREATE POLICY "Publicadas ou administracao podem consultar postagens"
ON public.mixologia_postagens
FOR SELECT
TO authenticated
USING (publicado = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Administradores podem criar postagens"
ON public.mixologia_postagens
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "Administradores podem editar postagens"
ON public.mixologia_postagens
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Administradores podem remover postagens"
ON public.mixologia_postagens
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_mixologia_postagem_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base text;
  candidate text;
  suffix integer := 1;
BEGIN
  NEW.titulo := btrim(NEW.titulo);
  NEW.resumo := btrim(NEW.resumo);
  NEW.conteudo_markdown := btrim(NEW.conteudo_markdown);
  NEW.imagem_url := nullif(btrim(NEW.imagem_url), '');
  NEW.imagem_alt := nullif(btrim(NEW.imagem_alt), '');

  base := public.slugify(coalesce(nullif(btrim(NEW.slug), ''), NEW.titulo));
  IF base = '' OR base IS NULL THEN
    base := 'postagem';
  END IF;
  candidate := base;
  WHILE EXISTS (
    SELECT 1 FROM public.mixologia_postagens p
    WHERE p.slug = candidate AND p.id <> NEW.id
  ) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;
  NEW.slug := candidate;

  IF NEW.publicado AND NEW.publicado_em IS NULL THEN
    NEW.publicado_em := now();
  ELSIF NOT NEW.publicado THEN
    NEW.publicado_em := NULL;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_mixologia_postagem_fields() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_mixologia_postagem_fields() TO service_role;

CREATE TRIGGER mixologia_postagens_set_fields
BEFORE INSERT OR UPDATE ON public.mixologia_postagens
FOR EACH ROW
EXECUTE FUNCTION public.set_mixologia_postagem_fields();