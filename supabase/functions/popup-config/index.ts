import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db  = createClient(url, key);

  // Return the active non-expired popup config
  const { data } = await db.from("popup_configs")
    .select("*")
    .eq("is_active", true)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return new Response(JSON.stringify({ ok: true, config: data ?? null }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
