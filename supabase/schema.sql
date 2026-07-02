-- ============================================================
-- SECTION: SCHEMA
-- ============================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_cron; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";


--
-- Name: EXTENSION "pg_cron"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_cron" IS 'Job scheduler for PostgreSQL';


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS "public";


--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";


--
-- Name: EXTENSION "pg_net"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pg_net" IS 'Async HTTP';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: contract_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'contract_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."contract_status" AS ENUM (
    'active',
    'expired',
    'cancelled',
    'pending'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: kyc_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'kyc_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."kyc_status" AS ENUM (
    'not_submitted',
    'pending',
    'approved',
    'rejected'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'notification_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."notification_type" AS ENUM (
    'system',
    'reward',
    'deposit',
    'withdrawal',
    'contract',
    'security',
    'kyc',
    'mining'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ticket_priority'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ticket_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."ticket_status" AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tx_status; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'tx_status'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."tx_status" AS ENUM (
    'pending',
    'confirmed',
    'failed',
    'processing'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: tx_type; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'tx_type'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."tx_type" AS ENUM (
    'deposit',
    'withdrawal',
    'reward',
    'commission',
    'bonus',
    'mining_reward'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'user_role'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'admin'
);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: admin_adjust_balance("uuid", "text", numeric, "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."admin_adjust_balance"("p_user_id" "uuid", "p_currency" "text", "p_amount" numeric, "p_note" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_balance numeric;
BEGIN
  -- Ensure wallet row exists
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (p_user_id, p_currency, p_currency, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;

  -- Check sufficient balance for debits
  IF p_amount < 0 THEN
    SELECT balance INTO v_balance
      FROM public.wallets
     WHERE user_id = p_user_id AND currency = p_currency;
    IF COALESCE(v_balance, 0) + p_amount < 0 THEN
      RAISE EXCEPTION 'Insufficient balance: have %, debit %', COALESCE(v_balance, 0), ABS(p_amount);
    END IF;
  END IF;

  -- Apply adjustment
  UPDATE public.wallets
     SET balance    = balance + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND currency = p_currency;

  -- Record as admin transaction
  INSERT INTO public.transactions (
    user_id, type, currency, amount, usd_value, status, note
  ) VALUES (
    p_user_id,
    CASE WHEN p_amount >= 0 THEN 'deposit' ELSE 'withdrawal' END,
    p_currency,
    ABS(p_amount),
    0,
    'confirmed',
    COALESCE(p_note, CASE WHEN p_amount >= 0 THEN 'Admin top-up' ELSE 'Admin debit' END)
  );
END;
$$;


--
-- Name: approve_deposit("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."approve_deposit"("tx_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_currency text;
BEGIN
  SELECT user_id, amount, currency INTO v_user_id, v_amount, v_currency
    FROM public.transactions WHERE id = tx_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Transaction not found: %', tx_id; END IF;

  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (v_user_id, v_currency, v_currency, v_amount)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance    = wallets.balance + EXCLUDED.balance,
                  updated_at = now();

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;


--
-- Name: approve_withdrawal("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."approve_withdrawal"("tx_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid; v_amount numeric; v_currency text; v_balance numeric;
BEGIN
  SELECT user_id, amount, currency INTO v_user_id, v_amount, v_currency
    FROM public.transactions WHERE id = tx_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Transaction not found: %', tx_id; END IF;

  SELECT balance INTO v_balance FROM public.wallets
    WHERE user_id = v_user_id AND currency = v_currency;
  IF v_balance IS NULL OR v_balance < v_amount THEN
    RAISE EXCEPTION 'Insufficient balance: have %, need %', COALESCE(v_balance, 0), v_amount;
  END IF;

  UPDATE public.wallets
     SET balance    = balance - v_amount,
         updated_at = now()
   WHERE user_id = v_user_id AND currency = v_currency;

  UPDATE public.transactions SET status = 'confirmed' WHERE id = tx_id;
END;
$$;


--
-- Name: create_affiliate_link(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_affiliate_link"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  code text;
BEGIN
  -- Use gen_random_uuid() which is always available in Supabase
  code := 'BTCM-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 5));
  INSERT INTO public.affiliate_links (user_id, referral_code)
  VALUES (NEW.id, code)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: create_default_wallets(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."create_default_wallets"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
  VALUES
    (NEW.id, 'BTC',  'BTC',  0),
    (NEW.id, 'ETH',  'ETH',  0),
    (NEW.id, 'USDT', 'USDT', 0)
  ON CONFLICT (user_id, currency) DO NOTHING;
  RETURN NEW;
END;
$$;


--
-- Name: credit_mining_reward("uuid", "text", numeric, numeric, "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."credit_mining_reward"("p_user_id" "uuid", "p_currency" "text", "p_amount" numeric, "p_usd_value" numeric DEFAULT 0, "p_note" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Ensure wallet row exists
  INSERT INTO public.wallets (user_id, currency, symbol, balance)
    VALUES (p_user_id, p_currency, p_currency, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;

  -- Credit wallet balance
  UPDATE public.wallets
     SET balance    = balance + p_amount,
         updated_at = now()
   WHERE user_id = p_user_id AND currency = p_currency;

  -- Insert single mining_reward transaction (not deposit)
  INSERT INTO public.transactions (
    user_id, type, currency, amount, usd_value, status, note
  ) VALUES (
    p_user_id,
    'mining_reward',
    p_currency,
    p_amount,
    p_usd_value,
    'confirmed',
    COALESCE(p_note, 'Daily mining reward')
  );
END;
$$;


--
-- Name: enforce_single_primary_wallet(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."enforce_single_primary_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE user_wallets
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: get_user_role("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."get_user_role"("uid" "uuid") RETURNS "public"."user_role"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ SELECT role FROM public.profiles WHERE id = uid; $$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$;


--
-- Name: increment_contract_reward("uuid", numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."increment_contract_reward"("p_contract_id" "uuid", "p_amount" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE contracts
  SET rewards_generated = COALESCE(rewards_generated, 0) + p_amount
  WHERE id = p_contract_id;
END;
$$;


--
-- Name: reject_transaction("uuid"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."reject_transaction"("tx_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.transactions SET status = 'failed' WHERE id = tx_id AND status = 'pending';
END;
$$;


--
-- Name: set_wallet_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION "public"."set_wallet_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: affiliate_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."affiliate_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referral_code" "text" NOT NULL,
    "referral_count" integer DEFAULT 0 NOT NULL,
    "total_commissions" numeric(28,8) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "body" "text",
    "category" "text" DEFAULT 'Mining'::"text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "author_name" "text" DEFAULT 'BTCMiner Team'::"text",
    "author_avatar" "text",
    "featured_image" "text",
    "featured" boolean DEFAULT false,
    "published" boolean DEFAULT true,
    "meta_title" "text",
    "meta_description" "text",
    "read_time_min" integer DEFAULT 5,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: calculator_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."calculator_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text",
    "body" "text" NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: calculator_faq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."calculator_faq" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: calculator_hardware; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."calculator_hardware" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model" "text" NOT NULL,
    "manufacturer" "text",
    "hashrate_ths" numeric NOT NULL,
    "power_watts" integer NOT NULL,
    "efficiency_jth" numeric,
    "est_daily_usd" numeric,
    "efficiency_rating" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL
);


--
-- Name: calculator_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."calculator_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anchor_text" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL
);


--
-- Name: contract_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."contract_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "short_description" "text",
    "coin" "text" DEFAULT 'Bitcoin'::"text" NOT NULL,
    "algorithm" "text" DEFAULT 'SHA-256'::"text" NOT NULL,
    "hashrate" numeric DEFAULT 100 NOT NULL,
    "hashrate_unit" "text" DEFAULT 'TH/s'::"text" NOT NULL,
    "mining_pool" "text",
    "mining_farm" "text",
    "hardware" "text",
    "duration" integer DEFAULT 30 NOT NULL,
    "is_lifetime" boolean DEFAULT false NOT NULL,
    "estimated_daily_reward" numeric DEFAULT 0 NOT NULL,
    "estimated_monthly_reward" numeric DEFAULT 0 NOT NULL,
    "estimated_annual_reward" numeric DEFAULT 0 NOT NULL,
    "reward_method" "text" DEFAULT 'fixed'::"text" NOT NULL,
    "maintenance_fee" numeric DEFAULT 0 NOT NULL,
    "electricity_fee" numeric DEFAULT 0 NOT NULL,
    "pool_fee" numeric DEFAULT 0 NOT NULL,
    "price" numeric DEFAULT 0 NOT NULL,
    "discount_price" numeric,
    "promotional_price" numeric,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "tax" numeric DEFAULT 0 NOT NULL,
    "min_purchase" integer DEFAULT 1 NOT NULL,
    "max_purchase" integer DEFAULT 100 NOT NULL,
    "estimated_btc_production" numeric DEFAULT 0 NOT NULL,
    "estimated_usd_value" numeric DEFAULT 0 NOT NULL,
    "network_difficulty_multiplier" numeric DEFAULT 1 NOT NULL,
    "pool_efficiency" numeric DEFAULT 98 NOT NULL,
    "hardware_efficiency" numeric DEFAULT 100 NOT NULL,
    "available_capacity" integer DEFAULT 1000 NOT NULL,
    "remaining_capacity" integer DEFAULT 1000 NOT NULL,
    "max_per_user" integer DEFAULT 10 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "badge" "text",
    "image_url" "text",
    "banner_url" "text",
    "seo_title" "text",
    "meta_description" "text",
    "keywords" "text",
    "canonical_url" "text",
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contract_name" "text" NOT NULL,
    "algorithm" "text" NOT NULL,
    "coin" "text" NOT NULL,
    "hashrate" numeric(18,4) NOT NULL,
    "hashrate_unit" "text" DEFAULT 'TH/s'::"text" NOT NULL,
    "pool_allocation" "text",
    "hardware" "text",
    "status" "public"."contract_status" DEFAULT 'active'::"public"."contract_status" NOT NULL,
    "start_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expiry_date" "date",
    "rewards_generated" numeric(28,8) DEFAULT 0 NOT NULL,
    "maintenance_paid" numeric(28,8) DEFAULT 0 NOT NULL,
    "price_paid" numeric(18,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "maintenance_fee_rate" numeric(10,6) DEFAULT 0.0028 NOT NULL,
    "mining_pool_id" "uuid",
    "mining_farm_id" "uuid",
    "template_id" "uuid"
);


--
-- Name: daily_reward_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."daily_reward_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "btc_price" numeric(18,2),
    "network_hashrate" numeric(18,6),
    "network_difficulty" numeric(18,6),
    "block_reward" numeric(18,8) DEFAULT 3.125,
    "contracts_processed" integer DEFAULT 0,
    "total_btc_credited" numeric(18,8) DEFAULT 0,
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "queue_id" "uuid",
    "to_email" "text" NOT NULL,
    "to_name" "text",
    "subject" "text" NOT NULL,
    "template_slug" "text",
    "provider_id" "uuid",
    "provider_name" "text",
    "delivery_status" "text" DEFAULT 'pending'::"text",
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "message_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_logs_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'delivered'::"text", 'failed'::"text", 'bounced'::"text", 'complained'::"text", 'opened'::"text", 'clicked'::"text"])))
);


--
-- Name: email_providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "smtp_host" "text",
    "smtp_port" integer DEFAULT 587,
    "username" "text",
    "password" "text",
    "api_key" "text",
    "secret_key" "text",
    "encryption" "text" DEFAULT 'tls'::"text",
    "from_email" "text" NOT NULL,
    "from_name" "text" NOT NULL,
    "reply_to_email" "text",
    "daily_limit" integer DEFAULT 10000,
    "sent_today" integer DEFAULT 0,
    "priority" integer DEFAULT 10,
    "is_active" boolean DEFAULT true,
    "last_error" "text",
    "last_tested_at" timestamp with time zone,
    "test_status" "text" DEFAULT 'untested'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_providers_encryption_check" CHECK (("encryption" = ANY (ARRAY['tls'::"text", 'ssl'::"text", 'none'::"text"]))),
    CONSTRAINT "email_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['smtp'::"text", 'ses'::"text", 'sendgrid'::"text", 'mailgun'::"text", 'postmark'::"text", 'brevo'::"text", 'resend'::"text", 'custom_smtp'::"text"]))),
    CONSTRAINT "email_providers_test_status_check" CHECK (("test_status" = ANY (ARRAY['ok'::"text", 'fail'::"text", 'untested'::"text"])))
);


--
-- Name: email_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "to_email" "text" NOT NULL,
    "to_name" "text",
    "subject" "text" NOT NULL,
    "html_body" "text" NOT NULL,
    "text_body" "text",
    "template_id" "uuid",
    "template_slug" "text",
    "provider_id" "uuid",
    "status" "text" DEFAULT 'queued'::"text",
    "priority" integer DEFAULT 5,
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "next_retry_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "queued_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_queue_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'processing'::"text", 'sent'::"text", 'failed'::"text", 'dead_letter'::"text"])))
);


--
-- Name: email_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_body" "text" DEFAULT ''::"text" NOT NULL,
    "text_body" "text" DEFAULT ''::"text",
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "version" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_templates_category_check" CHECK (("category" = ANY (ARRAY['authentication'::"text", 'security'::"text", 'wallet'::"text", 'mining'::"text", 'account'::"text", 'support'::"text", 'newsletter'::"text"])))
);


--
-- Name: email_verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: faq_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."faq_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" DEFAULT 'General'::"text" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: kyc_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."kyc_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "doc_type" "text" NOT NULL,
    "doc_url" "text",
    "selfie_url" "text",
    "status" "public"."kyc_status" DEFAULT 'pending'::"public"."kyc_status" NOT NULL,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "street" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text",
    "full_name" "text"
);


--
-- Name: marketplace_content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."marketplace_content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "title" "text",
    "body" "text" NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: marketplace_faq; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."marketplace_faq" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: marketplace_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."marketplace_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "anchor_text" "text" NOT NULL,
    "target_url" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "visible" boolean DEFAULT true NOT NULL
);


--
-- Name: marketplace_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."marketplace_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: mining_farms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."mining_farms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "country" "text" NOT NULL,
    "flag" "text" DEFAULT '🏳️'::"text" NOT NULL,
    "capacity" numeric(10,2) DEFAULT 0 NOT NULL,
    "capacity_unit" "text" DEFAULT 'MW'::"text" NOT NULL,
    "power_source" "text" DEFAULT ''::"text" NOT NULL,
    "cooling" "text" DEFAULT ''::"text" NOT NULL,
    "active_miners" integer DEFAULT 0 NOT NULL,
    "online_miners" integer DEFAULT 0 NOT NULL,
    "uptime" numeric(5,2) DEFAULT 99.0 NOT NULL,
    "total_btc_mined" numeric(28,8) DEFAULT 0 NOT NULL,
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "image_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: mining_pools; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."mining_pools" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "url" "text" DEFAULT ''::"text" NOT NULL,
    "algorithm" "text" DEFAULT 'SHA-256'::"text" NOT NULL,
    "fee" numeric DEFAULT 1.0 NOT NULL,
    "min_payout" numeric DEFAULT 0.001 NOT NULL,
    "uptime" numeric DEFAULT 99.5 NOT NULL,
    "location" "text" DEFAULT ''::"text" NOT NULL,
    "hashrate_eh" numeric DEFAULT 0 NOT NULL,
    "workers" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: newsletter_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."newsletter_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_body" "text" DEFAULT ''::"text" NOT NULL,
    "text_body" "text" DEFAULT ''::"text",
    "template_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text",
    "audience_filter" "jsonb" DEFAULT '{}'::"jsonb",
    "recipient_count" integer DEFAULT 0,
    "sent_count" integer DEFAULT 0,
    "delivered_count" integer DEFAULT 0,
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "bounced_count" integer DEFAULT 0,
    "unsubscribed_count" integer DEFAULT 0,
    "scheduled_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newsletter_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "type" "public"."notification_type" DEFAULT 'system'::"public"."notification_type" NOT NULL,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "currency" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "mode" "text" DEFAULT 'manual'::"text" NOT NULL,
    "display_name" "text" NOT NULL,
    "instructions" "text",
    "admin_address" "text",
    "network_tag" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logo_url" "text",
    "coin_symbol" "text",
    "network" "text",
    "description" "text",
    "memo_supported" boolean DEFAULT false NOT NULL,
    "memo_label" "text",
    "min_deposit" numeric DEFAULT 0 NOT NULL,
    "max_deposit" numeric,
    "min_withdrawal" numeric DEFAULT 0 NOT NULL,
    "max_withdrawal" numeric,
    "daily_limit" numeric,
    "deposit_fee" numeric DEFAULT 0 NOT NULL,
    "withdrawal_fee" numeric DEFAULT 0 NOT NULL,
    "network_fee" numeric DEFAULT 0 NOT NULL,
    "required_confirmations" integer DEFAULT 1 NOT NULL,
    "auto_deposit" boolean DEFAULT false NOT NULL,
    "auto_withdrawal" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_recommended" boolean DEFAULT false NOT NULL,
    "is_maintenance" boolean DEFAULT false NOT NULL,
    "api_provider" "text",
    "api_endpoint" "text",
    "webhook_url" "text",
    "extra_addresses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    CONSTRAINT "payment_methods_direction_check" CHECK (("direction" = ANY (ARRAY['deposit'::"text", 'withdrawal'::"text"]))),
    CONSTRAINT "payment_methods_mode_check" CHECK (("mode" = ANY (ARRAY['manual'::"text", 'automatic'::"text"])))
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "label" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: platform_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."platform_stats" (
    "key" "text" NOT NULL,
    "value" "text" DEFAULT '0'::"text" NOT NULL,
    "label" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "username" "text",
    "first_name" "text",
    "last_name" "text",
    "country" "text",
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role" NOT NULL,
    "kyc_status" "public"."kyc_status" DEFAULT 'not_submitted'::"public"."kyc_status" NOT NULL,
    "twofa_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_login_at" timestamp with time zone,
    "email_verified" boolean DEFAULT false NOT NULL,
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'banned'::"text"])))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "author_name" "text" NOT NULL,
    "author_country" "text",
    "avatar_url" "text",
    "rating" integer NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "verified" boolean DEFAULT false,
    "featured" boolean DEFAULT false,
    "visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


