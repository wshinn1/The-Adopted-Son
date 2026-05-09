-- Givings table
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS givings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name              text NOT NULL,
  donor_email             text NOT NULL,
  donor_phone             text,
  amount_cents            integer NOT NULL CHECK (amount_cents > 0),
  is_recurring            boolean NOT NULL DEFAULT false,
  stripe_payment_intent_id text UNIQUE,
  stripe_subscription_id  text,
  status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  note                    text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS givings_stripe_pi_idx ON givings (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS givings_email_idx ON givings (donor_email);
CREATE INDEX IF NOT EXISTS givings_created_at_idx ON givings (created_at DESC);

-- RLS: no public reads — admin service role only
ALTER TABLE givings ENABLE ROW LEVEL SECURITY;

-- Allow service role (used by admin API routes and webhook) full access
-- No RLS policies needed for service role — it bypasses RLS by default

-- Allow authenticated users to read their own givings (for account/billing page)
CREATE POLICY "Users can view own givings" ON givings
  FOR SELECT
  USING (donor_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Drop old tables (run only after confirming data is migrated/not needed)
-- DROP TABLE IF EXISTS visitor_trials;
-- DROP TABLE IF EXISTS subscription_plans;

-- Update nav_links to replace Pricing with Give
-- Run this in Supabase SQL editor after running the givings table migration above

UPDATE site_settings
SET value = REPLACE(
  REPLACE(
    value::text,
    '"label":"Pricing","url":"/pricing"',
    '"label":"Give","url":"/give"'
  ),
  '"label": "Pricing", "url": "/pricing"',
  '"label": "Give", "url": "/give"'
)::jsonb
WHERE key = 'nav_links'
  AND value::text ILIKE '%pricing%';
