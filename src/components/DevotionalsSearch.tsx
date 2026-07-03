'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
  tags: string[] | null
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function DevotionalsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query.trim(), 300)

  const doSearch = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort()
    if (q.length < 2) {
      setResults([])
      setSearched(false)
      setLoading(false)
      return
    }

    abortRef.current = new AbortController()
    setLoading(true)

    try {
      const res = await fetch(
        `/api/devotionals/search?q=${encodeURIComponent(q)}`,
        { signal: abortRef.current.signal }
      )
      const data = await res.json()
      setResults(data.results ?? [])
      setSearched(true)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doSearch(debouncedQuery)
  }, [debouncedQuery, doSearch])

  const clear = () => {
    setQuery('')
    setResults([])
    setSearched(false)
    setLoading(false)
    inputRef.current?.focus()
  }

  const hasQuery = query.trim().length > 0
  const showResults = hasQuery && (loading || searched)

  return (
    <div className="mb-12">
      {/* Search input */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-neutral-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search devotionals by title, category, tag, or phrase…"
          aria-label="Search devotionals"
          className="w-full pl-12 pr-12 py-3.5 rounded-full border-2 border-neutral-300 bg-white shadow-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-600 focus:ring-0 font-body text-sm transition-colors"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            {loading
              ? <Loader2 className="size-4 animate-spin" />
              : <X className="size-4" />
            }
          </button>
        )}
      </div>

      {/* Results panel */}
      {showResults && (
        <div
          className="mt-6 transition-all duration-200"
          style={{ animation: 'fadeSlideIn 0.18s ease' }}
        >
          <style>{`
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {loading && results.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm font-body">Searching…</div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl shadow-sm">
              <p className="text-neutral-600 font-body mb-1">No results for &ldquo;{query.trim()}&rdquo;</p>
              <p className="text-neutral-400 text-sm font-body">Try a different keyword, tag, or category.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-400 font-body mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query.trim()}&rdquo;
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((post) => {
                  const date = post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : null

                  return (
                    <Link
                      key={post.id}
                      href={`/devotionals/${post.slug}`}
                      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {post.cover_image_url ? (
                        <div className="relative aspect-[16/9] overflow-hidden">
                          <Image
                            src={post.cover_image_url}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-neutral-100" />
                      )}
                      <div className="p-4">
                        {post.category && (
                          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-rose-500 mb-1">
                            {post.category}
                          </span>
                        )}
                        <h3 className="font-bold text-neutral-900 leading-snug group-hover:text-title-hover transition-colors font-heading line-clamp-2 mb-1">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-neutral-500 text-sm line-clamp-2 font-body leading-relaxed">
                            {post.excerpt}
                          </p>
                        )}
                        {date && (
                          <p className="text-neutral-400 text-xs font-body mt-2">{date}</p>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-body">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
