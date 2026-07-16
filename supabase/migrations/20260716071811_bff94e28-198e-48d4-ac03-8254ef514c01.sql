
-- Curtidas
CREATE TABLE public.drink_likes (
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (drink_id, user_id)
);
GRANT SELECT ON public.drink_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.drink_likes TO authenticated;
GRANT ALL ON public.drink_likes TO service_role;
ALTER TABLE public.drink_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas visíveis para todos"
  ON public.drink_likes FOR SELECT
  USING (true);
CREATE POLICY "Usuário curte como si próprio"
  ON public.drink_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário remove sua própria curtida"
  ON public.drink_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX drink_likes_drink_id_idx ON public.drink_likes (drink_id);

-- Comentários
CREATE TABLE public.drink_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  texto TEXT NOT NULL CHECK (char_length(texto) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.drink_comentarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drink_comentarios TO authenticated;
GRANT ALL ON public.drink_comentarios TO service_role;
ALTER TABLE public.drink_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários visíveis para todos"
  ON public.drink_comentarios FOR SELECT
  USING (true);
CREATE POLICY "Usuário comenta como si próprio"
  ON public.drink_comentarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário edita seu próprio comentário"
  ON public.drink_comentarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário remove seu próprio comentário"
  ON public.drink_comentarios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX drink_comentarios_drink_id_idx ON public.drink_comentarios (drink_id, created_at DESC);

CREATE TRIGGER update_drink_comentarios_updated_at
  BEFORE UPDATE ON public.drink_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
