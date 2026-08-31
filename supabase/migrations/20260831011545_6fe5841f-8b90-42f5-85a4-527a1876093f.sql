CREATE OR REPLACE FUNCTION public.unificar_ingredientes(
  _ids uuid[],
  _destino uuid,
  _novo_nome text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _origens uuid[];
  _vinculos int := 0;
  _bar int := 0;
  _removidos int := 0;
  _nome_final text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem unificar ingredientes';
  END IF;

  IF _destino IS NULL OR NOT (_destino = ANY(_ids)) THEN
    RAISE EXCEPTION 'O ingrediente de destino deve estar entre os selecionados';
  END IF;

  SELECT array_agg(DISTINCT x) INTO _origens
  FROM unnest(_ids) AS x
  WHERE x <> _destino;

  IF _origens IS NULL OR cardinality(_origens) = 0 THEN
    RAISE EXCEPTION 'Selecione ao menos dois ingredientes';
  END IF;

  -- marca opcional=false quando algum vínculo do destino já é obrigatório
  UPDATE public.drink_ingredientes di
  SET opcional = false
  WHERE di.ingrediente_id = _destino
    AND di.opcional = true
    AND EXISTS (
      SELECT 1 FROM public.drink_ingredientes o
      WHERE o.drink_id = di.drink_id
        AND o.ingrediente_id = ANY(_origens)
        AND o.opcional = false
    );

  -- reponta vínculos que ainda não existem no destino
  UPDATE public.drink_ingredientes di
  SET ingrediente_id = _destino
  WHERE di.ingrediente_id = ANY(_origens)
    AND NOT EXISTS (
      SELECT 1 FROM public.drink_ingredientes d2
      WHERE d2.drink_id = di.drink_id AND d2.ingrediente_id = _destino
    );
  GET DIAGNOSTICS _vinculos = ROW_COUNT;

  -- remove vínculos duplicados restantes
  DELETE FROM public.drink_ingredientes WHERE ingrediente_id = ANY(_origens);

  -- reponta estoque dos usuários
  UPDATE public.meu_bar mb
  SET ingrediente_id = _destino
  WHERE mb.ingrediente_id = ANY(_origens)
    AND NOT EXISTS (
      SELECT 1 FROM public.meu_bar m2
      WHERE m2.user_id = mb.user_id AND m2.ingrediente_id = _destino
    );
  GET DIAGNOSTICS _bar = ROW_COUNT;

  DELETE FROM public.meu_bar WHERE ingrediente_id = ANY(_origens);

  DELETE FROM public.ingredientes WHERE id = ANY(_origens);
  GET DIAGNOSTICS _removidos = ROW_COUNT;

  IF _novo_nome IS NOT NULL AND btrim(_novo_nome) <> '' THEN
    UPDATE public.ingredientes
    SET nome = btrim(regexp_replace(_novo_nome, '\s+', ' ', 'g'))
    WHERE id = _destino;
  END IF;

  SELECT nome INTO _nome_final FROM public.ingredientes WHERE id = _destino;

  RETURN jsonb_build_object(
    'destino', _destino,
    'nome', _nome_final,
    'vinculos_movidos', _vinculos,
    'estoques_movidos', _bar,
    'ingredientes_removidos', _removidos
  );
END;
$$;

REVOKE ALL ON FUNCTION public.unificar_ingredientes(uuid[], uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unificar_ingredientes(uuid[], uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.unificar_ingredientes(uuid[], uuid, text) TO authenticated;