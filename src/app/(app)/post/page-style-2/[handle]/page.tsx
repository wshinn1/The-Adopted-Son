import NewsletterSignUp from '@/components/sections/NewsletterSignUp'
import { getAllPosts, getCommentsByPostId, getPostByHandle } from '@/data/posts'
import { getSiteSettings } from '@/lib/site-settings'
import { Metadata } from 'next'
import SingleContentContainer from '../../SingleContentContainer'
import SingleHeaderContainer from '../../SingleHeaderContainer'
import SingleRelatedPosts from '../../SingleRelatedPosts'

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params
  const post = await getPostByHandle(handle)
  if (!post) {
    return {
      title: 'Post not found',
      description: 'Post not found',
    }
  }
  return {
    title: post.title,
    description: post.excerpt,
  }
}

const Page = async ({ params }: { params: Promise<{ handle: string }> }) => {
  const { handle } = await params
  const post = await getPostByHandle(handle)
  const comments = await getCommentsByPostId(post.id)
  const relatedPosts = (await getAllPosts()).slice(0, 6)
  const moreFromAuthorPosts = (await getAllPosts()).slice(1, 7)
  const settings = await getSiteSettings()

  return (
    <>
      <div className="single-post-page page-style-2">
        <SingleHeaderContainer post={post} headerStyle="style2" shareSettings={settings.share_buttons} />

        <div className="container mt-12">
          <SingleContentContainer post={post} comments={comments} />
        </div>

        {/* Newsletter Signup */}
        {settings.show_newsletter_on_posts && (
          <NewsletterSignUp
            data={{
              heading: 'Stay Connected',
              subheading: 'Get the latest posts and updates delivered to your inbox.',
              button_text: 'Subscribe',
              success_message: 'Thank you for subscribing! Check your inbox for confirmation.',
              background_color: '#F5F2ED',
              background_image_url: '',
              text_color: '#1a1a1a',
            }}
          />
        )}

        <SingleRelatedPosts relatedPosts={relatedPosts} moreFromAuthorPosts={moreFromAuthorPosts} />
      </div>
    </>
  )
}

export default Page
