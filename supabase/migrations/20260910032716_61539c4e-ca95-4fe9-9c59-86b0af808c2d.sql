create or replace function public.admin_metricas()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resultado jsonb;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totais', (select jsonb_build_object(
      'drinks', (select count(*) from public.drinks),
      'ingredientes', (select count(*) from public.ingredientes),
      'categorias', (select count(*) from public.drink_categorias),
      'comentarios', (select count(*) from public.drink_comentarios),
      'curtidas', (select count(*) from public.drink_likes),
      'favoritos', (select count(*) from public.drink_favoritos),
      'usuarios', (select count(*) from public.profiles)
    )),
    'por_dificuldade', (select coalesce(jsonb_agg(jsonb_build_object('dificuldade', dificuldade, 'total', total) order by total desc), '[]'::jsonb)
      from (select dificuldade, count(*) as total from public.drinks group by dificuldade) t),
    'por_categoria', (select coalesce(jsonb_agg(jsonb_build_object('categoria', nome, 'total', total) order by total desc), '[]'::jsonb)
      from (select dc.nome, count(*) as total from public.drink_drink_categorias ddc join public.drink_categorias dc on dc.id = ddc.categoria_id group by dc.nome) t),
    'top_curtidos', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'slug', slug, 'total', total) order by total desc), '[]'::jsonb)
      from (select d.nome, d.slug, count(*) as total from public.drink_likes dl join public.drinks d on d.id = dl.drink_id group by d.id, d.nome, d.slug order by count(*) desc limit 5) t),
    'top_comentados', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'slug', slug, 'total', total) order by total desc), '[]'::jsonb)
      from (select d.nome, d.slug, count(*) as total from public.drink_comentarios dc join public.drinks d on d.id = dc.drink_id group by d.id, d.nome, d.slug order by count(*) desc limit 5) t),
    'visitas_7d', (select coalesce(jsonb_agg(jsonb_build_object('dia', dia, 'visitas', amostras * 5) order by dia), '[]'::jsonb)
      from (select created_at::date as dia, count(*) as amostras from public.web_vitals where metrica = 'LCP' and created_at >= now() - interval '7 days' group by created_at::date) t),
    'rotas_mais_vistas', (select coalesce(jsonb_agg(jsonb_build_object('rota', rota, 'visitas', amostras * 5) order by amostras * 5 desc), '[]'::jsonb)
      from (select rota, count(*) as amostras from public.web_vitals where metrica = 'LCP' and created_at >= now() - interval '7 days' group by rota order by count(*) desc limit 8) t)
  ) into resultado;

  return resultado;
end;
$$;

revoke all on function public.admin_metricas() from public, anon;
grant execute on function public.admin_metricas() to authenticated;
grant execute on function public.admin_metricas() to service_role;