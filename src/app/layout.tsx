import '@/styles/tailwind.css'
import { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import { headers } from 'next/headers'
import ThemeProvider from './theme-provider'
import FontProvider from '@/components/FontProvider'
import PostHogProvider from '@/components/PostHogProvider'
import CookieConsent from '@/components/CookieConsent'
import NewsletterPopupController from '@/components/NewsletterPopupController'
import { SpeedInsights } from '@vercel/speed-insights/next'
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
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'The Adopted Son — Daily Devotionals',
      },
    ],
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
  const headersList = await headers()
  const isEmbed = headersList.get('x-is-embed') === '1'

  if (isEmbed) {
    return (
      <html lang="en">
        <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: 'white' }}>
          {children}
        </body>
      </html>
    )
  }

  const supabase = await createClient()
  
  // Batch fetch site settings to avoid waterfall
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['favicon_url', 'typography'])
  
  const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])
  const faviconValue = settingsMap.get('favicon_url')
  const faviconUrl = typeof faviconValue === 'string' ? faviconValue.replace(/^"|"$/g, '') : null
  
  // Parse typography settings for FontProvider
  const typographyValue = settingsMap.get('typography')
  const initialTypography = typographyValue 
    ? (typeof typographyValue === 'string' ? JSON.parse(typographyValue) : typographyValue)
    : undefined

  return (
    <html lang="en" className={beVietnamPro.className} data-scroll-behavior="smooth">
      <head>
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
      </head>
      <body className="bg-white text-base text-neutral-900 dark:bg-neutral-900 dark:text-neutral-200">
        <PostHogProvider>
          <ThemeProvider>
            <FontProvider initialTypography={initialTypography}>
              <div>{children}</div>
              <CookieConsent />
              <NewsletterPopupController />
            </FontProvider>
          </ThemeProvider>
        </PostHogProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
