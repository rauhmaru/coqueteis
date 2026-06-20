
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public;
revoke execute on function public.can_edit(uuid) from public;
grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.can_edit(uuid) to anon, authenticated;
