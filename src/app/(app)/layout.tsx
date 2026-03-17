import { AudioProvider } from '@/components/AudioProvider'
import Aside from '@/components/aside'
import { AudioPlayer } from '@/components/audio-player/AudioPlayer'
import ColorProvider from '@/components/ColorProvider'
import { createClient } from '@/lib/supabase/server'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  // Fetch colors on the server to avoid client-side waterfall
  let initialColors = {}
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_colors')
      .single()
    
    if (data?.value) {
      initialColors = typeof data.value === 'string' ? JSON.parse(data.value) : data.value
    }
  } catch {
    // Use default colors if fetch fails
  }

  return (
    <ColorProvider initialColors={initialColors}>
      <AudioProvider>
        <Aside.Provider>{children}</Aside.Provider>
        <div className="fixed inset-x-0 bottom-0 z-20">
          <AudioPlayer />
        </div>
      </AudioProvider>
    </ColorProvider>
  )
}

export default Layout
