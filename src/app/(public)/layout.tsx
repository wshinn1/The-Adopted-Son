import { getSiteSettings } from '@/lib/site-settings'
import HamburgerHeader from '@/components/HamburgerHeader'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()

  return (
    <div className="min-h-screen">
      <HamburgerHeader
        siteName={settings.site_name}
        logoUrl={settings.logo_url || undefined}
        navLinks={settings.nav_links}
      />
      <main>{children}</main>
    </div>
  )
}
