import { TPost } from '@/data/posts'

// Supabase devotional type
export interface Devotional {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: any // TipTap JSON
  cover_image_url: string | null
  cover_image_pathname: string | null
  author_id: string | null
  author_name: string | null
  is_premium: boolean
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  scripture_reference: string | null
  scripture_text: string | null
  category: string | null
  tags: string[] | null
  read_time_minutes: number
  created_at: string
  updated_at: string
  // SEO fields
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  // Joined fields from authors table
  authors?: {
    id: string
    name: string
    avatar_url: string | null
    website: string | null
  } | null
}

// Default placeholder image for devotionals without cover images
const DEFAULT_DEVOTIONAL_IMAGE = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&h=800&fit=crop'

// Default author avatar
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'

/**
 * Convert a Supabase devotional to the template's TPost format
 */
export function devotionalToPost(devotional: Devotional): TPost {
  const coverImage = devotional.cover_image_url || DEFAULT_DEVOTIONAL_IMAGE
  
  return {
    id: devotional.id,
    title: devotional.title,
    handle: devotional.slug,
    excerpt: devotional.excerpt || '',
    date: devotional.published_at || devotional.created_at,
    readingTime: devotional.read_time_minutes || 5,
    commentCount: 0,
    viewCount: 0,
    bookmarkCount: 0,
    bookmarked: false,
    likeCount: 0,
    liked: false,
    postType: 'standard' as const,
    status: devotional.is_published ? 'published' : 'draft',
    featuredImage: {
      src: coverImage,
      alt: devotional.title,
      width: 1200,
      height: 800,
    },
    author: {
      id: devotional.authors?.id || devotional.author_id || 'default-author',
      name: devotional.authors?.name || devotional.author_name || 'The Adopted Son',
      handle: 'the-adopted-son',
      avatar: {
        src: devotional.authors?.avatar_url || DEFAULT_AVATAR,
        alt: devotional.authors?.name || devotional.author_name || 'The Adopted Son',
        width: 200,
        height: 200,
      },
    },
    categories: devotional.category
      ? [
          {
            id: `category-${devotional.category.toLowerCase().replace(/\s+/g, '-')}`,
            name: devotional.category,
            handle: devotional.category.toLowerCase().replace(/\s+/g, '-'),
            color: getCategoryColor(devotional.category),
          },
        ]
      : [
          {
            id: 'category-devotional',
            name: 'Devotional',
            handle: 'devotional',
            color: 'indigo',
          },
        ],
  }
}

/**
 * Convert a Supabase devotional to TPostDetail (for single post view)
 */
export function devotionalToPostDetail(devotional: Devotional) {
  const post = devotionalToPost(devotional)
  
  return {
    ...post,
    content: devotional.content,
    scriptureReference: devotional.scripture_reference,
    scriptureText: devotional.scripture_text,
    isPremium: devotional.is_premium,
    tags: (devotional.tags || []).map((tag, index) => ({
      id: `tag-${index}`,
      name: tag,
      handle: tag.toLowerCase().replace(/\s+/g, '-'),
    })),
  }
}

/**
 * Get a category color based on name
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    faith: 'indigo',
    hope: 'blue',
    love: 'red',
    grace: 'purple',
    prayer: 'green',
    scripture: 'yellow',
    devotional: 'indigo',
    worship: 'pink',
    family: 'orange',
    default: 'indigo',
  }
  
  const lowercaseCategory = category.toLowerCase()
  return colors[lowercaseCategory] || colors.default
}

/**
 * Fetch devotionals from Supabase (server-side)
 */
export async function getDevotionals(
  supabase: any,
  options: {
    limit?: number
    published?: boolean
    premium?: boolean
  } = {}
): Promise<Devotional[]> {
  const { limit = 20, published = true, premium } = options
  
  let query = supabase
    .from('devotionals')
    .select(`
      *,
      authors(id, name, avatar_url, website)
    `)
    .order('published_at', { ascending: false })
    .limit(limit)
  
  if (published) {
    query = query.eq('is_published', true)
  }
  
  if (premium !== undefined) {
    query = query.eq('is_premium', premium)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching devotionals:', error)
    return []
  }
  
  return data || []
}

/**
 * Fetch a single devotional by slug
 */
export async function getDevotionalBySlug(
  supabase: any,
  slug: string
): Promise<Devotional | null> {
  const { data, error } = await supabase
    .from('devotionals')
    .select(`
      *,
      authors(id, name, avatar_url, website)
    `)
    .eq('slug', slug)
    .single()
  
  if (error) {
    console.error('Error fetching devotional:', error)
    return null
  }
  
  return data
}