--
-- Name: reward_credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."reward_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contract_id" "uuid" NOT NULL,
    "btc_amount" numeric(18,8) NOT NULL,
    "usd_value" numeric(18,2),
    "network_hashrate" numeric(18,6),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority" NOT NULL,
    "status" "public"."ticket_status" DEFAULT 'open'::"public"."ticket_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."tx_type" NOT NULL,
    "amount" numeric(28,8) NOT NULL,
    "currency" "text" NOT NULL,
    "usd_value" numeric(18,2) DEFAULT 0 NOT NULL,
    "status" "public"."tx_status" DEFAULT 'pending'::"public"."tx_status" NOT NULL,
    "hash" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payment_method_id" "uuid",
    "destination_address" "text",
    "show_as_proof" boolean DEFAULT false
);


--
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."user_wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wallet_type" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "address" "text" NOT NULL,
    "label" "text",
    "is_primary" boolean DEFAULT false,
    "network" "text" DEFAULT 'bitcoin'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_wallets_wallet_type_check" CHECK (("wallet_type" = ANY (ARRAY['hot'::"text", 'cold'::"text"])))
);


--
-- Name: wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "currency" "text" NOT NULL,
    "symbol" "text" NOT NULL,
    "balance" numeric(28,8) DEFAULT 0 NOT NULL,
    "address" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: affiliate_links affiliate_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'affiliate_links_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: affiliate_links affiliate_links_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'affiliate_links_referral_code_key'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_referral_code_key" UNIQUE ("referral_code");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: affiliate_links affiliate_links_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'affiliate_links_user_id_key'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_user_id_key" UNIQUE ("user_id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'blog_posts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'blog_posts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'blog_posts_slug_key'
      AND n.nspname = 'public'
      AND c.relname = 'blog_posts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_content calculator_content_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'calculator_content_key_key'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_content'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."calculator_content"
    ADD CONSTRAINT "calculator_content_key_key" UNIQUE ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_content calculator_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'calculator_content_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_content'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."calculator_content"
    ADD CONSTRAINT "calculator_content_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_faq calculator_faq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'calculator_faq_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."calculator_faq"
    ADD CONSTRAINT "calculator_faq_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_hardware calculator_hardware_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'calculator_hardware_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_hardware'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."calculator_hardware"
    ADD CONSTRAINT "calculator_hardware_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_links calculator_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'calculator_links_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."calculator_links"
    ADD CONSTRAINT "calculator_links_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contract_templates contract_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contract_templates_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'contract_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contract_templates contract_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contract_templates_slug_key'
      AND n.nspname = 'public'
      AND c.relname = 'contract_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contract_templates"
    ADD CONSTRAINT "contract_templates_slug_key" UNIQUE ("slug");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contracts_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_reward_jobs daily_reward_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'daily_reward_jobs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'daily_reward_jobs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."daily_reward_jobs"
    ADD CONSTRAINT "daily_reward_jobs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_logs_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_providers email_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_providers_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_providers'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_providers"
    ADD CONSTRAINT "email_providers_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_queue email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_queue_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_queue'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_settings email_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_settings_key_key'
      AND n.nspname = 'public'
      AND c.relname = 'email_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_settings"
    ADD CONSTRAINT "email_settings_key_key" UNIQUE ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_settings email_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_settings_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_settings"
    ADD CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_templates_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_templates email_templates_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_templates_slug_key'
      AND n.nspname = 'public'
      AND c.relname = 'email_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_slug_key" UNIQUE ("slug");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_verification_tokens email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_verification_tokens_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_verification_tokens'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_verification_tokens email_verification_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_verification_tokens_token_hash_key'
      AND n.nspname = 'public'
      AND c.relname = 'email_verification_tokens'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_token_hash_key" UNIQUE ("token_hash");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: faq_items faq_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'faq_items_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'faq_items'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."faq_items"
    ADD CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: kyc_submissions kyc_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'kyc_submissions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'kyc_submissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."kyc_submissions"
    ADD CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_content marketplace_content_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_content_key_key'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_content'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_content"
    ADD CONSTRAINT "marketplace_content_key_key" UNIQUE ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_content marketplace_content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_content_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_content'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_content"
    ADD CONSTRAINT "marketplace_content_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_faq marketplace_faq_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_faq_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_faq"
    ADD CONSTRAINT "marketplace_faq_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_links marketplace_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_links_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_links"
    ADD CONSTRAINT "marketplace_links_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_stats marketplace_stats_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_stats_key_key'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_stats"
    ADD CONSTRAINT "marketplace_stats_key_key" UNIQUE ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_stats marketplace_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'marketplace_stats_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."marketplace_stats"
    ADD CONSTRAINT "marketplace_stats_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mining_farms mining_farms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'mining_farms_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'mining_farms'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."mining_farms"
    ADD CONSTRAINT "mining_farms_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mining_pools mining_pools_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'mining_pools_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'mining_pools'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."mining_pools"
    ADD CONSTRAINT "mining_pools_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: newsletter_campaigns newsletter_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'newsletter_campaigns_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'newsletter_campaigns'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."newsletter_campaigns"
    ADD CONSTRAINT "newsletter_campaigns_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'notifications_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: payment_methods payment_methods_currency_direction_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'payment_methods_currency_direction_key'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_currency_direction_key" UNIQUE ("currency", "direction");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'payment_methods_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'platform_settings_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'platform_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_stats platform_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'platform_stats_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'platform_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."platform_stats"
    ADD CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("key");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_username_key'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'reviews_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reward_credits reward_credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'reward_credits_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'reward_credits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."reward_credits"
    ADD CONSTRAINT "reward_credits_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'support_tickets_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'support_tickets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transactions_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_wallets_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets user_wallets_user_id_address_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_wallets_user_id_address_key'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_address_key" UNIQUE ("user_id", "address");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'wallets_pkey'
      AND n.nspname = 'public'
      AND c.relname = 'wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: wallets wallets_user_id_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'wallets_user_id_currency_key'
      AND n.nspname = 'public'
      AND c.relname = 'wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_currency_key" UNIQUE ("user_id", "currency");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_reward_jobs_run_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS "daily_reward_jobs_run_date_idx" ON "public"."daily_reward_jobs" USING "btree" ("run_date");


