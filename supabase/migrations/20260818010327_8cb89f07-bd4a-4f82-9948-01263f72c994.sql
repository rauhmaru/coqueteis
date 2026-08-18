CREATE TABLE public.drink_remocoes_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drink_id uuid,
  drink_nome text NOT NULL,
  drink_slug text,
  motivo text NOT NULL,
  removido_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  removido_por_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.drink_remocoes_log TO authenticated;
GRANT ALL ON public.drink_remocoes_log TO service_role;

ALTER TABLE public.drink_remocoes_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "remocoes log admin read" ON public.drink_remocoes_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "remocoes log insert self" ON public.drink_remocoes_log
  FOR INSERT TO authenticated
  WITH CHECK (removido_por = auth.uid());

CREATE INDEX idx_drink_remocoes_log_created_at ON public.drink_remocoes_log (created_at DESC);