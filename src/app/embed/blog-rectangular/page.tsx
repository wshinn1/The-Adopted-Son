import { createClient } from '@/lib/supabase/server'

export const revalidate = 300 // cache for 5 minutes

type Devotional = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  published_at: string | null
  category: string | null
  authors: { name: string; avatar_url: string | null } | { name: string; avatar_url: string | null }[] | null
}

export default async function BlogRectangularEmbed() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('devotionals')
    .select('id, title, slug, excerpt, cover_image_url, published_at, category, authors(name, avatar_url)')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const posts = (data ?? []) as Devotional[]

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: system-ui, -apple-system, sans-serif; background: white; }
          a { text-decoration: none; color: inherit; }
          .row:hover { background: #f9fafb; }
        `}</style>
      </head>
      <body>
        <section style={{ maxWidth: '100%', padding: '0' }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <div style={{ borderBottom: '1px solid #e5e7eb', padding: '20px 24px' }}>
              <h2 style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '-0.02em' }}>Recent Devotionals</h2>
            </div>
            {posts.map((post, i) => {
              const author = Array.isArray(post.authors) ? post.authors[0] : post.authors
              const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
              const initials = author?.name ? author.name.charAt(0).toUpperCase() : 'A'
              return (
                <a
                  key={post.id}
                  href={`https://theadoptedson.com/devotionals/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="row"
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 24px',
                    borderBottom: i < posts.length - 1 ? '1px solid #e5e7eb' : 'none',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      style={{ width: '112px', height: '80px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, display: 'block' }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {post.category && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '999px', fontWeight: 500 }}>
                          {post.category}
                        </span>
                      )}
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{date}</span>
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.4', marginBottom: '4px' }}>{post.title}</h3>
                    {post.excerpt && (
                      <p style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {post.excerpt}
                      </p>
                    )}
                    {author?.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt={author.name} style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#6366f1', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {initials}
                          </div>
                        )}
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{author.name}</span>
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      </body>
    </html>
  )
}
