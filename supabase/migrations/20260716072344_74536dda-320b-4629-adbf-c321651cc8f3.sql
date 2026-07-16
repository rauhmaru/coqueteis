
CREATE TABLE public.comentario_likes (
  comentario_id UUID NOT NULL REFERENCES public.drink_comentarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comentario_id, user_id)
);
GRANT SELECT ON public.comentario_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.comentario_likes TO authenticated;
GRANT ALL ON public.comentario_likes TO service_role;
ALTER TABLE public.comentario_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Curtidas de comentários visíveis para todos"
  ON public.comentario_likes FOR SELECT
  USING (true);
CREATE POLICY "Usuário curte comentário como si próprio"
  ON public.comentario_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário remove sua própria curtida de comentário"
  ON public.comentario_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX comentario_likes_comentario_id_idx ON public.comentario_likes (comentario_id);
