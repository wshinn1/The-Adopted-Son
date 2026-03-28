import { AudioProvider } from '@/components/AudioProvider'
import Aside from '@/components/aside'
import { AudioPlayer } from '@/components/audio-player/AudioPlayer'
import ColorProvider from '@/components/ColorProvider'
import ThemeProvider from '@/app/theme-provider'
import FontProvider from '@/components/FontProvider'
import PostHogProvider from '@/components/PostHogProvider'
import CookieConsent from '@/components/CookieConsent'
import NewsletterPopupController from '@/components/NewsletterPopupController'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createClient } from '@/lib/supabase/server'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient()

  // Fetch colors and typography together
  const { data: settings } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['site_colors', 'typography'])

  const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || [])

  let initialColors = {}
  try {
    const colorsValue = settingsMap.get('site_colors')
    if (colorsValue) {
      initialColors = typeof colorsValue === 'string' ? JSON.parse(colorsValue) : colorsValue
    }
  } catch {}

  const typographyValue = settingsMap.get('typography')
  const initialTypography = typographyValue
    ? (typeof typographyValue === 'string' ? JSON.parse(typographyValue) : typographyValue)
    : undefined

  return (
    <PostHogProvider>
      <ThemeProvider>
        <FontProvider initialTypography={initialTypography}>
          <ColorProvider initialColors={initialColors}>
            <AudioProvider>
              <Aside.Provider>{children}</Aside.Provider>
              <div className="fixed inset-x-0 bottom-0 z-20">
                <AudioPlayer />
              </div>
              <CookieConsent />
              <NewsletterPopupController />
              <SpeedInsights />
            </AudioProvider>
          </ColorProvider>
        </FontProvider>
      </ThemeProvider>
    </PostHogProvider>
  )
}

export default Layout
