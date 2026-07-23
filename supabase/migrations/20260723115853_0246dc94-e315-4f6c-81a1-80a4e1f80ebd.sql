CREATE TABLE public.drink_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (drink_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.drink_favoritos TO authenticated;
GRANT ALL ON public.drink_favoritos TO service_role;
ALTER TABLE public.drink_favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own favorites" ON public.drink_favoritos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own favorites" ON public.drink_favoritos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own favorites" ON public.drink_favoritos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_drink_favoritos_user ON public.drink_favoritos(user_id);
CREATE INDEX idx_drink_favoritos_drink ON public.drink_favoritos(drink_id);