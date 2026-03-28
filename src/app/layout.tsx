import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const BASE_URL = 'https://www.theadoptedson.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`

export const metadata: Metadata = {
  title: {
    template: '%s — The Adopted Son',
    default: 'The Adopted Son — Daily Devotionals',
  },
  description: 'Faith-filled daily devotionals to draw you closer to God. A 14-day free trial, then simple subscription pricing.',
  keywords: ['devotionals', 'faith', 'Christian', 'adoption', 'daily reading', 'Scripture'],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'The Adopted Son',
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    title: 'The Adopted Son — Daily Devotionals',
    description: 'Faith-filled daily devotionals to draw you closer to God.',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'The Adopted Son — Daily Devotionals' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@theadoptedson',
    creator: '@theadoptedson',
    title: 'The Adopted Son — Daily Devotionals',
    description: 'Faith-filled daily devotionals to draw you closer to God.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['favicon_url'])

  const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])
  const faviconValue = settingsMap.get('favicon_url')
  const faviconUrl = typeof faviconValue === 'string' ? faviconValue.replace(/^"|"$/g, '') : null

  return (
    <html lang="en" className={beVietnamPro.className} data-scroll-behavior="smooth">
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
      </head>
      <body className="bg-white text-base text-neutral-900">
        {children}
      </body>
    </html>
  )
}