--
-- Name: email_logs_sent_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_logs_sent_at_idx" ON "public"."email_logs" USING "btree" ("sent_at" DESC);


--
-- Name: email_logs_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "public"."email_logs" USING "btree" ("delivery_status");


--
-- Name: email_logs_to_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_logs_to_email_idx" ON "public"."email_logs" USING "btree" ("to_email");


--
-- Name: email_queue_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_queue_created_idx" ON "public"."email_queue" USING "btree" ("created_at" DESC);


--
-- Name: email_queue_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "email_queue_status_idx" ON "public"."email_queue" USING "btree" ("status", "next_retry_at");


--
-- Name: idx_evt_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_evt_token" ON "public"."email_verification_tokens" USING "btree" ("token_hash");


--
-- Name: idx_evt_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_evt_user_id" ON "public"."email_verification_tokens" USING "btree" ("user_id");


--
-- Name: idx_mining_farms_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_mining_farms_is_active" ON "public"."mining_farms" USING "btree" ("is_active");


--
-- Name: idx_profiles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_profiles_status" ON "public"."profiles" USING "btree" ("status");


--
-- Name: idx_transactions_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_transactions_user_type" ON "public"."transactions" USING "btree" ("user_id", "type");


--
-- Name: idx_user_wallets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "idx_user_wallets_user_id" ON "public"."user_wallets" USING "btree" ("user_id");


