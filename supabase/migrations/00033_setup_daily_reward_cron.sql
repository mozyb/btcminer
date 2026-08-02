
-- Enable pg_cron extension (Supabase supports this on Pro/paid plans;
-- on free tier the extension may not be available — the schedule-daily-rewards
-- Edge Function can still be triggered manually or via external cron).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily reward job at 00:05 UTC every day.
-- The function calls the schedule-daily-rewards Edge Function via net.http_post.
-- Uses pg_net for outbound HTTP — also enable that extension.
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing schedule if any (idempotent)
SELECT cron.unschedule('daily-mining-rewards') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-mining-rewards'
);

-- Register the cron job — calls the schedule-daily-rewards Edge Function daily at 00:05 UTC
SELECT cron.schedule(
  'daily-mining-rewards',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/schedule-daily-rewards',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  )
  $$
);
