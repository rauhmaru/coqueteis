
-- 1) Tighten profiles SELECT: self-only (admin reads via service role)
DROP POLICY IF EXISTS "profiles select all authenticated" ON public.profiles;
CREATE POLICY "profiles select self" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 2) Restrict storage 'drink-images' writes to editors/admins; keep public read (private bucket, signed URLs)
DROP POLICY IF EXISTS "drink images insert" ON storage.objects;
DROP POLICY IF EXISTS "drink images update" ON storage.objects;
DROP POLICY IF EXISTS "drink images delete" ON storage.objects;

CREATE POLICY "drink images insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drink-images' AND public.can_edit(auth.uid()));

CREATE POLICY "drink images update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'drink-images' AND public.can_edit(auth.uid()))
  WITH CHECK (bucket_id = 'drink-images' AND public.can_edit(auth.uid()));

CREATE POLICY "drink images delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'drink-images' AND public.can_edit(auth.uid()));

-- 3) Lock down SECURITY DEFINER functions
-- Trigger-only functions: revoke from everyone (only the trigger system invokes them)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helper functions used by RLS policies: revoke from PUBLIC/anon; authenticated needs EXECUTE
-- because RLS predicates run as the calling role (and policies reference these helpers).
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.can_edit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit(uuid) TO authenticated;