--
-- Name: reward_credits_contract_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "reward_credits_contract_idx" ON "public"."reward_credits" USING "btree" ("contract_id");


--
-- Name: reward_credits_job_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "reward_credits_job_idx" ON "public"."reward_credits" USING "btree" ("job_id");


--
-- Name: reward_credits_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX IF NOT EXISTS "reward_credits_user_idx" ON "public"."reward_credits" USING "btree" ("user_id");


--
-- Name: profiles on_profile_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "on_profile_created" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_affiliate_link"();


--
-- Name: profiles trg_create_default_wallets; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trg_create_default_wallets" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_wallets"();


--
-- Name: user_wallets trg_single_primary_wallet; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trg_single_primary_wallet" BEFORE INSERT OR UPDATE ON "public"."user_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_single_primary_wallet"();


--
-- Name: wallets trg_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE OR REPLACE TRIGGER "trg_wallets_updated_at" BEFORE UPDATE ON "public"."wallets" FOR EACH ROW EXECUTE FUNCTION "public"."set_wallet_updated_at"();


--
-- Name: affiliate_links affiliate_links_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'affiliate_links_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."affiliate_links"
    ADD CONSTRAINT "affiliate_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts contracts_mining_farm_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contracts_mining_farm_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_mining_farm_id_fkey" FOREIGN KEY ("mining_farm_id") REFERENCES "public"."mining_farms"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts contracts_mining_pool_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contracts_mining_pool_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_mining_pool_id_fkey" FOREIGN KEY ("mining_pool_id") REFERENCES "public"."mining_pools"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts contracts_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contracts_template_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."contract_templates"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts contracts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'contracts_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_logs email_logs_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_logs_provider_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."email_providers"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_logs email_logs_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_logs_queue_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_logs"
    ADD CONSTRAINT "email_logs_queue_id_fkey" FOREIGN KEY ("queue_id") REFERENCES "public"."email_queue"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_queue email_queue_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_queue_provider_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_queue'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."email_providers"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_queue email_queue_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_queue_template_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_queue'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_verification_tokens email_verification_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'email_verification_tokens_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'email_verification_tokens'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: kyc_submissions kyc_submissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'kyc_submissions_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'kyc_submissions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."kyc_submissions"
    ADD CONSTRAINT "kyc_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: newsletter_campaigns newsletter_campaigns_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'newsletter_campaigns_created_by_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'newsletter_campaigns'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."newsletter_campaigns"
    ADD CONSTRAINT "newsletter_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: newsletter_campaigns newsletter_campaigns_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'newsletter_campaigns_template_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'newsletter_campaigns'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."newsletter_campaigns"
    ADD CONSTRAINT "newsletter_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."email_templates"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'notifications_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'profiles_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'reviews_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reward_credits reward_credits_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'reward_credits_job_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'reward_credits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."reward_credits"
    ADD CONSTRAINT "reward_credits_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."daily_reward_jobs"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reward_credits reward_credits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'reward_credits_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'reward_credits'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."reward_credits"
    ADD CONSTRAINT "reward_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'support_tickets_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'support_tickets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions transactions_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transactions_payment_method_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'transactions_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets user_wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'user_wallets_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: wallets wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.conname = 'wallets_user_id_fkey'
      AND n.nspname = 'public'
      AND c.relname = 'wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: blog_posts Admin full blog; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admin full blog'
      AND n.nspname = 'public'
      AND c.relname = 'blog_posts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admin full blog" ON "public"."blog_posts" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: faq_items Admin full faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admin full faq'
      AND n.nspname = 'public'
      AND c.relname = 'faq_items'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admin full faq" ON "public"."faq_items" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_stats Admin full platform_stats; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admin full platform_stats'
      AND n.nspname = 'public'
      AND c.relname = 'platform_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admin full platform_stats" ON "public"."platform_stats" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews Admin full reviews; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admin full reviews'
      AND n.nspname = 'public'
      AND c.relname = 'reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admin full reviews" ON "public"."reviews" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets Admins can view all wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins can view all wallets'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins can view all wallets" ON "public"."user_wallets" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: affiliate_links Admins full access affiliate; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access affiliate'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access affiliate" ON "public"."affiliate_links" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts Admins full access contracts; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access contracts'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access contracts" ON "public"."contracts" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: kyc_submissions Admins full access kyc; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access kyc'
      AND n.nspname = 'public'
      AND c.relname = 'kyc_submissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access kyc" ON "public"."kyc_submissions" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications Admins full access notifications; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access notifications'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access notifications" ON "public"."notifications" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: payment_methods Admins full access payment_methods; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access payment_methods'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access payment_methods" ON "public"."payment_methods" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_settings Admins full access platform_settings; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access platform_settings'
      AND n.nspname = 'public'
      AND c.relname = 'platform_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access platform_settings" ON "public"."platform_settings" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: support_tickets Admins full access tickets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access tickets'
      AND n.nspname = 'public'
      AND c.relname = 'support_tickets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access tickets" ON "public"."support_tickets" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions Admins full access transactions; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access transactions'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access transactions" ON "public"."transactions" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: wallets Admins full access wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins full access wallets'
      AND n.nspname = 'public'
      AND c.relname = 'wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins full access wallets" ON "public"."wallets" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles Admins have full access to profiles; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins have full access to profiles'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Admins have full access to profiles" ON "public"."profiles" TO "authenticated" USING (("public"."get_user_role"("auth"."uid"()) = 'admin'::"public"."user_role"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: payment_methods Anon users read active payment_methods; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Anon users read active payment_methods'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Anon users read active payment_methods" ON "public"."payment_methods" FOR SELECT TO "anon" USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: payment_methods Authenticated users read active payment_methods; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users read active payment_methods'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Authenticated users read active payment_methods" ON "public"."payment_methods" FOR SELECT TO "authenticated" USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_settings Authenticated users read platform_settings; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Authenticated users read platform_settings'
      AND n.nspname = 'public'
      AND c.relname = 'platform_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Authenticated users read platform_settings" ON "public"."platform_settings" FOR SELECT TO "authenticated" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mining_pools Public read mining_pools; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Public read mining_pools'
      AND n.nspname = 'public'
      AND c.relname = 'mining_pools'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Public read mining_pools" ON "public"."mining_pools" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_stats Public read platform_stats; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Public read platform_stats'
      AND n.nspname = 'public'
      AND c.relname = 'platform_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Public read platform_stats" ON "public"."platform_stats" FOR SELECT USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: blog_posts Public read published blog; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Public read published blog'
      AND n.nspname = 'public'
      AND c.relname = 'blog_posts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Public read published blog" ON "public"."blog_posts" FOR SELECT USING (("published" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: faq_items Public read visible faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Public read visible faq'
      AND n.nspname = 'public'
      AND c.relname = 'faq_items'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Public read visible faq" ON "public"."faq_items" FOR SELECT USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews Public read visible reviews; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Public read visible reviews'
      AND n.nspname = 'public'
      AND c.relname = 'reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Public read visible reviews" ON "public"."reviews" FOR SELECT USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mining_pools Service full access mining_pools; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Service full access mining_pools'
      AND n.nspname = 'public'
      AND c.relname = 'mining_pools'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Service full access mining_pools" ON "public"."mining_pools" USING (("auth"."role"() = 'service_role'::"text"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews User insert own review; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'User insert own review'
      AND n.nspname = 'public'
      AND c.relname = 'reviews'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "User insert own review" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets Users can delete their own wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can delete their own wallets'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can delete their own wallets" ON "public"."user_wallets" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts Users can insert own contracts; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can insert own contracts'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can insert own contracts" ON "public"."contracts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets Users can insert their own wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can insert their own wallets'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can insert their own wallets" ON "public"."user_wallets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts Users can update own contracts; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can update own contracts'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can update own contracts" ON "public"."contracts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles Users can update their own profile (no role change); Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can update their own profile (no role change)'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can update their own profile (no role change)" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((NOT ("role" IS DISTINCT FROM "public"."get_user_role"("auth"."uid"()))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets Users can update their own wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can update their own wallets'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can update their own wallets" ON "public"."user_wallets" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view their own profile'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets Users can view their own wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users can view their own wallets'
      AND n.nspname = 'public'
      AND c.relname = 'user_wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users can view their own wallets" ON "public"."user_wallets" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions Users insert own transactions; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users insert own transactions'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users insert own transactions" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: kyc_submissions Users manage own kyc; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users manage own kyc'
      AND n.nspname = 'public'
      AND c.relname = 'kyc_submissions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users manage own kyc" ON "public"."kyc_submissions" TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: support_tickets Users manage own tickets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users manage own tickets'
      AND n.nspname = 'public'
      AND c.relname = 'support_tickets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users manage own tickets" ON "public"."support_tickets" TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: wallets Users manage own wallets; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users manage own wallets'
      AND n.nspname = 'public'
      AND c.relname = 'wallets'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users manage own wallets" ON "public"."wallets" TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: affiliate_links Users read own affiliate; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users read own affiliate'
      AND n.nspname = 'public'
      AND c.relname = 'affiliate_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users read own affiliate" ON "public"."affiliate_links" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts Users read own contracts; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users read own contracts'
      AND n.nspname = 'public'
      AND c.relname = 'contracts'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users read own contracts" ON "public"."contracts" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications Users read own notifications; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users read own notifications'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users read own notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: transactions Users read own transactions; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users read own transactions'
      AND n.nspname = 'public'
      AND c.relname = 'transactions'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users read own transactions" ON "public"."transactions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications Users update own notifications; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users update own notifications'
      AND n.nspname = 'public'
      AND c.relname = 'notifications'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "Users update own notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_content admin_all_calculator_content; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_calculator_content'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_content'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_calculator_content" ON "public"."calculator_content" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_faq admin_all_calculator_faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_calculator_faq'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_calculator_faq" ON "public"."calculator_faq" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_hardware admin_all_calculator_hardware; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_calculator_hardware'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_hardware'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_calculator_hardware" ON "public"."calculator_hardware" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_links admin_all_calculator_links; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_calculator_links'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_calculator_links" ON "public"."calculator_links" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: mining_farms admin_all_farms; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_farms'
      AND n.nspname = 'public'
      AND c.relname = 'mining_farms'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_farms" ON "public"."mining_farms" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_content admin_all_marketplace_content; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_marketplace_content'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_content'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_marketplace_content" ON "public"."marketplace_content" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_faq admin_all_marketplace_faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_marketplace_faq'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_marketplace_faq" ON "public"."marketplace_faq" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_links admin_all_marketplace_links; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_marketplace_links'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_marketplace_links" ON "public"."marketplace_links" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_stats admin_all_marketplace_stats; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_marketplace_stats'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_marketplace_stats" ON "public"."marketplace_stats" TO "service_role" USING (true) WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reward_credits admin_all_reward_credits; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_reward_credits'
      AND n.nspname = 'public'
      AND c.relname = 'reward_credits'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_reward_credits" ON "public"."reward_credits" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: daily_reward_jobs admin_all_reward_jobs; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'admin_all_reward_jobs'
      AND n.nspname = 'public'
      AND c.relname = 'daily_reward_jobs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "admin_all_reward_jobs" ON "public"."daily_reward_jobs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: affiliate_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."affiliate_links" ENABLE ROW LEVEL SECURITY;

