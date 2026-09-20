create or replace view public.drinks_lista
with (security_invoker = on) as
select
  d.id,
  d.slug,
  d.nome,
  d.imagem_url,
  d.dificuldade,
  d.created_by,
  (select count(*) from public.drink_ingredientes di where di.drink_id = d.id)::int as total_ingredientes,
  (select count(*) from public.drink_likes dl where dl.drink_id = d.id)::int as total_curtidas
from public.drinks d;

grant select on public.drinks_lista to anon, authenticated;
grant select on public.drinks_lista to service_role;

create or replace function public.buscar_drinks_lista(
  _ingredientes uuid[] default '{}'::uuid[],
  _categorias uuid[] default '{}'::uuid[],
  _dificuldades text[] default '{}'::text[],
  _qtd integer default null,
  _comparador text default 'igual',
  _limite integer default 24,
  _offset integer default 0,
  _ordem text default 'nome-asc',
  _termo text default ''
)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
with base as (
  select v.*
  from drinks_lista v
  where (coalesce(cardinality(_dificuldades), 0) = 0 or v.dificuldade = any(_dificuldades))
    and (coalesce(cardinality(_ingredientes), 0) = 0 or (
      select count(distinct di.ingrediente_id) from drink_ingredientes di
      where di.drink_id = v.id and di.ingrediente_id = any(_ingredientes)
    ) = (select count(distinct x) from unnest(_ingredientes) as x))
    and (coalesce(cardinality(_categorias), 0) = 0 or (
      select count(distinct dc.categoria_id) from drink_drink_categorias dc
      where dc.drink_id = v.id and dc.categoria_id = any(_categorias)
    ) = (select count(distinct y) from unnest(_categorias) as y))
    and (_qtd is null or case _comparador
      when 'ate' then v.total_ingredientes <= _qtd
      when 'acima' then v.total_ingredientes >= _qtd
      else v.total_ingredientes = _qtd
    end)
    and (btrim(_termo) = '' or public.slugify(v.nome) like '%' || public.slugify(btrim(_termo)) || '%'
      or exists (
        select 1 from drink_ingredientes di
        join ingredientes i on i.id = di.ingrediente_id
        where di.drink_id = v.id
          and public.slugify(i.nome) like '%' || public.slugify(btrim(_termo)) || '%'
      )
      or exists (
        select 1 from drink_drink_categorias dc
        join drink_categorias c on c.id = dc.categoria_id
        where dc.drink_id = v.id
          and public.slugify(c.nome) like '%' || public.slugify(btrim(_termo)) || '%'
      ))
), ordenados as (
  select v.*,
    row_number() over (
      order by
        case when _ordem = 'nome-desc' then v.nome end desc nulls last,
        case when _ordem = 'facilidade' then case lower(v.dificuldade) when 'fácil' then 1 when 'facil' then 1 when 'médio' then 2 when 'medio' then 2 when 'difícil' then 3 when 'dificil' then 3 else 4 end end asc nulls last,
        case when _ordem = 'ingredientes' then v.total_ingredientes end asc nulls last,
        case when _ordem = 'curtidas' then v.total_curtidas end desc nulls last,
        case when _ordem in ('nome-asc', 'facilidade', 'ingredientes', 'curtidas') or _ordem not in ('nome-desc', 'facilidade', 'ingredientes', 'curtidas') then v.nome end asc nulls last,
        v.id asc
    ) as ordem_resultado
  from base v
)
select jsonb_build_object(
  'total', (select count(*) from base),
  'drinks', coalesce((
    select jsonb_agg(item order by ordem_resultado)
    from (
      select v.ordem_resultado,
        jsonb_build_object(
          'id', v.id,
          'slug', v.slug,
          'nome', v.nome,
          'imagem_url', v.imagem_url,
          'dificuldade', v.dificuldade,
          'created_by', v.created_by,
          'total_ingredientes', v.total_ingredientes,
          'total_curtidas', v.total_curtidas,
          'drink_ingredientes', coalesce((
            select jsonb_agg(jsonb_build_object(
              'ingrediente_id', di.ingrediente_id,
              'ingredientes', jsonb_build_object(
                'id', i.id,
                'nome', i.nome,
                'categorias', case when c.id is null then null else jsonb_build_object('nome', c.nome) end
              )
            ))
            from drink_ingredientes di
            join ingredientes i on i.id = di.ingrediente_id
            left join categorias c on c.id = i.categoria_id
            where di.drink_id = v.id
          ), '[]'::jsonb),
          'drink_drink_categorias', coalesce((
            select jsonb_agg(jsonb_build_object(
              'categoria_id', dc.categoria_id,
              'drink_categorias', jsonb_build_object('id', k.id, 'nome', k.nome)
            ))
            from drink_drink_categorias dc
            join drink_categorias k on k.id = dc.categoria_id
            where dc.drink_id = v.id
          ), '[]'::jsonb)
        ) as item
      from ordenados v
      order by v.ordem_resultado
      limit greatest(_limite, 1) offset greatest(_offset, 0)
    ) s
  ), '[]'::jsonb)
)
$function$;

revoke all on function public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer, text, text) from public;
grant execute on function public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer, text, text) to anon, authenticated, service_role;