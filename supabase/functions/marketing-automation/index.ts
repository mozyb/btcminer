import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, key);
  const appUrl = Deno.env.get("APP_URL") ?? "https://btcminer.online";
  const supportEmail = Deno.env.get("SUPPORT_EMAIL") ?? "support@btcminer.online";

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /**/ }

  const action = body.action as string;

  // ── Helper: substitute template variables ────────────────────────────
  function renderTemplate(template: string, vars: Record<string, string | number | undefined>) {
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const v = vars[key];
      return v === undefined || v === null ? "" : String(v);
    });
  }

  // ── Helper: send via Resend ────────────────────────────────────────────
  async function sendEmail(to: string, subject: string, html: string, text?: string) {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return { ok: false, error: "RESEND_API_KEY not set" };
    const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `BTCMiner.online <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text: text ?? subject,
      }),
    });
    const data = await res.json();
    return res.ok ? { ok: true, id: data.id } : { ok: false, error: data.message };
  }

  // ── Helper: load template by slug, render, and send ──────────────────────
  async function sendTemplateEmail(to: string, slug: string, vars: Record<string, string | number | undefined>) {
    const { data: tpl } = await db.from("email_templates")
      .select("subject, html_body, text_body")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (!tpl) return { ok: false, error: `Template ${slug} not found` };
    const subject = renderTemplate(tpl.subject, vars);
    const html = renderTemplate(tpl.html_body, vars);
    const text = renderTemplate(tpl.text_body ?? "", vars);
    return sendEmail(to, subject, html, text);
  }

  // ── Helper: check email consent ────────────────────────────────────────
  async function isMarketingAllowed(userId: string): Promise<boolean> {
    const { data } = await db.from("email_consent").select("marketing_optin, unsubscribed_all").eq("user_id", userId).single();
    if (!data) return true;
    return !data.unsubscribed_all && data.marketing_optin;
  }

  // ── Helper: build common variables from profile ────────────────────────
  async function getProfileVars(userId: string) {
    const { data: profile } = await db.from("profiles")
      .select("email, first_name, last_name, username, email_verified")
      .eq("id", userId).single();
    const unsubscribeLink = `${appUrl}/unsubscribe?user_id=${encodeURIComponent(userId)}`;
    return {
      first_name: profile?.first_name ?? "",
      last_name: profile?.last_name ?? "",
      username: profile?.username ?? "",
      email: profile?.email ?? "",
      dashboard_link: `${appUrl}/dashboard`,
      support_email: supportEmail,
      unsubscribe_link: unsubscribeLink,
      company_name: "BTCMiner.online",
      current_date: new Date().toISOString().split("T")[0],
      verification_link: profile?.email_verified ? "" : `${appUrl}/verify-email`,
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  switch (action) {

    // ── Capture visitor lead ────────────────────────────────────────────
    case "capture_lead": {
      const { email, first_name, source = "popup", marketing_consent = true, variant } = body as {
        email: string; first_name?: string; source?: string; marketing_consent?: boolean; variant?: string;
      };
      if (!email) return json({ ok: false, error: "email required" }, 400);
      const normalizedEmail = email.toLowerCase().trim();
      const firstName = first_name ? first_name.trim() : null;

      // Upsert lead (prevent duplicates)
      const { data: lead, error } = await db.from("email_leads")
        .upsert({ email: normalizedEmail, first_name: firstName, source, opted_in: marketing_consent, opted_in_at: marketing_consent ? new Date().toISOString() : null }, { onConflict: "email", ignoreDuplicates: false })
        .select().single();
      if (error) return json({ ok: false, error: error.message }, 500);

      // Record consent preferences for non-logged-in leads
      await db.from("email_consent")
        .upsert({
          email: normalizedEmail,
          marketing_optin: marketing_consent,
          promotional_optin: marketing_consent,
          newsletter_optin: marketing_consent,
          product_updates_optin: marketing_consent,
          transactional: true,
          consent_source: source,
          unsubscribed_all: !marketing_consent,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email", ignoreDuplicates: false })
        .catch(() => {});

      // Record funnel event
      await db.from("funnel_events").insert({ event: "lead_captured", email: normalizedEmail, metadata: { source, marketing_consent, variant } });

      // Send welcome email using template
      const unsubscribeLink = `${appUrl}/unsubscribe?email=${encodeURIComponent(normalizedEmail)}`;
      sendTemplateEmail(normalizedEmail, "welcome_lead", {
        first_name: firstName ? firstName : "there",
        email: normalizedEmail,
        dashboard_link: `${appUrl}/register`,
        support_email: supportEmail,
        unsubscribe_link: unsubscribeLink,
        company_name: "BTCMiner.online",
      });

      return json({ ok: true, lead_id: lead.id });
    }

    // ── Convert captured lead to registered user ────────────────────────
    case "convert_lead": {
      const { user_id, email, source = "popup", variant } = body as { user_id: string; email: string; source?: string; variant?: string };
      if (!user_id || !email) return json({ ok: false, error: "user_id and email required" }, 400);
      const normalizedEmail = email.toLowerCase().trim();

      await db.from("email_leads")
        .update({ user_id, status: "converted", updated_at: new Date().toISOString() })
        .eq("email", normalizedEmail);

      await db.from("email_consent")
        .upsert({
          user_id,
          email: normalizedEmail,
          marketing_optin: true,
          promotional_optin: true,
          newsletter_optin: true,
          product_updates_optin: true,
          transactional: true,
          consent_source: source,
          unsubscribed_all: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id", ignoreDuplicates: false })
        .catch(() => {});

      await db.from("funnel_events").insert({ event: "registered", user_id, email: normalizedEmail, metadata: { source, variant } });

      return json({ ok: true });
    }

    // ── Enroll user in sequence ─────────────────────────────────────────
    case "enroll_sequence": {
      const { user_id, sequence_type } = body as { user_id: string; sequence_type: string };
      if (!user_id || !sequence_type) return json({ ok: false, error: "user_id and sequence_type required" }, 400);

      const { data: seq } = await db.from("automation_sequences")
        .select("id").eq("type", sequence_type).eq("is_active", true).single();
      if (!seq) return json({ ok: false, error: "Sequence not found or inactive" });

      await db.from("user_sequence_enrollments")
        .upsert({ user_id, sequence_id: seq.id, status: "active", next_step: 1, enrolled_at: new Date().toISOString() },
          { onConflict: "user_id,sequence_id" });

      return json({ ok: true });
    }

    // ── Stop a sequence for user ────────────────────────────────────────
    case "stop_sequence": {
      const { user_id, sequence_type } = body as { user_id: string; sequence_type: string };
      const { data: seq } = await db.from("automation_sequences")
        .select("id").eq("type", sequence_type).single();
      if (!seq) return json({ ok: true });

      await db.from("user_sequence_enrollments")
        .update({ status: "stopped", updated_at: new Date().toISOString() })
        .eq("user_id", user_id).eq("sequence_id", seq.id);

      return json({ ok: true });
    }

    // ── Process sequence step (called by cron) ──────────────────────────
    case "process_sequences": {
      const now = new Date();

      // Get all active enrollments with their next step due
      const { data: enrollments } = await db
        .from("user_sequence_enrollments")
        .select(`
          id, user_id, next_step, enrolled_at, updated_at,
          automation_sequences!inner(id, type, is_active)
        `)
        .eq("status", "active");

      if (!enrollments?.length) return json({ ok: true, processed: 0 });

      let processed = 0;
      for (const enrollment of enrollments) {
        const seq = enrollment.automation_sequences as { id: string; type: string };
        if (!seq) continue;

        // Get current step
        const { data: step } = await db.from("automation_sequence_steps")
          .select("*").eq("sequence_id", seq.id).eq("step_order", enrollment.next_step).single();
        if (!step) {
          // No more steps — complete
          await db.from("user_sequence_enrollments")
            .update({ status: "completed", updated_at: now.toISOString() }).eq("id", enrollment.id);
          continue;
        }

        // Check if step delay has elapsed since last update
        const lastUpdate = new Date(enrollment.updated_at ?? enrollment.enrolled_at);
        const hoursSinceLast = (now.getTime() - lastUpdate.getTime()) / 36e5;
        if (hoursSinceLast < step.delay_hours) continue;

        // Check stop condition based on sequence type
        const { data: profile } = await db.from("profiles")
          .select("email, first_name, email_verified").eq("id", enrollment.user_id).single();
        if (!profile) continue;

        let shouldStop = false;
        if (seq.type === "unverified_reminder" && profile.email_verified) shouldStop = true;
        if (seq.type === "no_deposit") {
          const { data: wallet } = await db.from("wallets")
            .select("balance").eq("user_id", enrollment.user_id).gt("balance", 0).limit(1).single();
          if (wallet) shouldStop = true;
        }
        if (seq.type === "no_contract") {
          const { count } = await db.from("contracts").select("*", { count: "exact", head: true })
            .eq("user_id", enrollment.user_id);
          if ((count ?? 0) > 0) shouldStop = true;
        }

        if (shouldStop) {
          await db.from("user_sequence_enrollments")
            .update({ status: "stopped", updated_at: now.toISOString() }).eq("id", enrollment.id);
          continue;
        }

        // Check marketing consent
        const allowed = await isMarketingAllowed(enrollment.user_id);
        if (!allowed) continue;

        // Build variables
        const vars = {
          first_name: profile.first_name ?? "",
          email: profile.email,
          dashboard_link: `${appUrl}/dashboard`,
          support_email: supportEmail,
          verification_link: `${appUrl}/verify-email`,
          unsubscribe_link: `${appUrl}/unsubscribe?user_id=${encodeURIComponent(enrollment.user_id)}`,
          current_date: new Date().toISOString().split("T")[0],
        };
        const subject = renderTemplate(step.subject, vars);
        const html = renderTemplate(step.body_html, vars);
        const text = renderTemplate(step.body_text ?? "", vars);

        // Send email
        const result = await sendEmail(profile.email, subject, html, text);
        if (result.ok) {
          await db.from("user_sequence_enrollments")
            .update({ next_step: enrollment.next_step + 1, updated_at: now.toISOString() })
            .eq("id", enrollment.id);
          processed++;
        }
      }

      return json({ ok: true, processed });
    }

    // ── Track abandoned purchase ────────────────────────────────────────
    case "track_abandonment": {
      const { user_id, email, contract_id, contract_name, contract_price_usd, hashrate_th, stage } = body as {
        user_id: string; email: string; contract_id: string; contract_name: string;
        contract_price_usd: number; hashrate_th: number; stage?: string;
      };
      if (!user_id || !contract_id) return json({ ok: false, error: "user_id and contract_id required" }, 400);

      await db.from("abandoned_purchases").upsert({
        user_id, email, contract_id, contract_name,
        contract_price_usd, hashrate_th,
        abandonment_stage: stage ?? "contract_selected",
        status: "abandoned",
        abandoned_at: new Date().toISOString(),
      }, { onConflict: "user_id,contract_id" });

      // Enroll in abandoned sequence
      const { data: seq } = await db.from("automation_sequences")
        .select("id").eq("type", "abandoned_purchase").eq("is_active", true).single();
      if (seq) {
        await db.from("user_sequence_enrollments").upsert({
          user_id, sequence_id: seq.id, status: "active", next_step: 1,
          enrolled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,sequence_id" });
      }

      return json({ ok: true });
    }

    // ── Mark purchase completed (clears abandoned) ──────────────────────
    case "purchase_completed": {
      const { user_id, contract_id } = body as { user_id: string; contract_id: string };
      await db.from("abandoned_purchases")
        .update({ status: "recovered", recovered_at: new Date().toISOString() })
        .eq("user_id", user_id).eq("contract_id", contract_id);

      // Stop abandoned purchase and no_contract sequences
      for (const t of ["abandoned_purchase", "no_contract"]) {
        const { data: seq } = await db.from("automation_sequences").select("id").eq("type", t).single();
        if (seq) await db.from("user_sequence_enrollments")
          .update({ status: "stopped", updated_at: new Date().toISOString() })
          .eq("user_id", user_id).eq("sequence_id", seq.id);
      }
      return json({ ok: true });
    }

    // ── Record contract purchase (funnel + recovery) ─────────────────────
    case "record_contract_purchase": {
      const { user_id, contract_id, promotion_id, discount_usd, final_price } = body as {
        user_id: string; contract_id: string; promotion_id?: string; discount_usd?: number; final_price?: number;
      };
      if (!user_id || !contract_id) return json({ ok: false, error: "user_id and contract_id required" }, 400);

      // Record funnel event
      await db.from("funnel_events").insert({
        event: "contract_purchased", user_id, metadata: { promotion_id: promotion_id ?? null, discount_usd: discount_usd ?? 0, final_price: final_price ?? 0 },
      });

      // Mark any abandoned purchase for this contract as recovered
      await db.from("abandoned_purchases")
        .update({ status: "recovered", recovered_at: new Date().toISOString() })
        .eq("user_id", user_id).eq("contract_id", contract_id);

      // Stop abandoned/no_contract sequences
      for (const t of ["abandoned_purchase", "no_contract"]) {
        const { data: seq } = await db.from("automation_sequences").select("id").eq("type", t).single();
        if (seq) await db.from("user_sequence_enrollments")
          .update({ status: "stopped", updated_at: new Date().toISOString() })
          .eq("user_id", user_id).eq("sequence_id", seq.id);
      }

      // Mark pending redemption as used
      if (promotion_id) {
        const { data: pending } = await db.from("promotion_redemptions")
          .select("id")
          .eq("promotion_id", promotion_id)
          .eq("user_id", user_id)
          .is("contract_id", null)
          .maybeSingle();
        if (pending) {
          await db.from("promotion_redemptions")
            .update({ contract_id, discount_usd: discount_usd ?? 0, redeemed_at: new Date().toISOString() })
            .eq("id", pending.id);
        } else {
          await db.from("promotion_redemptions")
            .insert({ promotion_id, user_id, contract_id, discount_usd: discount_usd ?? 0, redeemed_at: new Date().toISOString() });
        }
        await db.rpc("increment_promotion_redemption", { promo_id: promotion_id });
      }

      return json({ ok: true });
    }

    // ── Record funnel event ─────────────────────────────────────────────
    case "funnel_event": {
      const { event, user_id, email, metadata } = body as { event: string; user_id?: string; email?: string; metadata?: Record<string, unknown> };
      await db.from("funnel_events").insert({ event, user_id, email, metadata: metadata ?? {} });
      return json({ ok: true });
    }

    // ── Validate & get promotion at checkout ────────────────────────────
    case "validate_promotion": {
      const { coupon_code, user_id, contract_id, purchase_usd, contract_price } = body as {
        coupon_code: string; user_id: string; contract_id: string; purchase_usd?: number; contract_price?: number;
      };
      if (!coupon_code) return json({ ok: false, error: "coupon_code required" }, 400);
      const purchaseAmount = purchase_usd ?? contract_price ?? 0;
      const now = new Date().toISOString();

      const { data: promo } = await db.from("promotions")
        .select("*").eq("coupon_code", coupon_code.toUpperCase()).eq("is_active", true)
        .lte("start_date", now).single();

      if (!promo) return json({ ok: false, error: "Invalid or expired coupon code" });
      if (promo.end_date && promo.end_date < now) return json({ ok: false, error: "Promotion has expired" });
      if (promo.max_redemptions && promo.redemptions_count >= promo.max_redemptions)
        return json({ ok: false, error: "Promotion has reached its redemption limit" });
      if (purchaseAmount < (promo.min_purchase_usd ?? 0))
        return json({ ok: false, error: `Minimum purchase of $${promo.min_purchase_usd} required` });
      if (promo.applicable_contract_ids?.length && !promo.applicable_contract_ids.includes(contract_id))
        return json({ ok: false, error: "This coupon is not valid for the selected contract" });

      // Check per-user limit. For welcome discount, allow if there is a pending redemption.
      const { data: pendingRedemption } = await db.from("promotion_redemptions")
        .select("id, contract_id")
        .eq("promotion_id", promo.id)
        .eq("user_id", user_id)
        .is("contract_id", null)
        .maybeSingle();

      if (promo.max_per_user) {
        const { count } = await db.from("promotion_redemptions").select("*", { count: "exact", head: true })
          .eq("promotion_id", promo.id).eq("user_id", user_id);
        const usedCount = (count ?? 0) - (pendingRedemption ? 1 : 0);
        if (usedCount >= promo.max_per_user)
          return json({ ok: false, error: "You have already used this promotion" });
      }

      // Calculate discount
      let discount_usd = 0;
      if (promo.promo_type === "percentage" || promo.promo_type === "maintenance_discount") discount_usd = (purchaseAmount * (promo.discount_value ?? 0)) / 100;
      else if (promo.promo_type === "fixed") discount_usd = Math.min(promo.discount_value ?? 0, purchaseAmount);

      return json({ ok: true, promotion: promo, discount_usd: Math.round(discount_usd * 100) / 100, pending_redemption_id: pendingRedemption?.id ?? null });
    }

    // ── Auto-apply best promotion (including pending welcome redemptions) ───
    case "auto_apply_promotion": {
      const { user_id, contract_id, purchase_usd, contract_price } = body as {
        user_id: string; contract_id: string; purchase_usd?: number; contract_price?: number;
      };
      const purchaseAmount = purchase_usd ?? contract_price ?? 0;
      const now = new Date().toISOString();

      // First check if user has a pending redemption (e.g. welcome discount)
      const { data: pendingRedemption } = await db.from("promotion_redemptions")
        .select("id, promotion_id, promotion:promotion_id(*)")
        .eq("user_id", user_id)
        .is("contract_id", null)
        .maybeSingle();

      if (pendingRedemption && pendingRedemption.promotion) {
        const promo = pendingRedemption.promotion as Record<string, unknown>;
        if (promo.is_active && (!promo.end_date || new Date(promo.end_date as string) > new Date(now))) {
          if (purchaseAmount >= (promo.min_purchase_usd ?? 0) &&
              (!promo.applicable_contract_ids?.length || (promo.applicable_contract_ids as string[]).includes(contract_id))) {
            let discount_usd = 0;
            if (promo.promo_type === "percentage" || promo.promo_type === "maintenance_discount") discount_usd = (purchaseAmount * (promo.discount_value as number ?? 0)) / 100;
            else if (promo.promo_type === "fixed") discount_usd = Math.min(promo.discount_value as number ?? 0, purchaseAmount);
            return json({
              ok: true,
              promotion: promo,
              discount_usd: Math.round(discount_usd * 100) / 100,
              pending_redemption_id: pendingRedemption.id,
            });
          }
        }
      }

      // Otherwise, fall back to global auto-apply promotions
      const { data: promos } = await db.from("promotions")
        .select("*").eq("is_active", true).is("coupon_code", null)
        .lte("start_date", now);

      if (!promos?.length) return json({ ok: true, promotion: null, discount_usd: 0 });

      let bestPromo = null;
      let bestDiscount = 0;
      for (const promo of promos) {
        if (promo.end_date && promo.end_date < now) continue;
        if (promo.max_redemptions && promo.redemptions_count >= promo.max_redemptions) continue;
        if (purchaseAmount < (promo.min_purchase_usd ?? 0)) continue;
        if (promo.applicable_contract_ids?.length && !promo.applicable_contract_ids.includes(contract_id)) continue;

        let discount = 0;
        if (promo.promo_type === "percentage" || promo.promo_type === "maintenance_discount") discount = (purchaseAmount * (promo.discount_value ?? 0)) / 100;
        else if (promo.promo_type === "fixed") discount = Math.min(promo.discount_value ?? 0, purchaseAmount);

        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestPromo = promo;
        }
      }

      return json({ ok: true, promotion: bestPromo, discount_usd: Math.round(bestDiscount * 100) / 100 });
    }

    // ── Unsubscribe ─────────────────────────────────────────────────────
    case "unsubscribe": {
      const { email, user_id } = body as { email?: string; user_id?: string };
      if (email) {
        await db.from("email_leads").update({ status: "unsubscribed" }).eq("email", email.toLowerCase());
        await db.from("email_consent")
          .update({ unsubscribed_all: true, unsubscribed_at: new Date().toISOString() })
          .eq("email", email.toLowerCase());
      }
      if (user_id) {
        await db.from("email_consent")
          .update({ unsubscribed_all: true, unsubscribed_at: new Date().toISOString() })
          .eq("user_id", user_id);
      }
      return json({ ok: true });
    }

    default:
      return json({ ok: false, error: `Unknown action: ${action}` }, 400);
  }
});
