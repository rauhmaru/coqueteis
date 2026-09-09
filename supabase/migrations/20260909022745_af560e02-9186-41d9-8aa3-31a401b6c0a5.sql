CREATE TABLE public.web_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rota text NOT NULL,
  metrica text NOT NULL CHECK (metrica IN ('LCP','CLS','INP','TTFB','FCP')),
  valor numeric NOT NULL CHECK (valor >= 0),
  avaliacao text,
  tipo_navegacao text,
  conexao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX web_vitals_metrica_created_idx ON public.web_vitals (metrica, created_at DESC);

GRANT ALL ON public.web_vitals TO service_role;
GRANT SELECT ON public.web_vitals TO authenticated;

ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "web_vitals admin read" ON public.web_vitals
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.web_vitals_resumo(_metrica text DEFAULT 'LCP', _dias integer DEFAULT 7)
RETURNS TABLE (rota text, amostras bigint, mediana numeric, p75 numeric)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  select v.rota,
         count(*) as amostras,
         round(percentile_cont(0.5) within group (order by v.valor)::numeric, 2) as mediana,
         round(percentile_cont(0.75) within group (order by v.valor)::numeric, 2) as p75
  from public.web_vitals v
  where v.metrica = _metrica
    and v.created_at >= now() - make_interval(days => greatest(_dias, 1))
  group by v.rota
  order by count(*) desc
$$;

REVOKE ALL ON FUNCTION public.web_vitals_resumo(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.web_vitals_resumo(text, integer) TO authenticated, service_role;