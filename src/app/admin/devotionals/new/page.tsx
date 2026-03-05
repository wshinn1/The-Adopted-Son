import DevotionalEditor from '@/components/admin/DevotionalEditor'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Devotional — Admin' }

export default function NewDevotionalPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
        New Devotional
      </h1>
      <DevotionalEditor devotional={null} />
    </div>
  )
}
