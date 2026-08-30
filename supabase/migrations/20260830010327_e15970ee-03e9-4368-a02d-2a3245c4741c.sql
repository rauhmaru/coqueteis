-- 1) coluna opcional nos vínculos
ALTER TABLE public.drink_ingredientes
  ADD COLUMN IF NOT EXISTS opcional boolean NOT NULL DEFAULT false;

-- 2) unificar ingredientes com sufixo "(opcional)"
DO $$
DECLARE
  dup record;
  canon_id uuid;
  base text;
BEGIN
  FOR dup IN
    SELECT id, nome FROM public.ingredientes WHERE nome ~* '\(opcional\)\s*$'
  LOOP
    base := trim(regexp_replace(dup.nome, '\(opcional\)\s*$', '', 'i'));

    SELECT id INTO canon_id
      FROM public.ingredientes
     WHERE id <> dup.id AND public.slugify(nome) = public.slugify(base)
     LIMIT 1;

    IF canon_id IS NULL THEN
      UPDATE public.ingredientes SET nome = base WHERE id = dup.id;
      UPDATE public.drink_ingredientes SET opcional = true WHERE ingrediente_id = dup.id;
    ELSE
      INSERT INTO public.drink_ingredientes (drink_id, ingrediente_id, opcional)
        SELECT drink_id, canon_id, true FROM public.drink_ingredientes WHERE ingrediente_id = dup.id
        ON CONFLICT (drink_id, ingrediente_id) DO UPDATE SET opcional = true;
      DELETE FROM public.drink_ingredientes WHERE ingrediente_id = dup.id;

      INSERT INTO public.meu_bar (user_id, ingrediente_id, preco_garrafa, volume_garrafa_ml, observacoes)
        SELECT user_id, canon_id, preco_garrafa, volume_garrafa_ml, observacoes
          FROM public.meu_bar WHERE ingrediente_id = dup.id
        ON CONFLICT DO NOTHING;
      DELETE FROM public.meu_bar WHERE ingrediente_id = dup.id;

      DELETE FROM public.ingredientes WHERE id = dup.id;
    END IF;
  END LOOP;
END $$;

-- 3) capitalização: primeira letra maiúscula, preservando o resto do nome
UPDATE public.ingredientes
   SET nome = upper(left(nome, 1)) || substr(nome, 2)
 WHERE left(nome, 1) <> upper(left(nome, 1));

-- 4) mesclar quaisquer duplicatas remanescentes por nome normalizado
DO $$
DECLARE
  grp record;
  keep_id uuid;
  other record;
BEGIN
  FOR grp IN
    SELECT public.slugify(nome) AS chave
      FROM public.ingredientes
     GROUP BY public.slugify(nome)
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keep_id FROM public.ingredientes
     WHERE public.slugify(nome) = grp.chave ORDER BY created_at LIMIT 1;

    FOR other IN
      SELECT id FROM public.ingredientes
       WHERE public.slugify(nome) = grp.chave AND id <> keep_id
    LOOP
      INSERT INTO public.drink_ingredientes (drink_id, ingrediente_id, opcional)
        SELECT drink_id, keep_id, opcional FROM public.drink_ingredientes WHERE ingrediente_id = other.id
        ON CONFLICT (drink_id, ingrediente_id) DO NOTHING;
      DELETE FROM public.drink_ingredientes WHERE ingrediente_id = other.id;

      INSERT INTO public.meu_bar (user_id, ingrediente_id, preco_garrafa, volume_garrafa_ml, observacoes)
        SELECT user_id, keep_id, preco_garrafa, volume_garrafa_ml, observacoes
          FROM public.meu_bar WHERE ingrediente_id = other.id
        ON CONFLICT DO NOTHING;
      DELETE FROM public.meu_bar WHERE ingrediente_id = other.id;

      DELETE FROM public.ingredientes WHERE id = other.id;
    END LOOP;
  END LOOP;
END $$;

-- 5) unicidade sobre o nome normalizado
CREATE UNIQUE INDEX IF NOT EXISTS ingredientes_nome_normalizado_key
  ON public.ingredientes (public.slugify(nome));