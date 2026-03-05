'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect } from 'react'

interface Props {
  content: unknown
}

export default function DevotionalBody({ content }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content as object,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content as object)
    }
  }, [editor, content])

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none prose-lg prose-headings:font-bold prose-a:text-primary-600 prose-blockquote:border-primary-500 prose-blockquote:bg-primary-50 dark:prose-blockquote:bg-primary-950/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic">
      <EditorContent editor={editor} />
    </div>
  )
}
