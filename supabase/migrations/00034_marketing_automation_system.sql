
-- ════════════════════════════════════════════════════════
-- Marketing Automation System Tables
-- ════════════════════════════════════════════════════════

-- ── 1. Email Leads (visitor captures) ───────────────────
CREATE TABLE IF NOT EXISTS public.email_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  first_name    text,
  source        text DEFAULT 'popup',       -- popup | landing | referral
  status        text DEFAULT 'new',         -- new | converted | unsubscribed
  tags          text[] DEFAULT '{}',
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  opted_in      boolean DEFAULT false,
  opted_in_at   timestamptz,
  consent_ip    text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- ── 2. Popup Configurations ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.popup_configs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL DEFAULT 'Limited Time Offer',
  subtitle         text,
  description      text,
  button_text      text DEFAULT 'Claim Offer',
  cta_url          text DEFAULT '/register',
  background_image text,
  banner_image     text,
  is_active        boolean DEFAULT false,
  expires_at       timestamptz,
  display_frequency text DEFAULT 'once_per_day',  -- once_per_session | once_per_day | always
  cooldown_hours   int DEFAULT 24,
  trigger_delay_seconds  int DEFAULT 25,
  trigger_scroll_pct     int DEFAULT 50,
  trigger_exit_intent    boolean DEFAULT true,
  trigger_multi_page     boolean DEFAULT true,
  multi_page_threshold   int DEFAULT 2,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── 3. Popup Analytics ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.popup_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id   uuid REFERENCES public.popup_configs(id) ON DELETE CASCADE,
  event_type text NOT NULL,   -- impression | dismiss | email_captured | cta_click
  session_id text,
  email      text,
  created_at timestamptz DEFAULT now()
);

-- ── 4. Marketing Automation Sequences ────────────────────
CREATE TABLE IF NOT EXISTS public.automation_sequences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        text NOT NULL,  -- unverified_reminder | no_deposit | no_contract | abandoned_purchase
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_sequence_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  uuid REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  step_order   int NOT NULL,
  delay_hours  int NOT NULL,
  subject      text NOT NULL,
  body_html    text NOT NULL,
  body_text    text,
  promotion_id uuid,   -- FK added after promotions table
  created_at   timestamptz DEFAULT now()
);

-- Track per-user sequence enrollment & progress
CREATE TABLE IF NOT EXISTS public.user_sequence_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id uuid REFERENCES public.automation_sequences(id) ON DELETE CASCADE,
  next_step   int DEFAULT 1,
  status      text DEFAULT 'active',  -- active | completed | stopped
  enrolled_at timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, sequence_id)
);

-- ── 5. Campaigns ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  campaign_type   text NOT NULL,  -- welcome | educational | promotional | seasonal | product_launch | newsletter | feature_announcement
  status          text DEFAULT 'draft',  -- draft | scheduled | sending | paused | completed | archived
  subject         text,
  body_html       text,
  body_text       text,
  segment_filters jsonb DEFAULT '{}',
  promotion_id    uuid,
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  total_sent      int DEFAULT 0,
  total_delivered int DEFAULT 0,
  total_opened    int DEFAULT 0,
  total_clicked   int DEFAULT 0,
  total_converted int DEFAULT 0,
  revenue_cents   bigint DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Campaign email events
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  event_type   text NOT NULL,  -- sent | delivered | opened | clicked | converted | bounced | unsubscribed
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

-- ── 6. Promotions & Discounts ────────────────────────────
CREATE TABLE IF NOT EXISTS public.promotions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  promo_type           text NOT NULL,  -- percentage | fixed | bonus_hashpower | maintenance_discount | coupon | campaign
  discount_value       numeric(10,4),   -- pct or fixed USD
  bonus_hashpower_th   numeric(10,4),   -- TH/s bonus
  coupon_code          text UNIQUE,
  start_date           timestamptz,
  end_date             timestamptz,
  max_redemptions      int,
  redemptions_count    int DEFAULT 0,
  max_per_user         int DEFAULT 1,
  eligible_segments    text[] DEFAULT '{}',  -- all | verified | deposited | etc.
  applicable_contract_ids uuid[] DEFAULT '{}',
  min_purchase_usd     numeric(10,2) DEFAULT 0,
  can_stack            boolean DEFAULT false,
  is_active            boolean DEFAULT true,
  created_by           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_redemptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id  uuid,
  discount_usd numeric(10,2),
  redeemed_at  timestamptz DEFAULT now(),
  UNIQUE(promotion_id, user_id)
);

-- Add FK to sequence steps
ALTER TABLE public.automation_sequence_steps
  ADD CONSTRAINT fk_step_promotion
  FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE SET NULL;

-- Add FK to campaigns
ALTER TABLE public.marketing_campaigns
  ADD CONSTRAINT fk_campaign_promotion
  FOREIGN KEY (promotion_id) REFERENCES public.promotions(id) ON DELETE SET NULL;

