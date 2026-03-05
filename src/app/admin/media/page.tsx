import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import AdminMediaUpload from '@/components/admin/AdminMediaUpload'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Media — Admin' }

export default async function AdminMediaPage() {
  const supabase = await createClient()

  const { data: media } = await supabase
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Media Library</h1>
        <AdminMediaUpload />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media?.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
          >
            {item.url && item.content_type?.startsWith('image/') ? (
              <Image
                src={item.url}
                alt={item.alt_text ?? item.filename}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl text-neutral-400">
                ▣
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
              <p className="text-white text-xs text-center truncate w-full">{item.filename}</p>
              {item.url && (
                <button
                  onClick={() => navigator.clipboard.writeText(item.url)}
                  className="text-xs bg-white text-neutral-900 px-2 py-1 rounded-lg font-medium hover:bg-neutral-100"
                >
                  Copy URL
                </button>
              )}
            </div>
          </div>
        ))}
        {(!media || media.length === 0) && (
          <div className="col-span-full py-16 text-center text-sm text-neutral-400">
            No media uploaded yet.
          </div>
        )}
      </div>
    </div>
  )
}
