/**
 * schedule-daily-rewards
 *
 * This function is invoked automatically every day at 00:05 UTC via a
 * Supabase Edge Function cron schedule (set in supabase/config.toml or via
 * the Supabase dashboard → Edge Functions → schedule-daily-rewards → Schedule).
 *
 * It simply calls the credit-daily-rewards function for today's date.
 * Keeping it as a thin wrapper means credit-daily-rewards can still be
 * triggered manually from AdminRewardJobs without duplication.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const db = createClient(supabaseUrl, serviceKey);
  const runDate = new Date().toISOString().slice(0, 10);

  console.log(JSON.stringify({ level: "INFO", tag: "scheduler", msg: "Invoking credit-daily-rewards", runDate }));

  const { data, error } = await db.functions.invoke("credit-daily-rewards", {
    body: { run_date: runDate },
  });

  if (error) {
    console.error(JSON.stringify({ level: "ERROR", tag: "scheduler", msg: "Invocation failed", error: String(error) }));
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(JSON.stringify({ level: "INFO", tag: "scheduler", msg: "Invocation succeeded", result: data }));
  return new Response(
    JSON.stringify({ ok: true, runDate, result: data }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
