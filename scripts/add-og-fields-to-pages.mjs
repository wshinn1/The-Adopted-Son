import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const { error } = await supabase.rpc('exec_sql', {
  sql: `
    ALTER TABLE pages
      ADD COLUMN IF NOT EXISTS og_title text,
      ADD COLUMN IF NOT EXISTS og_description text,
      ADD COLUMN IF NOT EXISTS og_image_url text;
  `
})

if (error) {
  // Try direct query approach instead
  const results = await Promise.all([
    supabase.from('pages').select('og_title').limit(1),
    supabase.from('pages').select('og_description').limit(1),
    supabase.from('pages').select('og_image_url').limit(1),
  ])

  const missing = results.filter(r => r.error?.message?.includes('does not exist'))
  if (missing.length === 0) {
    console.log('Columns already exist!')
  } else {
    console.error('Migration error:', error)
    process.exit(1)
  }
} else {
  console.log('Migration successful: og_title, og_description, og_image_url added to pages table.')
}
