import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="py-5 px-6 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <Link href="/" className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          The Adopted Son
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  )
}
