import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to_email: string;
  to_name?: string;
  subject: string;
  html_body: string;
  text_body?: string;
  template_slug?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: EmailPayload = await req.json();
    const { to_email, to_name, subject, html_body, text_body, template_slug, priority = 5, metadata = {} } = payload;

    if (!to_email || !subject || !html_body) {
      return new Response(JSON.stringify({ error: "to_email, subject, html_body are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active provider with highest priority (lowest number)
    const { data: provider } = await supabase
      .from("email_providers")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .limit(1)
      .single();

    // Queue the email
    const { data: queued, error: qErr } = await supabase
      .from("email_queue")
      .insert({
        to_email, to_name, subject, html_body, text_body,
        template_slug, priority, metadata,
        provider_id: provider?.id ?? null,
        status: "queued",
      })
      .select("id")
      .single();

    if (qErr) throw qErr;

    // Attempt immediate send via SMTP/API if provider is configured
    let deliveryStatus = "pending";
    let errorMessage: string | null = null;
    let messageId: string | null = null;

    if (provider) {
      try {
        if (["sendgrid"].includes(provider.provider_type) && provider.api_key) {
          const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${provider.api_key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: to_email, name: to_name }] }],
              from: { email: provider.from_email, name: provider.from_name },
              reply_to: provider.reply_to_email ? { email: provider.reply_to_email } : undefined,
              subject,
              content: [
                { type: "text/plain", value: text_body ?? subject },
                { type: "text/html", value: html_body },
              ],
            }),
          });
          if (sgRes.ok) {
            deliveryStatus = "delivered";
            messageId = sgRes.headers.get("X-Message-Id");
          } else {
            const err = await sgRes.text();
            errorMessage = `SendGrid: ${sgRes.status} ${err}`;
            deliveryStatus = "failed";
          }
        } else if (provider.provider_type === "resend" && provider.api_key) {
          const rRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${provider.api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${provider.from_name} <${provider.from_email}>`,
              to: [to_email], subject, html: html_body,
              text: text_body ?? undefined,
              reply_to: provider.reply_to_email ?? undefined,
            }),
          });
          const rData = await rRes.json();
          if (rRes.ok) { deliveryStatus = "delivered"; messageId = rData.id; }
          else { deliveryStatus = "failed"; errorMessage = `Resend: ${JSON.stringify(rData)}`; }
        } else {
          // Provider type not yet implemented for direct send — stays in queue
          deliveryStatus = "pending";
        }

        // Update provider daily send count
        await supabase
          .from("email_providers")
          .update({ sent_today: (provider.sent_today ?? 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", provider.id);

      } catch (sendErr) {
        deliveryStatus = "failed";
        errorMessage = String(sendErr);
      }
    }

    // Update queue status
    await supabase.from("email_queue").update({
      status: deliveryStatus === "delivered" ? "sent" : deliveryStatus === "failed" ? "failed" : "queued",
      processed_at: new Date().toISOString(),
      error_message: errorMessage,
    }).eq("id", queued.id);

    // Write to email_logs
    await supabase.from("email_logs").insert({
      queue_id: queued.id,
      to_email, to_name, subject, template_slug,
      provider_id: provider?.id ?? null,
      provider_name: provider?.name ?? null,
      delivery_status: deliveryStatus,
      error_message: errorMessage,
      message_id: messageId,
      metadata,
    });

    return new Response(JSON.stringify({ success: true, queue_id: queued.id, delivery_status: deliveryStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("email-send error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
