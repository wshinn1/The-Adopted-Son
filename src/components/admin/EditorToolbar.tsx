'use client'

import type { Editor } from '@tiptap/react'

interface Props {
  editor: Editor | null
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm transition-colors ${
      active
        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
    }`

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Bold">
        <strong>B</strong>
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Italic">
        <em>I</em>
      </button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Underline">
        <u>U</u>
      </button>
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        H2
      </button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="Heading 3">
        H3
      </button>
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Bullet list">
        ≡
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Numbered list">
        ≔
      </button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Blockquote">
        "
      </button>
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Align left">
        ←
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Align center">
        ↔
      </button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Align right">
        →
      </button>
      <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
      <button onClick={() => editor.chain().focus().undo().run()} className={btn(false)} title="Undo">
        ↩
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btn(false)} title="Redo">
        ↪
      </button>
    </div>
  )
}
