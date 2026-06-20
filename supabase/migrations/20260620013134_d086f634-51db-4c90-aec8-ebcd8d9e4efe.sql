
-- Papéis
create type public.app_role as enum ('admin', 'editor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.can_edit(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role in ('admin', 'editor')
  )
$$;

create policy "user_roles select self or admin"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "user_roles admin insert"
  on public.user_roles for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "user_roles admin update"
  on public.user_roles for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "user_roles admin delete"
  on public.user_roles for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "profiles select all authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles update self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Trigger ao criar usuário: cria profile e atribui role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_users int;
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;

  select count(*) into total_users from public.profiles;
  if total_users <= 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
      on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'editor')
      on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Atualiza políticas das tabelas de catálogo: leitura pública, escrita restrita
drop policy if exists "acesso publico categorias" on public.categorias;
drop policy if exists "acesso publico ingredientes" on public.ingredientes;
drop policy if exists "acesso publico drinks" on public.drinks;
drop policy if exists "acesso publico drink_ingredientes" on public.drink_ingredientes;

-- categorias
create policy "categorias public read" on public.categorias for select to anon, authenticated using (true);
create policy "categorias editor write insert" on public.categorias for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "categorias editor write update" on public.categorias for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "categorias editor write delete" on public.categorias for delete to authenticated using (public.can_edit(auth.uid()));

-- ingredientes
create policy "ingredientes public read" on public.ingredientes for select to anon, authenticated using (true);
create policy "ingredientes editor write insert" on public.ingredientes for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "ingredientes editor write update" on public.ingredientes for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "ingredientes editor write delete" on public.ingredientes for delete to authenticated using (public.can_edit(auth.uid()));

-- drinks
create policy "drinks public read" on public.drinks for select to anon, authenticated using (true);
create policy "drinks editor write insert" on public.drinks for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "drinks editor write update" on public.drinks for update to authenticated using (public.can_edit(auth.uid())) with check (public.can_edit(auth.uid()));
create policy "drinks editor write delete" on public.drinks for delete to authenticated using (public.can_edit(auth.uid()));

-- drink_ingredientes
create policy "drink_ing public read" on public.drink_ingredientes for select to anon, authenticated using (true);
create policy "drink_ing editor write insert" on public.drink_ingredientes for insert to authenticated with check (public.can_edit(auth.uid()));
create policy "drink_ing editor write delete" on public.drink_ingredientes for delete to authenticated using (public.can_edit(auth.uid()));

-- Garante que anon não tem write (revoga eventuais grants padrão)
revoke insert, update, delete on public.categorias, public.ingredientes, public.drinks, public.drink_ingredientes from anon;
grant select on public.categorias, public.ingredientes, public.drinks, public.drink_ingredientes to anon;
grant insert, update, delete on public.categorias, public.ingredientes, public.drinks, public.drink_ingredientes to authenticated;
