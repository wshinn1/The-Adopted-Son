# Givings System Implementation Plan

## Overview

Replace the IP tracking / trial / subscription paywall system with a custom financial givings submission system. All devotional content becomes free. Revenue model shifts to voluntary financial givings processed through Stripe.

---

## Phase 1 — Remove Existing Systems

### Delete These Files
- `src/components/devotional/TrialBanner.tsx`
- `src/components/devotional/PaywallGate.tsx`
- `src/components/devotional/PricingPlans.tsx`
- `src/app/api/trial/status/route.ts`
- `src/app/api/trial/check/route.ts`
- `src/app/api/trial/capture-email/route.ts`
- `src/app/admin/trial-banner/page.tsx`
- `src/app/(public)/pricing/page.tsx` (if it exists)
- `src/lib/plans.ts`

### Modify These Files

**`src/lib/trial.ts`**
- Remove `checkAccess()` function entirely
- Remove `getClientIP()` function
- Delete file if nothing else remains

**`src/app/api/stripe/webhook/route.ts`**
- Remove handlers for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
- Keep file — will be rewritten for givings in Phase 3

**`src/app/actions/stripe.ts`**
- Remove `startCheckoutSession()` (subscription checkout)
- Remove `createCustomerPortalSession()`
- Delete file if nothing else remains

**`src/lib/email.ts`**
- Remove `sendTrialStartedEmail()`
- Remove `sendTrialEndingSoonEmail()`
- Remove `sendSubscriptionWelcomeEmail()`
- Remove `sendPaymentReceiptEmail()`
- Keep file — new giving email functions will be added

**`src/app/admin/subscribers/page.tsx`**
- Remove the "Trial Visitors" section (reads from `visitor_trials`)
- Remove the "Paid Subscribers" section and `PaidSubscribersTable` component
- Keep "Newsletter Subscribers" section

**`src/app/(app)/devotionals/[slug]/page.tsx`**
- Remove `checkAccess()` call
- Remove `PaywallGate` component render
- Remove `TrialBanner` component render
- Remove `canRead` logic — all content is always readable
- Remove `getTeaserContent()` call — always pass full content

**All other files that import `TrialBanner`, `PaywallGate`, `PricingPlans`, or `checkAccess`**
- Remove those imports and usages

### Database Migrations (run in Supabase SQL Editor)

```sql
-- Remove subscription fields from profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_plan,
  DROP COLUMN IF EXISTS subscription_period_end;

-- Drop old tables
DROP TABLE IF EXISTS visitor_trials;
DROP TABLE IF EXISTS subscription_plans;
```

---

## Phase 2 — Givings Database Table

Run in Supabase SQL Editor:

```sql
CREATE TABLE givings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                timestamptz NOT NULL DEFAULT now(),
  first_name                text NOT NULL,
  last_name                 text NOT NULL,
  email                     text NOT NULL,
  phone                     text,
  amount_cents              integer NOT NULL,
  giving_date               date NOT NULL DEFAULT current_date,
  note                      text,
  category                  text NOT NULL DEFAULT 'Giving Support',
  stripe_payment_intent_id  text UNIQUE,
  stripe_subscription_id    text,
  user_id                   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_recurring              boolean NOT NULL DEFAULT false,
  status                    text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed'))
);

-- Indexes
CREATE INDEX givings_email_idx ON givings(email);
CREATE INDEX givings_user_id_idx ON givings(user_id);
CREATE INDEX givings_status_idx ON givings(status);
CREATE INDEX givings_created_at_idx ON givings(created_at DESC);

-- RLS
ALTER TABLE givings ENABLE ROW LEVEL SECURITY;

-- Users can read their own givings
CREATE POLICY "Users can view own givings" ON givings
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access" ON givings
  USING (true) WITH CHECK (true);
```

---

## Phase 3 — API Routes

### `POST /api/givings/checkout`

Accepts JSON body:
```ts
{
  firstName: string
  lastName: string
  email: string
  phone?: string
  note?: string
  amountCents: number      // e.g. 5000 for $50.00
  isRecurring: boolean
  createAccount?: boolean
  password?: string        // only if createAccount is true
}
```

Logic:
1. Validate: amount must be >= 100 cents ($1.00 minimum)
2. If `isRecurring`: create or retrieve Stripe Customer, create Stripe Subscription with a monthly giving Price (use `STRIPE_GIVING_MONTHLY_PRICE_ID` env var), return `clientSecret` from subscription's latest invoice's PaymentIntent
3. If one-time: create Stripe PaymentIntent with `amount: amountCents`, `currency: 'usd'`, metadata `{ firstName, lastName, email, phone, note, isRecurring: 'false' }`, return `clientSecret`
4. If `createAccount`: create Supabase auth user with email/password, create profile row with first_name, last_name, email

### `POST /api/stripe/webhook`

Handle these events:

**`payment_intent.succeeded`**
- Read metadata from PaymentIntent: `firstName`, `lastName`, `email`, `phone`, `note`
- Insert row into `givings` with status `'succeeded'`
- Look up `user_id` by email in profiles table (nullable)
- Send giving confirmation email to donor
- Send admin notification email

