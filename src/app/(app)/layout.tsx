import { AudioProvider } from '@/components/AudioProvider'
import Aside from '@/components/aside'
import { AudioPlayer } from '@/components/audio-player/AudioPlayer'
import ColorProvider from '@/components/ColorProvider'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ColorProvider>
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
