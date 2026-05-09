import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import NewsletterSubscribersTable from '@/components/admin/NewsletterSubscribersTable'

export const metadata: Metadata = { title: 'Subscribers — Admin' }

export default async function AdminSubscribersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: newsletterSubscribers } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, first_name, subscribed_at, is_active')
    .order('subscribed_at', { ascending: false })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Subscribers</h1>

      <section>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          Newsletter Subscribers ({newsletterSubscribers?.length ?? 0})
        </h2>
        <NewsletterSubscribersTable initialSubscribers={newsletterSubscribers ?? []} />
      </section>
    </div>
  )
}
