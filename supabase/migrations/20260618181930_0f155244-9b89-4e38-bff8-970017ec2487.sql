
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.ingredientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ingredientes TO anon, authenticated;
GRANT ALL ON public.ingredientes TO service_role;
ALTER TABLE public.ingredientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico ingredientes" ON public.ingredientes FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.drinks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  preparo TEXT NOT NULL DEFAULT '',
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drinks TO anon, authenticated;
GRANT ALL ON public.drinks TO service_role;
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico drinks" ON public.drinks FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.drink_ingredientes (
  drink_id UUID NOT NULL REFERENCES public.drinks(id) ON DELETE CASCADE,
  ingrediente_id UUID NOT NULL REFERENCES public.ingredientes(id) ON DELETE CASCADE,
  PRIMARY KEY (drink_id, ingrediente_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drink_ingredientes TO anon, authenticated;
GRANT ALL ON public.drink_ingredientes TO service_role;
ALTER TABLE public.drink_ingredientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico drink_ingredientes" ON public.drink_ingredientes FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_ingredientes_categoria ON public.ingredientes(categoria_id);
CREATE INDEX idx_drink_ingredientes_ingrediente ON public.drink_ingredientes(ingrediente_id);
