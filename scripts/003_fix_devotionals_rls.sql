-- ============================================================
-- Fix RLS policies for devotionals to allow public access
-- ============================================================

-- Drop the existing policy that might be too restrictive
drop policy if exists "devotionals_select_published" on public.devotionals;

-- Create a new policy that explicitly allows anyone (including anon) to read published devotionals
create policy "devotionals_public_read" on public.devotionals
  for select 
  to anon, authenticated
  using (is_published = true);

-- Also ensure visitor_trials allows proper access
drop policy if exists "visitor_trials_select_service" on public.visitor_trials;

create policy "visitor_trials_select_all" on public.visitor_trials
  for select
  to anon, authenticated, service_role
  using (true);

-- Add converted_to_paid column if it doesn't exist
alter table public.visitor_trials 
  add column if not exists converted_to_paid boolean default false;
