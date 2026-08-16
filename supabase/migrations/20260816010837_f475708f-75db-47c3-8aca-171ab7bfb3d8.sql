CREATE TABLE public.seo_indexacao_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  tipo text NOT NULL DEFAULT 'drink',
  verdict text,
  coverage_state text,
  robots_txt_state text,
  indexing_state text,
  page_fetch_state text,
  last_crawl_time timestamptz,
  google_canonical text,
  user_canonical text,
  inspection_link text,
  erro text,
  consultado_em timestamptz NOT NULL DEFAULT now(),
  consultado_por uuid
);

CREATE INDEX seo_indexacao_log_url_idx ON public.seo_indexacao_log (url, consultado_em DESC);
CREATE INDEX seo_indexacao_log_consultado_em_idx ON public.seo_indexacao_log (consultado_em DESC);

GRANT SELECT ON public.seo_indexacao_log TO authenticated;
GRANT ALL ON public.seo_indexacao_log TO service_role;
ALTER TABLE public.seo_indexacao_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_indexacao_log admin read" ON public.seo_indexacao_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.seo_sitemap_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sitemap_url text NOT NULL,
  acao text NOT NULL DEFAULT 'status',
  total_urls integer,
  is_pending boolean,
  last_submitted timestamptz,
  last_downloaded timestamptz,
  warnings integer,
  errors integer,
  erro text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid
);

CREATE INDEX seo_sitemap_log_criado_em_idx ON public.seo_sitemap_log (criado_em DESC);

GRANT SELECT ON public.seo_sitemap_log TO authenticated;
GRANT ALL ON public.seo_sitemap_log TO service_role;
ALTER TABLE public.seo_sitemap_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seo_sitemap_log admin read" ON public.seo_sitemap_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));