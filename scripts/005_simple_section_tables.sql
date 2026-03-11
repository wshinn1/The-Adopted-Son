-- Create section_templates table
create table if not exists public.section_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  component_name text not null,
  schema jsonb not null default '{}',
  default_data jsonb not null default '{}',
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create page_sections table
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  template_id uuid references public.section_templates(id) on delete set null,
  data jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index
create index if not exists idx_page_sections_page_id on public.page_sections(page_id);
