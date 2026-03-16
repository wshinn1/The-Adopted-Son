'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransition } from 'react'

interface DevotionalsPaginationProps {
  currentPage: number
  totalPages: number
  search?: string
  sectionId: string
}

export default function DevotionalsPagination({
  currentPage,
  totalPages,
  search,
  sectionId,
}: DevotionalsPaginationProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handlePageChange = (pageNum: number) => {
    // Build the URL
    const params = new URLSearchParams()
    params.set('page', pageNum.toString())
    if (search) params.set('search', search)
    
    // Scroll to the section smoothly
    const section = document.getElementById(sectionId)
    if (section) {
      const headerOffset = 100 // Account for fixed header
      const elementPosition = section.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }

    // Navigate with transition (keeps the scroll position behavior)
    startTransition(() => {
      router.push(`/devotionals?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className={`flex items-center justify-center gap-2 mt-12 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
      {currentPage > 1 && (
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isPending}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-4" />
          Previous
        </button>
      )}
      
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => handlePageChange(pageNum)}
            disabled={isPending || pageNum === currentPage}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors font-body disabled:cursor-not-allowed ${
              pageNum === currentPage
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {pageNum}
          </button>
        ))}
      </div>
      
      {currentPage < totalPages && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isPending}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-body disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}
