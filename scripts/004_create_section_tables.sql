-- Create updated_at trigger function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create section_templates table for storing reusable section types
create table if not exists public.section_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  component_name text not null,
  schema jsonb not null default '{}',
  default_data jsonb not null default '{}',
  thumbnail_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create page_sections table for storing sections on pages
create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  template_id uuid references public.section_templates(id) on delete set null,
  data jsonb not null default '{}',
  sort_order integer not null default 0,
  is_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_page_sections_page_id on public.page_sections(page_id);
create index if not exists idx_page_sections_sort_order on public.page_sections(page_id, sort_order);

-- Enable RLS
alter table public.section_templates enable row level security;
alter table public.page_sections enable row level security;

-- RLS policies for section_templates (everyone can read)
drop policy if exists "section_templates_select_all" on public.section_templates;
create policy "section_templates_select_all" on public.section_templates
  for select using (true);

drop policy if exists "section_templates_manage_authenticated" on public.section_templates;
create policy "section_templates_manage_authenticated" on public.section_templates
  for all using (auth.role() = 'authenticated');

-- RLS policies for page_sections (everyone can read, authenticated can manage)
drop policy if exists "page_sections_select_all" on public.page_sections;
create policy "page_sections_select_all" on public.page_sections
  for select using (true);

drop policy if exists "page_sections_manage_authenticated" on public.page_sections;
create policy "page_sections_manage_authenticated" on public.page_sections
  for all using (auth.role() = 'authenticated');

-- Updated_at trigger for section_templates
drop trigger if exists set_section_templates_updated_at on public.section_templates;
create trigger set_section_templates_updated_at
  before update on public.section_templates
  for each row execute function public.set_updated_at();

-- Updated_at trigger for page_sections
drop trigger if exists set_page_sections_updated_at on public.page_sections;
create trigger set_page_sections_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();