--
-- Name: blog_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;

--
-- Name: calculator_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."calculator_content" ENABLE ROW LEVEL SECURITY;

--
-- Name: calculator_faq; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."calculator_faq" ENABLE ROW LEVEL SECURITY;

--
-- Name: calculator_hardware; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."calculator_hardware" ENABLE ROW LEVEL SECURITY;

--
-- Name: calculator_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."calculator_links" ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."contract_templates" ENABLE ROW LEVEL SECURITY;

--
-- Name: contract_templates contract_templates_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'contract_templates_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'contract_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "contract_templates_admin_all" ON "public"."contract_templates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contract_templates contract_templates_public_read; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'contract_templates_public_read'
      AND n.nspname = 'public'
      AND c.relname = 'contract_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "contract_templates_public_read" ON "public"."contract_templates" FOR SELECT USING ((("status" = 'active'::"text") AND ("visibility" = 'public'::"text")));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: contracts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."contracts" ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_reward_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."daily_reward_jobs" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_logs email_logs_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_logs_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'email_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_logs_admin_all" ON "public"."email_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_logs email_logs_service_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_logs_service_insert'
      AND n.nspname = 'public'
      AND c.relname = 'email_logs'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_logs_service_insert" ON "public"."email_logs" FOR INSERT WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_providers" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_providers email_providers_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_providers_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'email_providers'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_providers_admin_all" ON "public"."email_providers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_queue email_queue_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_queue_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'email_queue'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_queue_admin_all" ON "public"."email_queue" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_queue email_queue_service_insert; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_queue_service_insert'
      AND n.nspname = 'public'
      AND c.relname = 'email_queue'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_queue_service_insert" ON "public"."email_queue" FOR INSERT WITH CHECK (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_settings email_settings_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_settings_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'email_settings'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_settings_admin_all" ON "public"."email_settings" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_templates" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates email_templates_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'email_templates_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'email_templates'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "email_templates_admin_all" ON "public"."email_templates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: email_verification_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."email_verification_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: faq_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."faq_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: kyc_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."kyc_submissions" ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."marketplace_content" ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_faq; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."marketplace_faq" ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."marketplace_links" ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."marketplace_stats" ENABLE ROW LEVEL SECURITY;

