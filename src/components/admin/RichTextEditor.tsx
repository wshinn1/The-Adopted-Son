'use client'

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useRef, useEffect } from 'react'

interface Props {
  content: string // HTML string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt.configure({
        allowBase64: true,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        editor.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="rich-text-editor">
      {/* Bubble Menu - Shows when text is selected */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-1 flex items-center gap-0.5"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Bold"
        >
          <strong className="text-sm">B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Italic"
        >
          <em className="text-sm">I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Underline"
        >
          <span className="underline text-sm">U</span>
        </button>
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Link"
        >
          <span className="text-sm">🔗</span>
        </button>
      </BubbleMenu>

      {/* Editor with toolbar */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 p-2 border-b border-neutral-200 dark:border-neutral-700 flex-wrap bg-neutral-50 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-2 py-1 text-xs font-medium rounded transition-colors ${editor.isActive('paragraph') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            P
          </button>

          <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 text-xs rounded transition-colors ${editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 text-xs rounded transition-colors ${editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            title="Numbered List"
          >
            1.
          </button>

          <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 text-xs rounded transition-colors ${editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            title="Quote"
          >
            "
          </button>

          <div className="w-px h-5 bg-neutral-300 dark:bg-neutral-600 mx-1" />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 text-xs rounded transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Upload Image"
          >
            🖼
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        {/* Editor Content */}
        <div className="p-4 min-h-[200px]">
          <EditorContent
            editor={editor}
            className="prose prose-sm prose-neutral dark:prose-invert max-w-none focus:outline-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2"
          />
        </div>
      </div>

      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 150px;
        }
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  )
}
