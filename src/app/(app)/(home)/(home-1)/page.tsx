import { ApplicationLayout } from '@/app/(app)/application-layout'
import TrialBanner from '@/components/devotional/TrialBanner'
import DevotionalHero from '@/components/devotional/DevotionalHero'
import DevotionalGrid from '@/components/devotional/DevotionalGrid'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'The Adopted Son — Daily Devotionals',
  description: 'Faith-filled daily devotionals to draw you closer to God.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: devotionals } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, scripture_reference, category, tags, read_time_minutes, published_at, is_premium')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(9)

  const featured = devotionals?.[0] ?? null
  const rest = devotionals?.slice(1) ?? []

  return (
    <ApplicationLayout headerStyle="header-2">
      <TrialBanner />
      <main>
        <DevotionalHero featured={featured} />
        <div className="container py-16 lg:py-24 space-y-16">
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  Recent Devotionals
                </h2>
                <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                  Fresh reflections from the Word
                </p>
              </div>
              <Link
                href="/devotionals"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View all
              </Link>
            </div>
            <DevotionalGrid devotionals={rest} />
          </section>
        </div>
      </main>
    </ApplicationLayout>
  )
}
