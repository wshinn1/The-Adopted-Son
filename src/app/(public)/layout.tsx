import 'server-only'
import { createClient } from '@/lib/supabase/server'
import HamburgerHeader from '@/components/HamburgerHeader'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'logo_type', 'logo_url', 'nav_links'])

  const settings: Record<string, any> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value
  }

  let navLinks: { label: string; url: string }[] = []
  try {
    const raw = settings['nav_links']
    navLinks = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
  } catch {
    navLinks = []
  }

  return (
    <div className="min-h-screen">
      <HamburgerHeader
        siteName={settings['site_name'] ?? 'The Adopted Son'}
        logoType={settings['logo_type'] ?? 'text'}
        logoUrl={settings['logo_url'] ?? undefined}
        navLinks={navLinks}
      />
      <main>{children}</main>
    </div>
  )
}
