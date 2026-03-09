import { Node, mergeAttributes } from '@tiptap/core'

export interface ColumnsOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    columns: {
      setColumns: (columns: number) => ReturnType
      unsetColumns: () => ReturnType
    }
  }
}

export const Columns = Node.create<ColumnsOptions>({
  name: 'columns',

  group: 'block',

  content: 'column+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      count: {
        default: 2,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-columns]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-columns': HTMLAttributes.count,
        class: 'columns-wrapper',
        style: `display: grid; grid-template-columns: repeat(${HTMLAttributes.count}, 1fr); gap: 1rem;`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setColumns:
        (count) =>
        ({ commands }) => {
          const columns = Array.from({ length: count }, () => ({
            type: 'column',
            content: [{ type: 'paragraph' }],
          }))

          return commands.insertContent({
            type: this.name,
            attrs: { count },
            content: columns,
          })
        },
      unsetColumns:
        () =>
        ({ commands }) => {
          return commands.lift(this.name)
        },
    }
  },
})

export const Column = Node.create({
  name: 'column',

  group: 'column',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-column]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-column': '',
        class: 'column',
        style: 'min-width: 0;',
      }),
      0,
    ]
  },
})