--
-- Name: mining_farms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."mining_farms" ENABLE ROW LEVEL SECURITY;

--
-- Name: mining_pools; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."mining_pools" ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_campaigns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."newsletter_campaigns" ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_campaigns newsletter_campaigns_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'newsletter_campaigns_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'newsletter_campaigns'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "newsletter_campaigns_admin_all" ON "public"."newsletter_campaigns" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_methods payment_methods_admin_all; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'payment_methods_admin_all'
      AND n.nspname = 'public'
      AND c.relname = 'payment_methods'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "payment_methods_admin_all" ON "public"."payment_methods" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: platform_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: platform_stats; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."platform_stats" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: mining_farms public_read_active_farms; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_active_farms'
      AND n.nspname = 'public'
      AND c.relname = 'mining_farms'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_active_farms" ON "public"."mining_farms" FOR SELECT USING (("is_active" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_content public_read_calculator_content; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_calculator_content'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_content'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_calculator_content" ON "public"."calculator_content" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_faq public_read_calculator_faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_calculator_faq'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_calculator_faq" ON "public"."calculator_faq" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_hardware public_read_calculator_hardware; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_calculator_hardware'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_hardware'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_calculator_hardware" ON "public"."calculator_hardware" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: calculator_links public_read_calculator_links; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_calculator_links'
      AND n.nspname = 'public'
      AND c.relname = 'calculator_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_calculator_links" ON "public"."calculator_links" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_content public_read_marketplace_content; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_marketplace_content'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_content'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_marketplace_content" ON "public"."marketplace_content" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_faq public_read_marketplace_faq; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_marketplace_faq'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_faq'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_marketplace_faq" ON "public"."marketplace_faq" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_links public_read_marketplace_links; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_marketplace_links'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_links'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_marketplace_links" ON "public"."marketplace_links" FOR SELECT TO "authenticated", "anon" USING (("visible" = true));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: marketplace_stats public_read_marketplace_stats; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'public_read_marketplace_stats'
      AND n.nspname = 'public'
      AND c.relname = 'marketplace_stats'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "public_read_marketplace_stats" ON "public"."marketplace_stats" FOR SELECT TO "authenticated", "anon" USING (true);
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_credits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."reward_credits" ENABLE ROW LEVEL SECURITY;

