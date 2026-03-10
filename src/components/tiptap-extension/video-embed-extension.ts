import { Node, mergeAttributes } from '@tiptap/core'

export interface VideoOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType
    }
  }
}

export const VideoEmbed = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: 'auto',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src as string

    // Convert YouTube URLs to embed format
    let embedSrc = src
    if (src?.includes('youtube.com/watch')) {
      const videoId = new URL(src).searchParams.get('v')
      embedSrc = `https://www.youtube.com/embed/${videoId}`
    } else if (src?.includes('youtu.be/')) {
      const videoId = src.split('youtu.be/')[1]?.split('?')[0]
      embedSrc = `https://www.youtube.com/embed/${videoId}`
    } else if (src?.includes('vimeo.com/')) {
      const videoId = src.split('vimeo.com/')[1]?.split('?')[0]
      embedSrc = `https://player.vimeo.com/video/${videoId}`
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-video-embed': '',
        class: 'video-embed-wrapper',
        style: 'position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px;',
      }),
      [
        'iframe',
        {
          src: embedSrc,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
        },
      ],
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
