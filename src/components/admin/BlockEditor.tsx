'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useState, useCallback, useRef } from 'react'
import { VideoEmbed } from '@/components/tiptap-extension/video-embed-extension'
import { Columns, Column } from '@/components/tiptap-extension/columns-extension'
import { Callout } from '@/components/tiptap-extension/callout-extension'

interface Props {
  content: unknown
  onChange: (content: unknown) => void
  placeholder?: string
}

export default function BlockEditor({ content, onChange, placeholder = 'Start writing...' }: Props) {
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      LinkExt.configure({ openOnClick: false }),
      ImageExt.configure({
        allowBase64: true,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      VideoEmbed,
      Columns,
      Column,
      Callout,
    ],
    content: (content as object) ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      // Fallback to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        editor.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }, [editor])

  const insertVideo = useCallback(() => {
    if (!editor || !videoUrl) return
    editor.chain().focus().setVideo({ src: videoUrl }).run()
    setVideoUrl('')
    setShowVideoModal(false)
  }, [editor, videoUrl])

  const BlockMenuButton = ({ onClick, icon, label }: { onClick: () => void; icon: string; label: string }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
    >
      <span className="text-lg w-6 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  )

  if (!editor) return null

  return (
    <div className="block-editor">
      {/* Floating Menu - Shows when cursor is on empty line */}
      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 100, placement: 'left' }}
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-1"
      >
        <button
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          title="Add block"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </FloatingMenu>

      {/* Bubble Menu - Shows when text is selected */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 p-1 flex items-center gap-0.5"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('underline') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>
        <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700 mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('highlight') ? 'bg-yellow-200 dark:bg-yellow-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Highlight"
        >
          <span className="bg-yellow-200 px-0.5">H</span>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Enter URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-2 rounded-lg transition-colors ${editor.isActive('link') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          title="Link"
        >
          🔗
        </button>
      </BubbleMenu>

      {/* Block Insert Toolbar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-neutral-100 dark:border-neutral-800 flex-wrap">
          {/* Text blocks */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              H3
            </button>
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${editor.isActive('paragraph') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            >
              P
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Lists */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Bullet List"
            >
              •
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Numbered List"
            >
              1.
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('taskList') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Task List"
            >
              ☑
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Blocks */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Quote"
            >
              "
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Code Block"
            >
              {'</>'}
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Divider"
            >
              —
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Media */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
            <button
              onClick={() => setShowVideoModal(true)}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Embed Video"
            >
              🎬
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Columns */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().setColumns(2).run()}
              className="px-2 py-1.5 text-xs rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="2 Columns"
            >
              ⊞2
            </button>
            <button
              onClick={() => editor.chain().focus().setColumns(3).run()}
              className="px-2 py-1.5 text-xs rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="3 Columns"
            >
              ⊞3
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Callouts */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().setCallout('info').run()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Info Callout"
            >
              ℹ
            </button>
            <button
              onClick={() => editor.chain().focus().setCallout('scripture').run()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Scripture Callout"
            >
              ✝
            </button>
          </div>

          <div className="w-px h-6 bg-neutral-200 dark:bg-neutral-700" />

          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Align Left"
            >
              ⫿
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Align Center"
            >
              ≡
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
              title="Align Right"
            >
              ⫾
            </button>
          </div>

          <div className="flex-1" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
              title="Undo"
            >
              ↩
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="px-2 py-1.5 text-sm rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30"
              title="Redo"
            >
              ↪
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="p-5 min-h-[400px]">
          <EditorContent
            editor={editor}
            className="prose prose-neutral dark:prose-invert max-w-none focus:outline-none prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3"
          />
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Embed Video</h3>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube or Vimeo URL"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 mb-4"
            />
            <p className="text-xs text-neutral-500 mb-4">
              Supports YouTube and Vimeo links
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setVideoUrl('')
                  setShowVideoModal(false)
                }}
                className="px-4 py-2 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={insertVideo}
                disabled={!videoUrl}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .ProseMirror ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .columns-wrapper {
          margin: 1rem 0;
        }
        .column {
          padding: 0.5rem;
          border: 1px dashed #e5e7eb;
          border-radius: 0.5rem;
          min-height: 100px;
        }
        .column:focus-within {
          border-color: #6366f1;
        }
      `}</style>
    </div>
  )
}