--
-- Name: email_verification_tokens service_role_all_evt; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'service_role_all_evt'
      AND n.nspname = 'public'
      AND c.relname = 'email_verification_tokens'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "service_role_all_evt" ON "public"."email_verification_tokens" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: support_tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;

--
-- Name: transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;

--
-- Name: reward_credits user_select_own_reward_credits; Type: POLICY; Schema: public; Owner: -
--

DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'user_select_own_reward_credits'
      AND n.nspname = 'public'
      AND c.relname = 'reward_credits'
  ) THEN
    EXECUTE $pg_schema_sql$
CREATE POLICY "user_select_own_reward_credits" ON "public"."reward_credits" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));
$pg_schema_sql$;
  END IF;
END
$pg_schema_restore$;


--
-- Name: user_wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;

--
-- Name: wallets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




-- ============================================================
-- SECTION: DIFF FILTER OBJECTS
-- ============================================================
-- Objects that match diff-filter.json but cannot be represented
-- precisely by pg_dump --filter.

-- auth.users trigger: on_auth_user_created
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();';
  END IF;
END
$pg_schema_restore$;
-- policy: "Admins access all KYC docs" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Admins access all KYC docs'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins access all KYC docs" ON storage.objects AS PERMISSIVE FOR ALL TO authenticated USING (((bucket_id = ''kyc-documents''::text) AND (public.get_user_role(auth.uid()) = ''admin''::public.user_role)));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Users read own KYC docs" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users read own KYC docs'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users read own KYC docs" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = ''kyc-documents''::text) AND ((storage.foldername(name))[1] = ''kyc''::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));';
  END IF;
