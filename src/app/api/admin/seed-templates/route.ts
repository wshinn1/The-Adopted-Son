import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Section templates to seed
const templates = [
  {
    name: 'Text Section',
    description: 'A text section with heading, rich text content, and optional featured image',
    component_name: 'TextSection',
    schema: {
      type: 'object',
      properties: {
        heading: {
          type: 'string',
          title: 'Heading',
        },
        content: {
          type: 'string',
          title: 'Content',
          format: 'richtext',
        },
        featured_image_url: {
          type: 'string',
          title: 'Featured Image',
        },
        featured_image_alt: {
          type: 'string',
          title: 'Image Alt Text',
        },
        image_position: {
          type: 'string',
          title: 'Image Position',
          enum: ['top', 'bottom', 'none'],
        },
        background_color: {
          type: 'string',
          title: 'Background Color',
        },
        max_width: {
          type: 'string',
          title: 'Content Width',
          enum: ['narrow', 'medium', 'wide', 'full'],
        },
      },
    },
    default_data: {
      heading: 'About Us',
      content: '<p>Write your content here...</p>',
      featured_image_url: '',
      featured_image_alt: '',
      image_position: 'bottom',
      background_color: '#ffffff',
      max_width: 'medium',
    },
  },
  {
    name: 'Home Hero',
    description: 'Hero section with inspirational quote, image, and card overlay',
    component_name: 'Home1',
    schema: {
      type: 'object',
      properties: {
        quote_before: {
          type: 'string',
          title: 'Quote (before highlight)',
        },
        quote_highlight: {
          type: 'string',
          title: 'Quote (highlighted text)',
        },
        quote_after: {
          type: 'string',
          title: 'Quote (after highlight)',
        },
        image_url: {
          type: 'string',
          title: 'Hero Image',
        },
        image_alt: {
          type: 'string',
          title: 'Image Alt Text',
        },
        card_label: {
          type: 'string',
          title: 'Card Label',
        },
        card_title_before: {
          type: 'string',
          title: 'Card Title (before)',
        },
        card_title_highlight: {
          type: 'string',
          title: 'Card Title (italic)',
        },
        card_title_after: {
          type: 'string',
          title: 'Card Title (after)',
        },
        card_description: {
          type: 'string',
          title: 'Card Description',
        },
        button_url: {
          type: 'string',
          title: 'Button URL',
        },
        background_color: {
          type: 'string',
          title: 'Background Color',
        },
      },
    },
    default_data: {
      quote_before: "You can't wait for",
      quote_highlight: 'inspiration',
      quote_after: ', you have to go after it with a club.',
      image_url: '',
      image_alt: 'Hero image',
      card_label: 'FEATURED',
      card_title_before: 'Contemporary, classic and inspiring',
      card_title_highlight: 'innovation',
      card_title_after: 'details.',
      card_description: 'Discover content that inspires and transforms.',
      button_url: '/devotionals',
      background_color: '#F5F5F0',
    },
  },
]

export async function POST() {
  try {
    // First, check if tables exist by trying to select
    const { error: checkError } = await supabaseAdmin
      .from('section_templates')
      .select('id')
      .limit(1)

    if (checkError) {
      // Tables don't exist, need to create them first
      const createTablesSql = `
        -- Create updated_at trigger function
        create or replace function public.set_updated_at()
        returns trigger as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$ language plpgsql;

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
          is_visible boolean default true,
          created_at timestamptz default now(),
          updated_at timestamptz default now()
        );

        -- Create index
        create index if not exists idx_page_sections_page_id on public.page_sections(page_id);
      `
      
      // Try to create tables via RPC if available, otherwise return error with instructions
      return NextResponse.json({ 
        error: 'Tables do not exist', 
        message: 'Please run the SQL migration in scripts/004_create_section_tables.sql via Supabase Dashboard',
        sql: createTablesSql
      }, { status: 400 })
    }

    // Upsert templates
    for (const template of templates) {
      const { error } = await supabaseAdmin
        .from('section_templates')
        .upsert(
          { ...template },
          { onConflict: 'name' }
        )

      if (error) {
        console.error('Error upserting template:', template.name, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${templates.length} templates` 
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed templates' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint to seed section templates' 
  })
}
