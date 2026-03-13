import 'server-only'
import { createClient } from '@/lib/supabase/server'
import HamburgerHeader from '@/components/HamburgerHeader'
import SiteFooter from '@/components/SiteFooter'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'logo_type', 'logo_url', 'nav_links', 'footer_text', 'footer_links'])

  const settings: Record<string, any> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value
  }

  const parseJsonSetting = (raw: any): any[] => {
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : (raw ?? [])
    } catch {
      return []
    }
  }

  const navLinks = parseJsonSetting(settings['nav_links'])
  const footerLinks = parseJsonSetting(settings['footer_links'])
  const footerText: string = settings['footer_text'] ?? ''

  return (
    <div className="min-h-screen flex flex-col">
      <HamburgerHeader
        siteName={settings['site_name'] ?? 'The Adopted Son'}
        logoType={settings['logo_type'] ?? 'text'}
        logoUrl={settings['logo_url'] ?? undefined}
        navLinks={navLinks}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter footerText={footerText} footerLinks={footerLinks} />
    </div>
  )
}