END
$pg_schema_restore$;
-- policy: "Users upload own KYC docs" on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'Users upload own KYC docs'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY "Users upload own KYC docs" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = ''kyc-documents''::text) AND ((storage.foldername(name))[1] = ''kyc''::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));';
  END IF;
END
$pg_schema_restore$;
-- policy: farm_images_public_read on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'farm_images_public_read'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY farm_images_public_read ON storage.objects AS PERMISSIVE FOR SELECT TO PUBLIC USING ((bucket_id = ''farm-images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: farm_images_service_delete on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'farm_images_service_delete'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY farm_images_service_delete ON storage.objects AS PERMISSIVE FOR DELETE TO PUBLIC USING ((bucket_id = ''farm-images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: farm_images_service_update on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'farm_images_service_update'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY farm_images_service_update ON storage.objects AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((bucket_id = ''farm-images''::text));';
  END IF;
END
$pg_schema_restore$;
-- policy: farm_images_service_upload on storage.objects
DO $pg_schema_restore$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE pol.polname = 'farm_images_service_upload'
      AND n.nspname = 'storage'
      AND c.relname = 'objects'
  ) THEN
    EXECUTE 'CREATE POLICY farm_images_service_upload ON storage.objects AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((bucket_id = ''farm-images''::text));';
  END IF;
END
$pg_schema_restore$;

-- ============================================================
-- SECTION: STORAGE BUCKETS DATA
-- ============================================================

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('farm-images', 'farm-images', NULL, '2026-06-21 17:38:58.120878+00', '2026-06-21 17:38:58.120878+00', 'true', 'false', '5242880', '{image/jpeg,image/png,image/webp}', NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";
INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES ('kyc-documents', 'kyc-documents', NULL, '2026-06-14 15:32:23.487715+00', '2026-06-14 15:32:23.487715+00', 'false', 'false', NULL, NULL, NULL, 'STANDARD') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "owner" = EXCLUDED."owner", "created_at" = EXCLUDED."created_at", "updated_at" = EXCLUDED."updated_at", "public" = EXCLUDED."public", "avif_autodetection" = EXCLUDED."avif_autodetection", "file_size_limit" = EXCLUDED."file_size_limit", "allowed_mime_types" = EXCLUDED."allowed_mime_types", "owner_id" = EXCLUDED."owner_id", "type" = EXCLUDED."type";
