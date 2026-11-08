import 'server-only'
import { createClient } from '@/lib/supabase/server'
import HamburgerHeader from '@/components/HamburgerHeader'
import BigFooter from '@/components/BigFooter'
import type { FooterConfig } from '@/components/BigFooter'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_name', 'logo_type', 'logo_url', 'nav_links', 'nav_typography', 'nav_scroll', 'footer_config'])

  const settings: Record<string, any> = {}
  for (const row of rows ?? []) {
    settings[row.key] = row.value
  }

  const parseArray = (raw: any): any[] => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []) }
    catch { return [] }
  }
  const parseObj = (raw: any): Record<string, any> => {
    try {
      const v = typeof raw === 'string' ? JSON.parse(raw) : raw
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
    } catch { return {} }
  }

  const navLinks = parseArray(settings['nav_links'])
  const navTypography = parseObj(settings['nav_typography'])
  const navScroll = parseObj(settings['nav_scroll'])
  const footerConfig: FooterConfig = parseObj(settings['footer_config'])

  return (
    <div className="min-h-screen flex flex-col">
      <HamburgerHeader
        siteName={settings['site_name'] ?? 'The Adopted Son'}
        logoType={settings['logo_type'] ?? 'text'}
        logoUrl={settings['logo_url'] ?? undefined}
        navLinks={navLinks}
        navTypography={navTypography}
        navScroll={navScroll}
      />
      <main className="flex-1 pt-20">{children}</main>
      <BigFooter
        config={footerConfig}
        siteName={settings['site_name'] ?? 'The Adopted Son'}
        logoType={settings['logo_type'] ?? 'text'}
        logoUrl={settings['logo_url'] ?? undefined}
      />
    </div>
  )
}
