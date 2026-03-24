import { Metadata } from 'next'
import AnalyticsStats from '@/components/admin/AnalyticsStats'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return <AnalyticsStats />
}
