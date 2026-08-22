create or replace function public.buscar_drinks(
  _ingredientes uuid[] default '{}',
  _categorias uuid[] default '{}',
  _dificuldades text[] default '{}',
  _qtd int default null,
  _comparador text default 'igual',
  _limite int default 24,
  _offset int default 0
) returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
with base as (
  select d.id, d.nome
  from drinks d
  where (coalesce(cardinality(_dificuldades),0) = 0 or d.dificuldade = any(_dificuldades))
    and (coalesce(cardinality(_ingredientes),0) = 0 or (
      select count(distinct di.ingrediente_id) from drink_ingredientes di
      where di.drink_id = d.id and di.ingrediente_id = any(_ingredientes)
    ) = (select count(distinct x) from unnest(_ingredientes) as x))
    and (coalesce(cardinality(_categorias),0) = 0 or (
      select count(distinct dc.categoria_id) from drink_drink_categorias dc
      where dc.drink_id = d.id and dc.categoria_id = any(_categorias)
    ) = (select count(distinct y) from unnest(_categorias) as y))
    and (_qtd is null or case _comparador
      when 'ate' then (select count(*) from drink_ingredientes di2 where di2.drink_id = d.id) <= _qtd
      when 'acima' then (select count(*) from drink_ingredientes di3 where di3.drink_id = d.id) >= _qtd
      else (select count(*) from drink_ingredientes di4 where di4.drink_id = d.id) = _qtd
    end)
)
select jsonb_build_object(
  'total', (select count(*) from base),
  'drinks', coalesce((
    select jsonb_agg(item order by ordem)
    from (
      select row_number() over (order by d.nome) as ordem,
        to_jsonb(d) || jsonb_build_object(
          'drink_ingredientes', coalesce((
            select jsonb_agg(jsonb_build_object(
              'ingrediente_id', di.ingrediente_id,
              'ingredientes', to_jsonb(i) || jsonb_build_object(
                'categorias', case when c.id is null then null else jsonb_build_object('nome', c.nome) end
              )
            ))
            from drink_ingredientes di
            join ingredientes i on i.id = di.ingrediente_id
            left join categorias c on c.id = i.categoria_id
            where di.drink_id = d.id
          ), '[]'::jsonb),
          'drink_drink_categorias', coalesce((
            select jsonb_agg(jsonb_build_object(
              'categoria_id', dc.categoria_id,
              'drink_categorias', jsonb_build_object('id', k.id, 'nome', k.nome)
            ))
            from drink_drink_categorias dc
            join drink_categorias k on k.id = dc.categoria_id
            where dc.drink_id = d.id
          ), '[]'::jsonb)
        ) as item
      from drinks d
      join base b on b.id = d.id
      order by d.nome
      limit greatest(_limite, 1) offset greatest(_offset, 0)
    ) s
  ), '[]'::jsonb)
)
$$;

grant execute on function public.buscar_drinks(uuid[], uuid[], text[], int, text, int, int) to anon, authenticated;