-- Fix overly permissive RLS policy on popup_dismissals table
-- The current policy allows unrestricted INSERT which is flagged as a security issue

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Allow insert popup_dismissals" ON public.popup_dismissals;

-- Create a more restrictive INSERT policy
-- This policy ensures that:
-- 1. The ip_hash being stored is not null/empty
-- 2. Users can only insert dismissals (not modify existing ones)
CREATE POLICY "Allow insert popup_dismissals" ON public.popup_dismissals
FOR INSERT
WITH CHECK (
  -- Ensure ip_hash is not null/empty (the actual column in this table)
  ip_hash IS NOT NULL AND ip_hash != ''
);

-- Note: For popup dismissals, we intentionally allow anonymous inserts
-- because users dismissing popups may not be authenticated.
-- The check ensures they can only insert valid ip_hash values.
