
-- ─── ENUM TYPES ───────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
CREATE TYPE public.contract_status AS ENUM ('active', 'expired', 'cancelled', 'pending');
CREATE TYPE public.tx_type AS ENUM ('deposit', 'withdrawal', 'reward', 'commission', 'bonus');
CREATE TYPE public.tx_status AS ENUM ('pending', 'confirmed', 'failed', 'processing');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.notification_type AS ENUM ('system', 'reward', 'deposit', 'withdrawal', 'contract', 'security', 'kyc');

-- ─── PROFILES ─────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  username    text UNIQUE,
  first_name  text,
  last_name   text,
  country     text,
  role        public.user_role NOT NULL DEFAULT 'user',
  kyc_status  public.kyc_status NOT NULL DEFAULT 'not_submitted',
  twofa_enabled boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auth trigger: sync new users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.profiles WHERE id = uid; $$;

-- Profiles RLS
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (no role change)"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM public.get_user_role(auth.uid()));

-- ─── WALLETS ──────────────────────────────────────────────────
CREATE TABLE public.wallets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency    text NOT NULL,
  symbol      text NOT NULL,
  balance     numeric(28,8) NOT NULL DEFAULT 0,
  address     text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, currency)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wallets"
  ON public.wallets FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access wallets"
  ON public.wallets FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── CONTRACTS ────────────────────────────────────────────────
CREATE TABLE public.contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contract_name     text NOT NULL,
  algorithm         text NOT NULL,
  coin              text NOT NULL,
  hashrate          numeric(18,4) NOT NULL,
  hashrate_unit     text NOT NULL DEFAULT 'TH/s',
  pool_allocation   text,
  hardware          text,
  status            public.contract_status NOT NULL DEFAULT 'active',
  start_date        date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date       date NOT NULL,
  rewards_generated numeric(28,8) NOT NULL DEFAULT 0,
  maintenance_paid  numeric(28,8) NOT NULL DEFAULT 0,
  price_paid        numeric(18,2) NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own contracts"
  ON public.contracts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access contracts"
  ON public.contracts FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── TRANSACTIONS ─────────────────────────────────────────────
CREATE TABLE public.transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        public.tx_type NOT NULL,
  amount      numeric(28,8) NOT NULL,
  currency    text NOT NULL,
  usd_value   numeric(18,2) NOT NULL DEFAULT 0,
  status      public.tx_status NOT NULL DEFAULT 'pending',
  hash        text,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text,
  type        public.notification_type NOT NULL DEFAULT 'system',
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── KYC SUBMISSIONS ──────────────────────────────────────────
CREATE TABLE public.kyc_submissions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doc_type          text NOT NULL,
  doc_url           text,
  selfie_url        text,
  status            public.kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason  text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own kyc"
  ON public.kyc_submissions FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access kyc"
  ON public.kyc_submissions FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── SUPPORT TICKETS ──────────────────────────────────────────
CREATE TABLE public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject     text NOT NULL,
  message     text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  priority    public.ticket_priority NOT NULL DEFAULT 'medium',
  status      public.ticket_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- ─── AFFILIATE LINKS ──────────────────────────────────────────
CREATE TABLE public.affiliate_links (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  referral_code       text NOT NULL UNIQUE,
  referral_count      int NOT NULL DEFAULT 0,
  total_commissions   numeric(28,8) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own affiliate"
  ON public.affiliate_links FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins full access affiliate"
  ON public.affiliate_links FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Auto-create affiliate link for new users
CREATE OR REPLACE FUNCTION public.create_affiliate_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  code := 'BTCM-' || upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 5));
  INSERT INTO public.affiliate_links (user_id, referral_code)
  VALUES (NEW.id, code)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_affiliate_link();
