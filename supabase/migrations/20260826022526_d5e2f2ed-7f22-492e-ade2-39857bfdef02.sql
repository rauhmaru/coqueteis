-- Visão de catálogo: colunas do card + contagem agregada de ingredientes.
create or replace view public.drinks_lista
with (security_invoker = on) as
select
  d.id,
  d.slug,
  d.nome,
  d.imagem_url,
  d.dificuldade,
  d.created_by,
  (select count(*) from public.drink_ingredientes di where di.drink_id = d.id)::int as total_ingredientes
from public.drinks d;

grant select on public.drinks_lista to anon, authenticated;
grant select on public.drinks_lista to service_role;

-- Busca paginada enxuta: só o necessário para a listagem.
create or replace function public.buscar_drinks_lista(
  _ingredientes uuid[] default '{}'::uuid[],
  _categorias uuid[] default '{}'::uuid[],
  _dificuldades text[] default '{}'::text[],
  _qtd integer default null,
  _comparador text default 'igual',
  _limite integer default 24,
  _offset integer default 0
)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
with base as (
  select v.id, v.nome
  from drinks_lista v
  where (coalesce(cardinality(_dificuldades),0) = 0 or v.dificuldade = any(_dificuldades))
    and (coalesce(cardinality(_ingredientes),0) = 0 or (
      select count(distinct di.ingrediente_id) from drink_ingredientes di
      where di.drink_id = v.id and di.ingrediente_id = any(_ingredientes)
    ) = (select count(distinct x) from unnest(_ingredientes) as x))
    and (coalesce(cardinality(_categorias),0) = 0 or (
      select count(distinct dc.categoria_id) from drink_drink_categorias dc
      where dc.drink_id = v.id and dc.categoria_id = any(_categorias)
    ) = (select count(distinct y) from unnest(_categorias) as y))
    and (_qtd is null or case _comparador
      when 'ate' then v.total_ingredientes <= _qtd
      when 'acima' then v.total_ingredientes >= _qtd
      else v.total_ingredientes = _qtd
    end)
)
select jsonb_build_object(
  'total', (select count(*) from base),
  'drinks', coalesce((
    select jsonb_agg(item order by ordem)
    from (
      select row_number() over (order by v.nome) as ordem,
        jsonb_build_object(
          'id', v.id,
          'slug', v.slug,
          'nome', v.nome,
          'imagem_url', v.imagem_url,
          'dificuldade', v.dificuldade,
          'created_by', v.created_by,
          'total_ingredientes', v.total_ingredientes,
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
      from drinks_lista v
      join base b on b.id = v.id
      order by v.nome
      limit greatest(_limite, 1) offset greatest(_offset, 0)
    ) s
  ), '[]'::jsonb)
)
$function$;

revoke all on function public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer) from public;
grant execute on function public.buscar_drinks_lista(uuid[], uuid[], text[], integer, text, integer, integer) to anon, authenticated, service_role;