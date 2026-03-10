-- ============================================================
-- The Adopted Son - Devotional Blog Platform
-- Database Schema Migration
-- ============================================================

-- -------------------------------------------------------
-- 1. PROFILES
-- -------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  is_admin boolean not null default false,
  stripe_customer_id text unique,
  subscription_status text default 'none', -- 'none' | 'trialing' | 'active' | 'canceled' | 'past_due'
  subscription_plan text, -- 'monthly' | 'annual'
  subscription_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
-- Admins can read all profiles
create policy "profiles_admin_select" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
-- Service role can do everything (for webhooks)
create policy "profiles_service_all" on public.profiles
  for all using (auth.role() = 'service_role');

-- -------------------------------------------------------
-- 2. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -------------------------------------------------------
-- 3. VISITOR TRIALS (IP-based free trial)
-- -------------------------------------------------------
create table if not exists public.visitor_trials (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  email text,
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  email_captured_at timestamptz,
  converted_to_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.visitor_trials enable row level security;

-- Only service role can read/write visitor trials (handled by API routes)
create policy "visitor_trials_service_all" on public.visitor_trials
  for all using (auth.role() = 'service_role');
-- Allow anon to insert (for trial tracking via API)
create policy "visitor_trials_anon_insert" on public.visitor_trials
  for insert with check (true);
-- Allow reading own trial by IP (via service role in API)
create policy "visitor_trials_select_service" on public.visitor_trials
  for select using (auth.role() = 'service_role' or auth.role() = 'anon');

-- -------------------------------------------------------
-- 4. DEVOTIONALS
-- -------------------------------------------------------
create table if not exists public.devotionals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text not null default '',
  featured_image_url text,
  author_id uuid references auth.users(id) on delete set null,
  is_premium boolean not null default true,
  is_published boolean not null default false,
  published_at timestamptz,
  scripture_reference text,
  scripture_text text,
  tags text[] default '{}',
  read_time_minutes int default 5,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.devotionals enable row level security;

-- Public can read published devotionals
create policy "devotionals_select_published" on public.devotionals
  for select using (is_published = true);
-- Admins can do everything
create policy "devotionals_admin_all" on public.devotionals
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- -------------------------------------------------------
-- 5. MEDIA
-- -------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  original_name text not null,
  blob_url text not null,
  blob_pathname text not null,
  mime_type text not null,
  size_bytes bigint not null,
  alt_text text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

-- Admins can manage all media
create policy "media_admin_all" on public.media
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
-- Public can read media (images used in devotionals)
create policy "media_select_all" on public.media
  for select using (true);

-- -------------------------------------------------------
-- 6. SUBSCRIPTION PLANS (config table)
-- -------------------------------------------------------
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique, -- 'monthly' | 'annual'
  stripe_price_id text not null unique,
  price_in_cents int not null,
  interval text not null, -- 'month' | 'year'
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.subscription_plans enable row level security;

create policy "plans_select_all" on public.subscription_plans
  for select using (true);
create policy "plans_admin_all" on public.subscription_plans
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- -------------------------------------------------------
-- 7. PAGES (CMS pages - e.g. About, Contact, etc.)
-- -------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  meta_description text,
  is_published boolean not null default false,
  show_in_nav boolean not null default false,
  nav_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;

create policy "pages_select_published" on public.pages
  for select using (is_published = true);
create policy "pages_admin_all" on public.pages
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- -------------------------------------------------------
-- 8. ADMIN LOGS
-- -------------------------------------------------------
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text, -- 'devotional' | 'user' | 'page' | 'media'
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_logs enable row level security;

create policy "admin_logs_admin_select" on public.admin_logs
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
create policy "admin_logs_service_insert" on public.admin_logs
  for insert with check (true);

-- -------------------------------------------------------
-- 9. UPDATED_AT TRIGGER FUNCTION
-- -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_devotionals_updated_at on public.devotionals;
create trigger set_devotionals_updated_at
  before update on public.devotionals
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------
-- 10. SEED: Default subscription plans (placeholders - update with real Stripe price IDs)
-- -------------------------------------------------------
insert into public.subscription_plans (name, slug, stripe_price_id, price_in_cents, interval, description)
values
  ('Monthly', 'monthly', 'price_monthly_placeholder', 999, 'month', 'Full access to all devotionals - billed monthly'),
  ('Annual', 'annual', 'price_annual_placeholder', 7900, 'year', 'Full access to all devotionals - billed annually (save 34%)')
on conflict (slug) do nothing;
