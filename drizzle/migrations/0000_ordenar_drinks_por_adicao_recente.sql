CREATE OR REPLACE VIEW public.drinks_lista WITH (security_invoker = on) AS
SELECT d.id, d.slug, d.nome, d.imagem_url, d.dificuldade, d.created_by,
  (SELECT count(*) FROM public.drink_ingredientes di WHERE di.drink_id = d.id)::integer AS total_ingredientes,
  (SELECT count(*) FROM public.drink_likes dl WHERE dl.drink_id = d.id)::integer AS total_curtidas,
  d.created_at
FROM public.drinks d;

GRANT SELECT ON public.drinks_lista TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.buscar_drinks_lista(
  _ingredientes uuid[] DEFAULT '{}'::uuid[],
  _categorias uuid[] DEFAULT '{}'::uuid[],
  _dificuldades text[] DEFAULT '{}'::text[],
  _qtd integer DEFAULT NULL,
  _comparador text DEFAULT 'igual',
  _limite integer DEFAULT 24,
  _offset integer DEFAULT 0,
  _ordem text DEFAULT 'nome-asc',
  _termo text DEFAULT ''
) RETURNS jsonb
LANGUAGE sql STABLE SET search_path TO 'public' AS $function$
WITH base AS (
  SELECT v.* FROM drinks_lista v
  WHERE (coalesce(cardinality(_dificuldades), 0) = 0 OR v.dificuldade = any(_dificuldades))
    AND (coalesce(cardinality(_ingredientes), 0) = 0 OR (
      SELECT count(DISTINCT di.ingrediente_id) FROM drink_ingredientes di
      WHERE di.drink_id = v.id AND di.ingrediente_id = any(_ingredientes)
    ) = (SELECT count(DISTINCT x) FROM unnest(_ingredientes) AS x))
    AND (coalesce(cardinality(_categorias), 0) = 0 OR (
      SELECT count(DISTINCT dc.categoria_id) FROM drink_drink_categorias dc
      WHERE dc.drink_id = v.id AND dc.categoria_id = any(_categorias)
    ) = (SELECT count(DISTINCT y) FROM unnest(_categorias) AS y))
    AND (_qtd IS NULL OR CASE _comparador
      WHEN 'ate' THEN v.total_ingredientes <= _qtd
      WHEN 'acima' THEN v.total_ingredientes >= _qtd
      ELSE v.total_ingredientes = _qtd
    END)
    AND (btrim(_termo) = '' OR public.slugify(v.nome) LIKE '%' || public.slugify(btrim(_termo)) || '%'
      OR EXISTS (
        SELECT 1 FROM drink_ingredientes di JOIN ingredientes i ON i.id = di.ingrediente_id
        WHERE di.drink_id = v.id AND public.slugify(i.nome) LIKE '%' || public.slugify(btrim(_termo)) || '%'
      )
      OR EXISTS (
        SELECT 1 FROM drink_drink_categorias dc JOIN drink_categorias c ON c.id = dc.categoria_id
        WHERE dc.drink_id = v.id AND public.slugify(c.nome) LIKE '%' || public.slugify(btrim(_termo)) || '%'
      ))
), ordenados AS (
  SELECT v.*, row_number() OVER (ORDER BY
    CASE WHEN _ordem = 'nome-desc' THEN v.nome END DESC NULLS LAST,
    CASE WHEN _ordem = 'recentes' THEN v.created_at END DESC NULLS LAST,
    CASE WHEN _ordem = 'facilidade' THEN CASE lower(v.dificuldade)
      WHEN 'fácil' THEN 1 WHEN 'facil' THEN 1 WHEN 'médio' THEN 2 WHEN 'medio' THEN 2
      WHEN 'difícil' THEN 3 WHEN 'dificil' THEN 3 ELSE 4 END END ASC NULLS LAST,
    CASE WHEN _ordem = 'ingredientes' THEN v.total_ingredientes END ASC NULLS LAST,
    CASE WHEN _ordem = 'curtidas' THEN v.total_curtidas END DESC NULLS LAST,
    CASE WHEN _ordem IN ('nome-asc', 'recentes', 'facilidade', 'ingredientes', 'curtidas')
      OR _ordem NOT IN ('nome-desc', 'recentes', 'facilidade', 'ingredientes', 'curtidas') THEN v.nome END ASC NULLS LAST,
    v.id ASC
  ) AS ordem_resultado FROM base v
)
SELECT jsonb_build_object(
  'total', (SELECT count(*) FROM base),
  'drinks', coalesce((SELECT jsonb_agg(item ORDER BY ordem_resultado) FROM (
    SELECT v.ordem_resultado,
      jsonb_build_object(
        'id', v.id, 'slug', v.slug, 'nome', v.nome, 'imagem_url', v.imagem_url,
        'dificuldade', v.dificuldade, 'created_by', v.created_by,
        'created_at', v.created_at, 'total_ingredientes', v.total_ingredientes,
        'total_curtidas', v.total_curtidas,
        'drink_ingredientes', coalesce((SELECT jsonb_agg(jsonb_build_object(
          'ingrediente_id', di.ingrediente_id,
          'ingredientes', jsonb_build_object('id', i.id, 'nome', i.nome,
            'categorias', CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('nome', c.nome) END)
        )) FROM drink_ingredientes di
        JOIN ingredientes i ON i.id = di.ingrediente_id
        LEFT JOIN categorias c ON c.id = i.categoria_id
        WHERE di.drink_id = v.id), '[]'::jsonb),
        'drink_drink_categorias', coalesce((SELECT jsonb_agg(jsonb_build_object(
          'categoria_id', dc.categoria_id,
          'drink_categorias', jsonb_build_object('id', k.id, 'nome', k.nome)
        )) FROM drink_drink_categorias dc JOIN drink_categorias k ON k.id = dc.categoria_id
        WHERE dc.drink_id = v.id), '[]'::jsonb)
      ) AS item
    FROM ordenados v ORDER BY v.ordem_resultado
    LIMIT greatest(_limite, 1) OFFSET greatest(_offset, 0)
  ) s), '[]'::jsonb)
)
$function$;

REVOKE ALL ON FUNCTION public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer, text, text) TO anon, authenticated, service_role;