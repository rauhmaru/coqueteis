
-- 1. handle_new_user: só primeiro usuário vira admin; demais sem role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  end if;

  return new;
end;
$function$;

-- 2. Remover role editor de contas que não sejam admin
DELETE FROM public.user_roles
WHERE role = 'editor'
  AND user_id NOT IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- 3. drink_ingredientes: políticas por posse do drink
DROP POLICY IF EXISTS "drink_ing editor write insert" ON public.drink_ingredientes;
DROP POLICY IF EXISTS "drink_ing editor write delete" ON public.drink_ingredientes;
DROP POLICY IF EXISTS "drink_ing editor write update" ON public.drink_ingredientes;

CREATE POLICY "drink_ing owner insert" ON public.drink_ingredientes
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.drinks d
  WHERE d.id = drink_ingredientes.drink_id
    AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "drink_ing owner delete" ON public.drink_ingredientes
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.drinks d
  WHERE d.id = drink_ingredientes.drink_id
    AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

CREATE POLICY "drink_ing owner update" ON public.drink_ingredientes
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.drinks d
  WHERE d.id = drink_ingredientes.drink_id
    AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.drinks d
  WHERE d.id = drink_ingredientes.drink_id
    AND (d.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));
