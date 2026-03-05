import { ApplicationLayout } from '@/app/(app)/application-layout'
import DevotionalContent from '@/components/devotional/DevotionalContent'
import PaywallGate from '@/components/devotional/PaywallGate'
import { checkAccess } from '@/lib/trial'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('devotionals')
    .select('title, excerpt')
    .eq('slug', slug)
    .single()

  return {
    title: data?.title ? `${data.title} — The Adopted Son` : 'Devotional',
    description: data?.excerpt ?? '',
  }
}

export default async function DevotionalPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: devotional } = await supabase
    .from('devotionals')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!devotional) notFound()

  const access = await checkAccess()

  const canRead = !devotional.is_premium || access.hasAccess

  return (
    <ApplicationLayout headerStyle="header-2">
      <main className="container py-16 lg:py-24 max-w-3xl mx-auto">
        <DevotionalContent devotional={devotional} canRead={canRead} />
        {!canRead && <PaywallGate reason={access.reason} />}
      </main>
    </ApplicationLayout>
  )
}
