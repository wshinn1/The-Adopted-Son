import { CopyButton } from '@/components/admin/CopyButton'

export default function ComponentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-primary-600 dark:text-primary-400 font-medium uppercase tracking-wider">Admin</p>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Components</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Embeddable components you can place on external sites via iframe.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ComponentCard
          title="Blog Rectangular Layout"
          description="Shows the 3 latest devotionals in a clean rectangular list with image, category, title, excerpt, and author."
          embedUrl="/embed/blog-rectangular"
        />
      </div>
    </div>
  )
}

function ComponentCard({ title, description, embedUrl }: { title: string; description: string; embedUrl: string }) {
  const fullUrl = `https://theadoptedson.com${embedUrl}`
  const iframeCode = `<iframe src="${fullUrl}" width="100%" height="420" frameborder="0" style="border-radius:8px;overflow:hidden;" loading="lazy"></iframe>`

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Preview */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400" />
        <span className="w-3 h-3 rounded-full bg-yellow-400" />
        <span className="w-3 h-3 rounded-full bg-green-400" />
        <span className="text-xs text-neutral-400 ml-2 truncate">{fullUrl}</span>
      </div>
      <div className="h-48 overflow-hidden">
        <iframe src={embedUrl} className="w-full h-full border-0 pointer-events-none scale-[0.6] origin-top-left" style={{ width: '166%', height: '166%' }} />
      </div>

      {/* Info */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{title}</h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>

        {/* Embed code box */}
        <div className="mt-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 flex items-center gap-2">
          <code className="text-xs text-neutral-600 dark:text-neutral-400 flex-1 truncate">{iframeCode}</code>
          <CopyButton text={iframeCode} />
        </div>
      </div>
    </div>
  )
}
