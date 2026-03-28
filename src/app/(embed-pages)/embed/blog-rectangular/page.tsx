import BlogRectangularLayout from '@/components/embed/BlogRectangularLayout'

export const dynamic = 'force-dynamic'

export default async function BlogRectangularEmbed() {
  let posts: any[] = []

  try {
    const res = await fetch('https://www.theadoptedson.com/api/devotionals/recent?limit=3', {
      cache: 'no-store',
    })
    if (res.ok) {
      const json = await res.json()
      posts = json.devotionals ?? []
    }
  } catch {
    // Render empty state if fetch fails
  }

  return <BlogRectangularLayout posts={posts} />
}
