import 'server-only'
import { createClient } from '@/lib/supabase/server'
import HamburgerHeader from '@/components/HamburgerHeader'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_settings')
    .select('site_name, logo_type, logo_url, nav_links')
    .single()

  return (
    <div className="min-h-screen">
      <HamburgerHeader
        siteName={settings?.site_name ?? 'The Adopted Son'}
        logoType={settings?.logo_type ?? 'text'}
        logoUrl={settings?.logo_url ?? undefined}
        navLinks={settings?.nav_links ?? []}
      />
      <main>{children}</main>
    </div>
  )
}
