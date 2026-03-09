import { Node, mergeAttributes } from '@tiptap/core'

export interface CalloutOptions {
  HTMLAttributes: Record<string, unknown>
}

export type CalloutType = 'info' | 'warning' | 'success' | 'scripture'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: CalloutType) => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

const calloutStyles: Record<CalloutType, string> = {
  info: 'background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;',
  warning: 'background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;',
  success: 'background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;',
  scripture: 'background-color: #F5F5F0; border-left: 4px solid #8B7355; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; font-style: italic;',
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      type: {
        default: 'info',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const type = (HTMLAttributes.type as CalloutType) || 'info'
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': type,
        class: `callout callout-${type}`,
        style: calloutStyles[type],
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout:
        (type) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, { type })
        },
      unsetCallout:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },
})
