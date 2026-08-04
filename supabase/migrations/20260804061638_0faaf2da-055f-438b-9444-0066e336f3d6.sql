CREATE TABLE public.meu_bar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingrediente_id uuid NOT NULL REFERENCES public.ingredientes(id) ON DELETE CASCADE,
  preco_garrafa numeric,
  volume_garrafa_ml numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, ingrediente_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meu_bar TO authenticated;
GRANT ALL ON public.meu_bar TO service_role;

ALTER TABLE public.meu_bar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meu_bar select self" ON public.meu_bar FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "meu_bar insert self" ON public.meu_bar FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "meu_bar update self" ON public.meu_bar FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "meu_bar delete self" ON public.meu_bar FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER meu_bar_set_updated_at BEFORE UPDATE ON public.meu_bar
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();