**`payment_intent.payment_failed`**
- Insert or update `givings` row with status `'failed'`

**`customer.subscription.deleted`** (for recurring givers who cancel)
- Update giving records for that subscription to note cancellation in a future `subscription_status` column if needed

### `GET /api/givings` (admin only)
- Returns all givings with filters: `?status=succeeded&from=2025-01-01&to=2025-12-31`
- Requires admin auth check

---

## Phase 4 — `/give` Page

**Route:** `src/app/(public)/give/page.tsx`

### UI Layout

**Step 1 — Amount Selection**
- Row of preset buttons: $25 · $50 · $100 · $250
- "Other amount" text input (dollar value, converts to cents on submit)
- Selected amount highlighted in blue

**Step 2 — Giver Information**
Form fields (all required unless noted):
- First Name
- Last Name
- Email
- Phone (optional)
- Special Note (optional, textarea, max 300 chars)
- Category: display as read-only label "Giving Support" (no selector needed)

**Step 3 — Giving Type**
- Toggle: "One-time" / "Monthly"
- If "Monthly" selected and user is NOT logged in: show inline message "Monthly giving requires an account" with two options:
  - "Log in" (link to /login)
  - "Create account" checkbox that reveals a password field

**Step 4 — Payment**
- Stripe Elements card form (use `@stripe/react-stripe-js` and `@stripe/stripe-js`)
- Style to match site: white background, neutral borders, blue focus ring
- "Give $X" submit button (disabled until form is valid)

**Success Screen**
- Replace form with confirmation:
  - Checkmark icon
  - "Thank you, [First Name]!"
  - "Your gift of $X.XX has been received."
  - "A confirmation has been sent to [email]."
  - Link back to devotionals

### Implementation Notes
- Use Stripe Payment Element (not individual card/expiry/cvc fields) for PCI compliance
- Load Stripe with `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`
- On form submit: POST to `/api/givings/checkout`, get `clientSecret`, confirm payment with `stripe.confirmPayment()`
- Handle errors inline (show under payment element)

---

## Phase 5 — `/admin/givings` Page

**Route:** `src/app/admin/givings/page.tsx`

### Summary Bar (top of page)
- Total raised (sum of `amount_cents` where `status = 'succeeded'`) displayed as dollars
- Count of unique donors (distinct emails)
- Count of recurring givers

### Filters
- Date range picker (from / to)
- Status filter (All / Succeeded / Failed)

### Table Columns
| Column | Notes |
|--------|-------|
| Date | `giving_date` formatted as Month D, YYYY |
| Name | `first_name last_name` |
| Email | Clickable mailto link |
| Phone | As entered |
| Amount | Formatted as $X.XX |
| Category | "Giving Support" |
| Note | Truncated to 60 chars, expandable |
| Recurring | Yes / No badge |
| Status | Color-coded badge (green = succeeded, red = failed) |

### Export
- "Export CSV" button — downloads all filtered results as CSV with columns: Date, First Name, Last Name, Email, Phone, Amount, Category, Note, Recurring, Status

### Add to Admin Sidebar Navigation
Add "Givings" link to the admin nav menu.

---

## Phase 6 — Emails

Add to `src/lib/email.ts`:

### `sendGivingConfirmationEmail(giving)`
Sent to donor on successful payment.

Content:
- Subject: "Thank you for your gift — The Adopted Son"
- Thank you message
- Giving summary: Amount, Date, Category, Note (if provided)
- Stripe receipt link (from PaymentIntent `receipt_url`)
- Unsubscribe / contact info footer

### `sendGivingAdminNotificationEmail(giving)`
Sent to site admin email on each successful giving.

Content:
- Subject: "New giving received — $X.XX"
- Donor: Full name, email, phone
- Amount, date, category, note
- Recurring: Yes/No
- Link to `/admin/givings`

---

## Environment Variables Needed

Add to Vercel (and `.env.local`):
```
STRIPE_GIVING_MONTHLY_PRICE_ID=price_xxxx   # Create this in Stripe dashboard as a recurring $X/month price
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxx  # Already exists likely
STRIPE_SECRET_KEY=sk_live_xxxx              # Already exists
STRIPE_WEBHOOK_SECRET=whsec_xxxx            # Already exists
```

In Stripe dashboard, create:
- A Product called "Monthly Giving — The Adopted Son"
- A recurring Price on that product (monthly, amount flexible via PaymentIntent override or fixed)

---

## Navigation Updates

- Add `/give` link to main site navigation (HamburgerHeader nav_links in site settings)
- Add "Give" button to header (prominent, blue)
- Remove any pricing/subscription links from nav

---

## Execution Order

1. Run Phase 1 SQL migrations (drop old tables/columns)
2. Run Phase 2 SQL migration (create `givings` table)
3. Remove old files and clean up imports (Phase 1 code removal)
4. Build Phase 3 API routes
5. Build Phase 4 `/give` page
6. Build Phase 5 `/admin/givings` page
7. Add Phase 6 emails
8. Update navigation
9. Test full giving flow end-to-end (one-time + recurring)
10. Deploy