-- ── 7. Abandoned Purchase Tracking ──────────────────────
CREATE TABLE IF NOT EXISTS public.abandoned_purchases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text,
  contract_id       uuid,
  contract_name     text,
  contract_price_usd numeric(12,2),
  hashrate_th       numeric(12,4),
  abandonment_stage text DEFAULT 'contract_selected',  -- contract_selected | payment_method | payment_initiated
  status            text DEFAULT 'abandoned',  -- abandoned | recovered | lost
  recovery_emails_sent int DEFAULT 0,
  abandoned_at      timestamptz DEFAULT now(),
  recovered_at      timestamptz,
  UNIQUE(user_id, contract_id)  -- one record per user+contract combo (upsert)
);

-- ── 8. Email Consent & Preferences ──────────────────────
CREATE TABLE IF NOT EXISTS public.email_consent (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text NOT NULL,
  marketing_optin  boolean DEFAULT true,
  educational_optin boolean DEFAULT true,
  promotional_optin boolean DEFAULT true,
  product_updates_optin boolean DEFAULT true,
  newsletter_optin  boolean DEFAULT true,
  transactional    boolean DEFAULT true,  -- always true
  double_opted_in  boolean DEFAULT false,
  double_optin_at  timestamptz,
  unsubscribed_all boolean DEFAULT false,
  unsubscribed_at  timestamptz,
  consent_source   text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ── 9. Funnel Analytics Events ───────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event      text NOT NULL,  -- visitor | lead_captured | registered | verified | deposited | contract_purchased | repeat_purchase
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email      text,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- RLS Policies
-- ════════════════════════════════════════════════════════

ALTER TABLE public.email_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Admin full access helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- popup_configs: admin full, anon can read active non-expired
CREATE POLICY "admin_all_popup_configs"      ON public.popup_configs FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "public_read_active_popups"    ON public.popup_configs FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- popup_events: insert by anyone (anon), admin reads
CREATE POLICY "anon_insert_popup_events"     ON public.popup_events  FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_read_popup_events"      ON public.popup_events  FOR SELECT USING (is_admin());

-- email_leads: insert by anyone, admin full
CREATE POLICY "anon_insert_leads"            ON public.email_leads   FOR INSERT WITH CHECK (true);
CREATE POLICY "admin_all_leads"              ON public.email_leads   FOR ALL    USING (is_admin());

-- automation sequences: admin full
CREATE POLICY "admin_all_sequences"          ON public.automation_sequences       FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_sequence_steps"     ON public.automation_sequence_steps  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_enrollments"        ON public.user_sequence_enrollments  FOR ALL USING (is_admin());
CREATE POLICY "service_insert_enrollments"   ON public.user_sequence_enrollments  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_enrollments"   ON public.user_sequence_enrollments  FOR UPDATE USING (true);

-- campaigns: admin full
CREATE POLICY "admin_all_campaigns"          ON public.marketing_campaigns FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_all_campaign_events"    ON public.campaign_events     FOR ALL USING (is_admin());
CREATE POLICY "service_insert_campaign_ev"   ON public.campaign_events     FOR INSERT WITH CHECK (true);

-- promotions: admin full, authenticated users can read active promos
CREATE POLICY "admin_all_promotions"         ON public.promotions            FOR ALL    USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "auth_read_active_promotions"  ON public.promotions            FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);
CREATE POLICY "admin_all_redemptions"        ON public.promotion_redemptions FOR ALL    USING (is_admin());
CREATE POLICY "user_own_redemptions"         ON public.promotion_redemptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "service_insert_redemptions"   ON public.promotion_redemptions FOR INSERT WITH CHECK (true);

-- abandoned purchases: user owns their records, admin full
CREATE POLICY "admin_all_abandoned"          ON public.abandoned_purchases FOR ALL    USING (is_admin());
CREATE POLICY "user_own_abandoned"           ON public.abandoned_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "service_upsert_abandoned"     ON public.abandoned_purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_abandoned"     ON public.abandoned_purchases FOR UPDATE USING (true);

-- email_consent: user owns, admin full
CREATE POLICY "admin_all_consent"            ON public.email_consent FOR ALL    USING (is_admin());
CREATE POLICY "user_own_consent"             ON public.email_consent FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_update_consent"          ON public.email_consent FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "service_insert_consent"       ON public.email_consent FOR INSERT WITH CHECK (true);

-- funnel_events: admin reads, service inserts
CREATE POLICY "admin_read_funnel"            ON public.funnel_events FOR SELECT USING (is_admin());
CREATE POLICY "service_insert_funnel"        ON public.funnel_events FOR INSERT WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- Seed default automation sequences
-- ════════════════════════════════════════════════════════
INSERT INTO public.automation_sequences (name, type, is_active) VALUES
  ('Unverified User Reminder', 'unverified_reminder', true),
  ('Verified – No Deposit', 'no_deposit', true),
  ('Deposited – No Contract', 'no_contract', true),
  ('Abandoned Purchase Recovery', 'abandoned_purchase', true)
ON CONFLICT DO NOTHING;
