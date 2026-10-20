import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as {
      action?: string;
      email?: string;
      first_name?: string;
      source?: string;
      marketing_consent?: boolean;
      popup_id?: string;
      variant?: string;
    };

    if (body.action !== "capture_lead") {
      return new Response(JSON.stringify({ error: "Unsupported action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const source = body.source?.trim() || "popup";
    const tags = source ? [source] : [];
    if (body.variant) tags.push(body.variant);

    const { error: upsertError } = await supabase.from("email_leads").upsert(
      {
        email,
        first_name: body.first_name?.trim() || null,
        source,
        status: "new",
        tags,
        opted_in: !!body.marketing_consent,
        opted_in_at: body.marketing_consent ? new Date().toISOString() : null,
      },
      { onConflict: "email" }
    );

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.popup_id) {
      await supabase.from("popup_events").insert({
        popup_id: body.popup_id,
        event_type: "email_captured",
        email,
        session_id: crypto.randomUUID(),
      });
    }

    return new Response(JSON.stringify({ success: true, email }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
