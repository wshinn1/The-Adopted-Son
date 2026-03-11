-- Create authors table for managing blog post authors
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  avatar_url text,
  email text,
  website_url text,
  social_twitter text,
  social_instagram text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index for faster lookups
create index if not exists idx_authors_slug on public.authors(slug);
create index if not exists idx_authors_is_active on public.authors(is_active);

-- Enable RLS
alter table public.authors enable row level security;

-- RLS policies: Anyone can read active authors, authenticated can manage
create policy "authors_select" on public.authors
  for select using (true);

create policy "authors_insert" on public.authors
  for insert with check (auth.role() = 'authenticated');

create policy "authors_update" on public.authors
  for update using (auth.role() = 'authenticated');

create policy "authors_delete" on public.authors
  for delete using (auth.role() = 'authenticated');

-- Add author_id column to devotionals table (optional relationship)
alter table public.devotionals 
  add column if not exists author_id uuid references public.authors(id) on delete set null;

-- Create index for the new column
create index if not exists idx_devotionals_author_id on public.devotionals(author_id);
