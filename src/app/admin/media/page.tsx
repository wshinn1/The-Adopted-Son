import { supabaseAdmin } from '@/lib/supabase/admin'
import { Metadata } from 'next'
import AdminMediaUpload from '@/components/admin/AdminMediaUpload'
import MediaCard from '@/components/admin/MediaCard'

export const metadata: Metadata = { title: 'Media — Admin' }

export default async function AdminMediaPage() {
  const { data: media } = await supabaseAdmin
    .from('media')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Media Library</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {media?.length ?? 0} file{media?.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <AdminMediaUpload />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media?.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
        {(!media || media.length === 0) && (
          <div className="col-span-full py-16 text-center">
            <div className="text-4xl text-neutral-300 dark:text-neutral-600 mb-4">▣</div>
            <p className="text-sm text-neutral-500">No media uploaded yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Click the Upload button to add images, videos, or documents.</p>
          </div>
        )}
      </div>
    </div>
  )
}
