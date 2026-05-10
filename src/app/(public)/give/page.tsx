import { Metadata } from 'next'
import GivingForm from './GivingForm'

export const metadata: Metadata = {
  title: 'Give — The Adopted Son',
  description: 'Support The Adopted Son ministry through a one-time or monthly gift.',
}

export default function GivePage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-24 pb-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-neutral-900 mb-3">Give</h1>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Your generosity helps us create devotionals and resources that draw people closer to God.
            Every gift — large or small — makes a difference.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <div className="mb-6">
            <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
              Giving Support
            </span>
          </div>
          <GivingForm />
        </div>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Secure payments powered by Stripe. Your payment information is never stored on our servers.
        </p>
      </div>
    </div>
  )
}
