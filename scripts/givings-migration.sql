-- ============================================================
-- 1. Givings table
-- Run this in the Supabase SQL editor
-- ============================================================

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

-- Allow authenticated users to read their own givings (for account/billing page)
CREATE POLICY "Users can view own givings" ON givings
  FOR SELECT
  USING (donor_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Drop old tables (run only after confirming data is migrated/not needed)
-- DROP TABLE IF EXISTS visitor_trials;
-- DROP TABLE IF EXISTS subscription_plans;


-- ============================================================
-- 2. Update nav_links: replace Pricing with Give
-- ============================================================

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


-- ============================================================
-- 3. Security: revoke public execute on trigger-only functions
--
-- handle_new_user, handle_updated_at, and is_admin are database
-- trigger functions and should never be callable via the REST API
-- by anon or authenticated users. Revoking EXECUTE here does NOT
-- break the triggers — triggers run as the function owner regardless.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
