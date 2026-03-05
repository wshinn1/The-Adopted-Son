import BackgroundSection from '@/components/BackgroundSection'
import SectionHero from '@/components/SectionHero'
import SectionSubscribe2 from '@/components/SectionSubscribe2'
import DevotionalFeatured from '@/components/devotional/DevotionalFeatured'
import DevotionalGridSection from '@/components/devotional/DevotionalGridSection'
import TrialBanner from '@/components/devotional/TrialBanner'
import { devotionalToPost, getDevotionals } from '@/lib/devotional-mapper'
import { createClient } from '@/lib/supabase/server'
import heroImg from '@/images/hero-right.jpg'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Adopted Son — Daily Devotionals',
  description: 'Faith-filled daily devotionals to draw you closer to God. Start your 14-day free trial today.',
}

export default async function HomePage() {
  const supabase = await createClient()
  
  // Fetch devotionals from Supabase
  const devotionals = await getDevotionals(supabase, { limit: 12, published: true })
  
  // Convert to template's post format
  const posts = devotionals.map(devotionalToPost)
  
  // Split posts for different sections
  const featuredPosts = posts.slice(0, 5)
  const recentPosts = posts.slice(0, 8)
  
  return (
    <div className="relative">
      {/* TRIAL BANNER */}
      <TrialBanner />
      
      {/* HERO SECTION */}
      <SectionHero
        className="container pt-10 pb-16 lg:pb-28 lg:pt-20"
        rightImg={heroImg}
        heading={
          <>
            Draw closer to God <br /> one day at a time
          </>
        }
        subHeading="Daily devotionals rooted in Scripture to strengthen your faith and deepen your relationship with Christ. Start your 14-day free trial."
        btnText="Start Reading"
        btnHref="/devotionals"
      />
      
      {/* FEATURED DEVOTIONALS */}
      {featuredPosts.length > 0 && (
        <div className="relative py-16">
          <BackgroundSection />
          <DevotionalFeatured
            className="container"
            posts={featuredPosts}
            heading="Featured Devotionals"
            subHeading="Handpicked readings to inspire and encourage you"
          />
        </div>
      )}
      
      {/* RECENT DEVOTIONALS GRID */}
      {recentPosts.length > 0 && (
        <DevotionalGridSection
          className="container py-16 lg:py-28"
          posts={recentPosts}
          heading="Recent Devotionals"
          subHeading="Fresh perspectives on faith, hope, and love"
          gridClass="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        />
      )}
      
      {/* SUBSCRIBE SECTION */}
      <div className="relative py-16">
        <BackgroundSection />
        <SectionSubscribe2 className="container" />
      </div>
      
      {/* EMPTY STATE */}
      {posts.length === 0 && (
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200">
            No devotionals yet
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Check back soon for inspiring daily readings.
          </p>
        </div>
      )}
    </div>
  )
}
