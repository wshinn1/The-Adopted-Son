# The Adopted Son

A modern, full-stack content management system and website built with Next.js 16, Supabase, and Tailwind CSS. Features a comprehensive admin dashboard, blog/devotional system, newsletter management, and Stripe integration for subscriptions.

## Features

### Public Website
- **Dynamic Pages** - Create and manage pages with drag-and-drop section builder
- **Hero Slider** - Full-width hero sections with rotating headlines and image slideshows
- **Blog & Devotionals** - Rich text content with categories, tags, and author management
- **Newsletter Signup** - Email capture with Resend integration
- **Contact Forms** - Customizable contact page with email notifications
- **Responsive Design** - Mobile-first design with scroll-reveal navigation

### Admin Dashboard
- **Page Builder** - Visual page editor with reusable section components
- **Media Library** - Upload and manage images with Vercel Blob storage
- **Typography Settings** - Customize fonts (heading, body, accent, caption, hero)
- **Site Colors** - Brand color management with live preview
- **Menu Editor** - Drag-and-drop navigation management
- **Subscriber Management** - View and export newsletter subscribers
- **Analytics** - Track page views and visitor engagement
- **Popup Manager** - Create and schedule promotional popups
- **Backup System** - Export site data as JSON

### Integrations
- **Supabase** - Database, authentication, and row-level security
- **Stripe** - Subscription payments and billing management
- **Resend** - Transactional and newsletter emails
- **Vercel Blob** - Media file storage
- **PostHog** - Analytics and event tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend
- **Storage**: Vercel Blob
- **Editor**: TipTap (rich text)
- **Animations**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wshinn1/The-Adopted-Son.git
cd The-Adopted-Son
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Resend
RESEND_API_KEY=your_resend_api_key

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Run database migrations in Supabase SQL Editor (scripts in `/scripts` folder)

6. Start the development server:
```bash
pnpm dev
```

Visit `http://localhost:3000` for the public site and `http://localhost:3000/admin` for the dashboard.

## Project Structure

```
src/
├── app/
│   ├── (public)/       # Public pages (home, about, contact, etc.)
│   ├── (app)/          # Blog, devotionals, posts
│   ├── admin/          # Admin dashboard pages
│   ├── auth/           # Authentication pages
│   ├── account/        # User account pages
│   └── api/            # API routes
├── components/
│   ├── admin/          # Admin UI components
│   ├── sections/       # Page section components
│   └── ...             # Shared components
├── lib/
│   ├── supabase/       # Supabase client setup
│   └── ...             # Utility functions
└── styles/             # Global styles and Tailwind config
```

## Admin Features

| Feature | Path | Description |
|---------|------|-------------|
| Dashboard | `/admin` | Overview and quick actions |
| Pages | `/admin/pages` | Create and edit pages |
| Devotionals | `/admin/devotionals` | Manage devotional content |
| Media | `/admin/media` | Upload and organize media |
| Menu | `/admin/menu` | Edit navigation links |
| Settings | `/admin/site-settings` | Site name, logo, footer |
| Typography | `/admin/typography` | Font settings |
| Colors | `/admin/site-colors` | Brand colors |
| Subscribers | `/admin/subscribers` | Newsletter management |
| Popup | `/admin/popup` | Promotional popups |
| Analytics | `/admin/analytics` | Traffic and engagement |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual

```bash
pnpm build
pnpm start
```

## Built with v0

This repository is linked to a [v0](https://v0.app) project.

[Continue working on v0](https://v0.app/chat/projects/prj_m7czdgAAJSUyhIctWEOCAGDP3UZq)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Resend Documentation](https://resend.com/docs)

## License

This project is private and proprietary.
