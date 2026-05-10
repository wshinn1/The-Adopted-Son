-- Restore EXECUTE on is_admin() for authenticated role.
-- The previous security fix revoked from PUBLIC which also removed it from
-- authenticated, breaking RLS policies used in admin client-side saves.
-- Granting to authenticated (not anon) is the correct security posture:
-- only logged-in users can evaluate is_admin(), which is needed for RLS.

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
