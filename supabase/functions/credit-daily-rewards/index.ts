import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Structured logger ─────────────────────────────────────────────────────
function log(level: "INFO" | "WARN" | "ERROR", tag: string, msg: string, data?: unknown) {
  const entry = { level, tag, msg, ts: new Date().toISOString(), ...(data !== undefined ? { data } : {}) };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ── Network stats ─────────────────────────────────────────────────────────

interface ChainStats {
  btcPrice: number;
  networkHashrateEH: number;
  networkDifficultyT: number;
  blockReward: number;
}

async function fetchBtcPrice(): Promise<number> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Coinbase HTTP ${res.status}`);
  const j = await res.json();
  const p = parseFloat(j?.data?.amount);
  if (!p || isNaN(p)) throw new Error("Coinbase bad payload: " + JSON.stringify(j?.data));
  return p;
}

async function fetchChainStatsMempoolSpace(): Promise<{ hashrate: number; difficulty: number }> {
  const [hr, diff] = await Promise.all([
    fetch("https://mempool.space/api/v1/mining/hashrate/3d", { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/v1/difficulty-adjustment", { signal: AbortSignal.timeout(7000) }),
  ]);
  if (!hr.ok || !diff.ok) throw new Error(`mempool.space error: hashrate=${hr.status} diff=${diff.status}`);
  const hrData = await hr.json();
  return {
    hashrate: (hrData.currentHashrate as number) / 1e18,
    difficulty: (hrData.currentDifficulty as number) / 1e12,
  };
}

async function fetchChainStatsBlockchainInfo(): Promise<{ hashrate: number; difficulty: number }> {
  const res = await fetch("https://blockchain.info/stats?format=json", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`blockchain.info HTTP ${res.status}`);
  const d = await res.json();
  const diffRaw = d.difficulty as number;
  const hashrateEH = (diffRaw * 4294967296) / 600 / 1e18;
  return { hashrate: hashrateEH, difficulty: diffRaw / 1e12 };
}

async function fetchNetworkStats(): Promise<ChainStats> {
  log("INFO", "network", "Fetching BTC price and chain stats");
  const [priceResult, chainResult] = await Promise.allSettled([
    fetchBtcPrice(),
    (async () => {
      try {
        const r = await fetchChainStatsMempoolSpace();
        log("INFO", "network", "mempool.space chain stats OK", r);
        return r;
      } catch (e) {
        log("WARN", "network", "mempool.space failed, falling back to blockchain.info", String(e));
        return await fetchChainStatsBlockchainInfo();
      }
    })(),
  ]);

  if (priceResult.status === "rejected") {
    log("WARN", "network", "BTC price fetch failed, using fallback 63000", String(priceResult.reason));
  }
  if (chainResult.status === "rejected") {
    log("WARN", "network", "Chain stats fetch failed, using fallback values", String(chainResult.reason));
  }

  const btcPrice = priceResult.status === "fulfilled" ? priceResult.value : 63000;
  const chain = chainResult.status === "fulfilled"
    ? chainResult.value
    : { hashrate: 850, difficulty: 120 };

  log("INFO", "network", "Final stats", { btcPrice, ...chain });
  return {
    btcPrice,
    networkHashrateEH: chain.hashrate,
    networkDifficultyT: chain.difficulty,
    blockReward: 3.125,
  };
}

// ── Reward calculation ────────────────────────────────────────────────────
function calcDailyRewardBTC(
  contractHashrateTH: number,
  networkHashrateEH: number,
  btcPrice: number,
  blockReward = 3.125,
  maintenanceRateUSD = 0.0028
): number {
  const networkTH = networkHashrateEH * 1e6;
  if (networkTH <= 0) return 0;
  const dailyBlocks = 144;
  const grossBTC = (contractHashrateTH / networkTH) * dailyBlocks * blockReward;
  const maintenanceBTC = (maintenanceRateUSD * contractHashrateTH) / btcPrice;
  return Math.max(0, grossBTC - maintenanceBTC);
}

// ── Digest email helper ───────────────────────────────────────────────────
async function sendDigestEmail(params: {
  userEmail: string;
  firstName: string;
  btcAmount: number;
  usdValue: number;
  btcPrice: number;
  networkHashrate: number;
  contractCount: number;
  runDate: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    log("WARN", "email", "RESEND_API_KEY not set — skipping digest email for " + params.userEmail);
    return;
  }
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";
  const appUrl    = Deno.env.get("APP_URL") ?? "https://btcminer.online";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;">
      <tr><td style="background:#f7931a;padding:20px 28px;">
        <p style="margin:0;color:#000;font-size:18px;font-weight:700;">⛏️ Daily Mining Reward</p>
        <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">${params.runDate}</p>
      </td></tr>
      <tr><td style="padding:24px 28px 0;color:#d1d5db;font-size:15px;">
        <p style="margin:0;">Hi <strong style="color:#f7931a;">${params.firstName}</strong>,</p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your daily mining reward has been credited to your BTC wallet.</p>
      </td></tr>
      <tr><td style="padding:20px 28px;" align="center">
        <div style="background:#1f2937;border:1px solid #374151;border-radius:12px;padding:24px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Credited</p>
          <p style="margin:8px 0 4px;color:#f7931a;font-size:32px;font-weight:700;font-family:monospace;">${params.btcAmount.toFixed(8)} BTC</p>
          <p style="margin:0;color:#4b5563;font-size:14px;font-family:monospace;">≈ $${params.usdValue.toFixed(2)} USD</p>
        </div>
      </td></tr>
      <tr><td style="padding:0 28px 28px;" align="center">
        <a href="${appUrl}/dashboard/wallet" style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:8px;">View My Wallet →</a>
      </td></tr>
      <tr><td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;text-align:center;">
        <p style="margin:0;color:#374151;font-size:12px;">© ${new Date().getFullYear()} BTCMiner.online</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      from:    `BTCMiner.online <${fromEmail}>`,
      to:      params.userEmail,
      subject: `⛏️ ${params.btcAmount.toFixed(8)} BTC mined — Your daily reward for ${params.runDate}`,
      html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    log("ERROR", "email", `Resend error for ${params.userEmail}`, { status: res.status, body: txt });
  } else {
    log("INFO", "email", `Digest email sent to ${params.userEmail}`);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Validate required environment variables upfront for clear error messages
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    const missing = [!supabaseUrl && "SUPABASE_URL", !serviceKey && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ");
    log("ERROR", "init", "Missing required env vars", { missing });
    return new Response(
      JSON.stringify({ success: false, error: `Missing environment variables: ${missing}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const db = createClient(supabaseUrl, serviceKey);

  let runDate: string;
  try {
    const body = await req.json().catch(() => ({}));
    runDate = body.run_date ?? new Date().toISOString().slice(0, 10);
  } catch {
    runDate = new Date().toISOString().slice(0, 10);
  }

  log("INFO", "job", "Starting daily reward job", { runDate });

  // ── Idempotency: skip if already completed today ──────────────────────
  const { data: existingJob, error: jobLookupErr } = await db
    .from("daily_reward_jobs")
    .select("id, status")
    .eq("run_date", runDate)
    .maybeSingle();

  if (jobLookupErr) {
    log("ERROR", "job", "DB lookup for existing job failed", jobLookupErr.message);
    return new Response(
      JSON.stringify({ success: false, error: "DB error checking job: " + jobLookupErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (existingJob?.status === "completed") {
    log("INFO", "job", "Already completed for " + runDate);
    return new Response(
      JSON.stringify({ success: true, message: "Already completed for " + runDate, job_id: existingJob.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create or reset job to 'running'
  let jobId: string;
  if (existingJob) {
    jobId = existingJob.id;
    await db.from("daily_reward_jobs")
      .update({ status: "running", started_at: new Date().toISOString(), error_message: null })
      .eq("id", jobId);
  } else {
    const { data: newJob, error: createErr } = await db
      .from("daily_reward_jobs")
      .insert({ run_date: runDate, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (createErr) {
      log("ERROR", "job", "Failed to create job row", createErr.message);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create job record: " + createErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    jobId = newJob.id;
  }
  log("INFO", "job", "Job row ready", { jobId, runDate });

  try {
    // ── Fetch live network stats ─────────────────────────────────────────
    const stats = await fetchNetworkStats();

    // ── Load all active contracts ────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const { data: contracts, error: contractsErr } = await db
      .from("contracts")
      .select("id, user_id, hashrate, hashrate_unit, maintenance_fee_rate")
      .eq("status", "active")
      .lte("start_date", today)
      .gte("expiry_date", today);

    if (contractsErr) throw new Error("Fetch contracts failed: " + contractsErr.message);

    log("INFO", "contracts", "Loaded active contracts", { count: contracts?.length ?? 0 });

    if (!contracts || contracts.length === 0) {
      await db.from("daily_reward_jobs").update({
        status: "completed",
        btc_price: stats.btcPrice,
        network_hashrate: stats.networkHashrateEH,
        network_difficulty: stats.networkDifficultyT,
        block_reward: stats.blockReward,
        contracts_processed: 0,
        total_btc_credited: 0,
        completed_at: new Date().toISOString(),
      }).eq("id", jobId);

      return new Response(
        JSON.stringify({ success: true, processedUsers: 0, rewardsDistributed: 0, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Calculate rewards per contract ───────────────────────────────────
    let totalCredited = 0;
    let contractsProcessed = 0;
    const creditInserts: {
      job_id: string;
      user_id: string;
      contract_id: string;
      btc_amount: number;
      usd_value: number;
      network_hashrate: number;
    }[] = [];
    const userCredits = new Map<string, number>();

    for (const contract of contracts) {
      let hashrateTH = contract.hashrate as number;
      const unit = ((contract.hashrate_unit as string) ?? "TH/s").toUpperCase();
      if (unit === "PH/S") hashrateTH *= 1000;
      else if (unit === "GH/S") hashrateTH /= 1000;
      else if (unit === "EH/S") hashrateTH *= 1e6;

      const maintenanceRate = (contract.maintenance_fee_rate as number) ?? 0.0028;
      const btcAmount = calcDailyRewardBTC(
        hashrateTH,
        stats.networkHashrateEH,
        stats.btcPrice,
        stats.blockReward,
        maintenanceRate
      );

      if (btcAmount <= 0) {
        log("INFO", "reward", `Contract ${contract.id} yields 0 BTC — skipped`);
        continue;
      }

      const usdValue = btcAmount * stats.btcPrice;
      creditInserts.push({
        job_id: jobId,
        user_id: contract.user_id,
        contract_id: contract.id,
        btc_amount: btcAmount,
        usd_value: usdValue,
        network_hashrate: stats.networkHashrateEH,
      });

      userCredits.set(contract.user_id, (userCredits.get(contract.user_id) ?? 0) + btcAmount);
      totalCredited += btcAmount;
      contractsProcessed++;
    }

    log("INFO", "reward", "Calculated rewards", { contractsProcessed, totalCredited, uniqueUsers: userCredits.size });

    // ── Bulk insert reward_credits ───────────────────────────────────────
    if (creditInserts.length > 0) {
      const { error: insertErr } = await db.from("reward_credits").insert(creditInserts);
      if (insertErr) throw new Error("Insert reward_credits failed: " + insertErr.message);
      log("INFO", "db", `Inserted ${creditInserts.length} reward_credits rows`);
    }

    // ── Credit each user's BTC wallet via credit_mining_reward RPC ───────
    // Uses the new RPC which inserts a single 'mining_reward' transaction
    // (avoids double-transaction bug of calling admin_adjust_balance)
    let processedUsers = 0;
    for (const [userId, btcAmount] of userCredits) {
      const usdValue = btcAmount * stats.btcPrice;

      const { error: creditErr } = await db.rpc("credit_mining_reward", {
        p_user_id:   userId,
        p_currency:  "BTC",
        p_amount:    btcAmount,
        p_usd_value: usdValue,
        p_note:      `Daily mining reward ${runDate}`,
      });

      if (creditErr) {
        log("ERROR", "credit", `credit_mining_reward failed for user ${userId}`, creditErr.message);
        continue;
      }

      // Push in-app notification
      const { error: notifErr } = await db.from("notifications").insert({
        user_id: userId,
        title: "Mining Reward Credited",
        message: `${btcAmount.toFixed(8)} BTC ($${usdValue.toFixed(2)}) has been credited to your wallet for ${runDate}.`,
        type: "mining",
      });
      if (notifErr) log("WARN", "notif", `Notification insert failed for ${userId}`, notifErr.message);

      // Send digest email (non-blocking — failure must not abort job)
      const userContractCount = creditInserts.filter(c => c.user_id === userId).length;
      const { data: profile } = await db
        .from("profiles")
        .select("email, first_name, username")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.email) {
        sendDigestEmail({
          userEmail: profile.email,
          firstName: profile.first_name ?? profile.username ?? profile.email.split("@")[0],
          btcAmount,
          usdValue,
          btcPrice: stats.btcPrice,
          networkHashrate: stats.networkHashrateEH,
          contractCount: userContractCount,
          runDate,
        }).catch(e => log("ERROR", "email", `Digest email failed for ${userId}`, String(e)));
      }

      processedUsers++;
      log("INFO", "credit", `Credited ${btcAmount.toFixed(8)} BTC to user ${userId}`);
    }

    // ── Update contracts.rewards_generated ──────────────────────────────
    for (const credit of creditInserts) {
      const { error: incrErr } = await db.rpc("increment_contract_reward", {
        p_contract_id: credit.contract_id,
        p_amount: credit.btc_amount,
      });
      if (incrErr) log("WARN", "contract", `increment_contract_reward failed for ${credit.contract_id}`, incrErr.message);
    }

    // ── Mark job complete ────────────────────────────────────────────────
    await db.from("daily_reward_jobs").update({
      status: "completed",
      btc_price: stats.btcPrice,
      network_hashrate: stats.networkHashrateEH,
      network_difficulty: stats.networkDifficultyT,
      block_reward: stats.blockReward,
      contracts_processed: contractsProcessed,
      total_btc_credited: totalCredited,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    log("INFO", "job", "Job completed successfully", { jobId, processedUsers, contractsProcessed, totalCredited });

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers,
        rewardsDistributed: totalCredited,
        timestamp: new Date().toISOString(),
        // Additional context for admin UI
        job_id: jobId,
        run_date: runDate,
        contracts_processed: contractsProcessed,
        btc_price: stats.btcPrice,
        network_hashrate_eh: stats.networkHashrateEH,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    log("ERROR", "job", "Job failed with exception", { msg, stack, jobId, runDate });

    await db.from("daily_reward_jobs").update({
      status: "failed",
      error_message: msg,
      completed_at: new Date().toISOString(),
    }).eq("id", jobId);

    return new Response(
      JSON.stringify({
        success: false,
        error: msg,
        timestamp: new Date().toISOString(),
        job_id: jobId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Network stats ─────────────────────────────────────────────────────────

interface ChainStats {
  btcPrice: number;
  networkHashrateEH: number;
  networkDifficultyT: number;
  blockReward: number;
}

async function fetchBtcPrice(): Promise<number> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Coinbase ${res.status}`);
  const j = await res.json();
  const p = parseFloat(j?.data?.amount);
  if (!p || isNaN(p)) throw new Error("Coinbase bad payload");
  return p;
}

async function fetchChainStatsMempoolSpace(): Promise<{ hashrate: number; difficulty: number }> {
  const [hr, diff] = await Promise.all([
    fetch("https://mempool.space/api/v1/mining/hashrate/3d", { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/v1/difficulty-adjustment", { signal: AbortSignal.timeout(7000) }),
  ]);
  if (!hr.ok || !diff.ok) throw new Error("mempool.space error");
  const hrData = await hr.json();
  const diffData = await diff.json();
  return {
    hashrate: (hrData.currentHashrate as number) / 1e18,
    difficulty: (hrData.currentDifficulty as number) / 1e12,
  };
}

async function fetchChainStatsBlockchainInfo(): Promise<{ hashrate: number; difficulty: number }> {
  const res = await fetch("https://blockchain.info/stats?format=json", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`blockchain.info ${res.status}`);
  const d = await res.json();
  const diffRaw = d.difficulty as number;
  // Derive hashrate from difficulty: H/s = difficulty × 2^32 / 600
  const hashrateEH = (diffRaw * 4294967296) / 600 / 1e18;
  return {
    hashrate: hashrateEH,
    difficulty: diffRaw / 1e12,
  };
}

async function fetchNetworkStats(): Promise<ChainStats> {
  const [priceResult, chainResult] = await Promise.allSettled([
    fetchBtcPrice(),
    (async () => {
      try {
        return await fetchChainStatsMempoolSpace();
      } catch {
        return await fetchChainStatsBlockchainInfo();
      }
    })(),
  ]);

  const btcPrice = priceResult.status === "fulfilled" ? priceResult.value : 63000;
  const chain = chainResult.status === "fulfilled"
    ? chainResult.value
    : { hashrate: 850, difficulty: 120 };

  return {
    btcPrice,
    networkHashrateEH: chain.hashrate,
    networkDifficultyT: chain.difficulty,
    blockReward: 3.125,
  };
}

// ── Reward calculation ────────────────────────────────────────────────────
// Standard pool mining formula:
//   grossBTC/day = (contractTH / networkTH) × dailyBlocks × blockReward
//   netBTC/day   = grossBTC – maintenanceFee ($/TH/day → BTC)
function calcDailyRewardBTC(
  contractHashrateTH: number,
  networkHashrateEH: number,
  btcPrice: number,
  blockReward = 3.125,
  maintenanceRateUSD = 0.0028 // $/TH/day
): number {
  const networkTH = networkHashrateEH * 1e6; // EH/s → TH/s
  if (networkTH <= 0) return 0;
  const dailyBlocks = 144;
  const grossBTC = (contractHashrateTH / networkTH) * dailyBlocks * blockReward;
  const maintenanceBTC = (maintenanceRateUSD * contractHashrateTH) / btcPrice;
  return Math.max(0, grossBTC - maintenanceBTC);
}

// ── Digest email helper ───────────────────────────────────────────────────
async function sendDigestEmail(params: {
  userEmail: string;
  firstName: string;
  btcAmount: number;
  usdValue: number;
  btcPrice: number;
  networkHashrate: number;
  contractCount: number;
  runDate: string;
}) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return;
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "noreply@btcminer.online";
  const appUrl    = Deno.env.get("APP_URL") ?? "https://btcminer.online";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1f2937;max-width:560px;">
      <!-- Header -->
      <tr>
        <td style="background:#f7931a;padding:20px 28px;">
          <p style="margin:0;color:#000;font-size:18px;font-weight:700;">⛏️ Daily Mining Reward</p>
          <p style="margin:4px 0 0;color:#000;font-size:13px;opacity:0.7;">${params.runDate}</p>
        </td>
      </tr>
      <!-- Greeting -->
      <tr>
        <td style="padding:24px 28px 0;color:#d1d5db;font-size:15px;">
          <p style="margin:0;">Hi <strong style="color:#f7931a;">${params.firstName}</strong>,</p>
          <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your daily mining reward has been credited to your BTC wallet.</p>
        </td>
      </tr>
      <!-- Big number -->
      <tr>
        <td style="padding:20px 28px;" align="center">
          <div style="background:#1f2937;border:1px solid #374151;border-radius:12px;padding:24px;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total Credited</p>
            <p style="margin:8px 0 4px;color:#f7931a;font-size:32px;font-weight:700;font-family:monospace;">${params.btcAmount.toFixed(8)} BTC</p>
            <p style="margin:0;color:#4b5563;font-size:14px;font-family:monospace;">≈ $${params.usdValue.toFixed(2)} USD</p>
          </div>
        </td>
      </tr>
      <!-- Stats row -->
      <tr>
        <td style="padding:0 28px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${[
                ["BTC Price", `$${params.btcPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`],
                ["Network Hashrate", `${params.networkHashrate.toFixed(1)} EH/s`],
                ["Active Contracts", params.contractCount.toString()],
              ].map(([label, value]) => `
              <td style="width:33%;padding:8px;text-align:center;">
                <div style="background:#1f2937;border:1px solid #374151;border-radius:8px;padding:10px 8px;">
                  <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
                  <p style="margin:4px 0 0;color:#e2e8f0;font-size:13px;font-weight:600;font-family:monospace;">${value}</p>
                </div>
              </td>`).join("")}
            </tr>
          </table>
        </td>
      </tr>
      <!-- CTA -->
      <tr>
        <td style="padding:0 28px 28px;" align="center">
          <a href="${appUrl}/dashboard/wallet"
             style="display:inline-block;background:#f7931a;color:#000;font-weight:700;font-size:14px;text-decoration:none;padding:12px 32px;border-radius:8px;">
            View My Wallet →
          </a>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:16px 28px;background:#0f172a;border-top:1px solid #1f2937;text-align:center;">
          <p style="margin:0;color:#374151;font-size:12px;">
            © ${new Date().getFullYear()} BTCMiner.online ·
            <a href="${appUrl}/dashboard/transactions" style="color:#4b5563;text-decoration:none;">Transaction History</a> ·
            <a href="${appUrl}/dashboard/support" style="color:#4b5563;text-decoration:none;">Support</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body:    JSON.stringify({
      from:    `BTCMiner.online <${fromEmail}>`,
      to:      params.userEmail,
      subject: `⛏️ ${params.btcAmount.toFixed(8)} BTC mined — Your daily reward for ${params.runDate}`,
      html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("[digest-email] Resend error:", res.status, txt);
  } else {
    console.log("[digest-email] Sent to", params.userEmail);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Optional: verify caller is admin (for manual trigger from UI)
  // Cron trigger bypasses auth so we skip auth check for internal calls
  let runDate: string;
  try {
    const body = await req.json().catch(() => ({}));
    runDate = body.run_date ?? new Date().toISOString().slice(0, 10);
  } catch {
    runDate = new Date().toISOString().slice(0, 10);
  }

  // ── Idempotency: upsert job row, skip if already completed ───────────────
  const { data: existingJob } = await supabase
    .from("daily_reward_jobs")
    .select("id, status")
    .eq("run_date", runDate)
    .maybeSingle();

  if (existingJob?.status === "completed") {
    return new Response(
      JSON.stringify({ ok: true, message: "Already completed for " + runDate, job_id: existingJob.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create or update job to 'running'
  let jobId: string;
  if (existingJob) {
    jobId = existingJob.id;
    await supabase
      .from("daily_reward_jobs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", jobId);
  } else {
    const { data: newJob, error: createErr } = await supabase
      .from("daily_reward_jobs")
      .insert({ run_date: runDate, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (createErr) {
      return new Response(
        JSON.stringify({ ok: false, error: createErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    jobId = newJob.id;
  }

  try {
    // ── Fetch live network stats ───────────────────────────────────────────
    const stats = await fetchNetworkStats();

    // ── Load all active contracts ──────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    const { data: contracts, error: contractsErr } = await supabase
      .from("contracts")
      .select("id, user_id, hashrate, hashrate_unit, maintenance_fee_rate")
      .eq("status", "active")
      .lte("start_date", today)
      .gte("expiry_date", today);

    if (contractsErr) throw new Error("Fetch contracts: " + contractsErr.message);
    if (!contracts || contracts.length === 0) {
      await supabase
        .from("daily_reward_jobs")
        .update({
          status: "completed",
          btc_price: stats.btcPrice,
          network_hashrate: stats.networkHashrateEH,
          network_difficulty: stats.networkDifficultyT,
          block_reward: stats.blockReward,
          contracts_processed: 0,
          total_btc_credited: 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return new Response(
        JSON.stringify({ ok: true, message: "No active contracts", job_id: jobId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Process each contract ──────────────────────────────────────────────
    let totalCredited = 0;
    let contractsProcessed = 0;
    const creditInserts: {
      job_id: string;
      user_id: string;
      contract_id: string;
      btc_amount: number;
      usd_value: number;
      network_hashrate: number;
    }[] = [];

    // Group by user for wallet updates
    const userCredits = new Map<string, number>();

    for (const contract of contracts) {
      // Normalize hashrate to TH/s
      let hashrateTH = contract.hashrate as number;
      const unit = (contract.hashrate_unit as string ?? "TH/s").toUpperCase();
      if (unit === "PH/S") hashrateTH *= 1000;
      else if (unit === "GH/S") hashrateTH /= 1000;
      else if (unit === "EH/S") hashrateTH *= 1e6;

      const maintenanceRate = (contract.maintenance_fee_rate as number) ?? 0.0028;
      const btcAmount = calcDailyRewardBTC(
        hashrateTH,
        stats.networkHashrateEH,
        stats.btcPrice,
        stats.blockReward,
        maintenanceRate
      );

      if (btcAmount <= 0) continue;

      const usdValue = btcAmount * stats.btcPrice;
      creditInserts.push({
        job_id: jobId,
        user_id: contract.user_id,
        contract_id: contract.id,
        btc_amount: btcAmount,
        usd_value: usdValue,
        network_hashrate: stats.networkHashrateEH,
      });

      const prev = userCredits.get(contract.user_id) ?? 0;
      userCredits.set(contract.user_id, prev + btcAmount);
      totalCredited += btcAmount;
      contractsProcessed++;
    }

    // ── Bulk insert reward_credits ─────────────────────────────────────────
    if (creditInserts.length > 0) {
      const { error: insertErr } = await supabase
        .from("reward_credits")
        .insert(creditInserts);
      if (insertErr) throw new Error("Insert credits: " + insertErr.message);
    }

    // ── Credit each user's BTC wallet + insert mining transaction ─────────
    for (const [userId, btcAmount] of userCredits) {
      // Ensure BTC wallet exists and top up
      const { error: walletErr } = await supabase.rpc("admin_adjust_balance", {
        p_user_id: userId,
        p_currency: "BTC",
        p_amount: btcAmount,
        p_note: `Daily mining reward ${runDate}`,
      });
      if (walletErr) {
        console.error("Wallet credit failed for", userId, walletErr.message);
        continue;
      }

      // Insert a mining reward transaction record
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "mining_reward",
        amount: btcAmount,
        currency: "BTC",
        usd_value: btcAmount * stats.btcPrice,
        status: "confirmed",
        note: `Daily mining reward ${runDate}`,
      });

      // Push in-app notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Mining Reward Credited",
        message: `${btcAmount.toFixed(8)} BTC ($${(btcAmount * stats.btcPrice).toFixed(2)}) has been credited to your wallet for ${runDate}.`,
        type: "mining",
      });

      // Send digest email (non-blocking)
      const userContracts = creditInserts.filter(c => c.user_id === userId);
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, first_name, username")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.email) {
        sendDigestEmail({
          userEmail: profile.email,
          firstName: profile.first_name ?? profile.username ?? profile.email.split("@")[0],
          btcAmount,
          usdValue: btcAmount * stats.btcPrice,
          btcPrice: stats.btcPrice,
          networkHashrate: stats.networkHashrateEH,
          contractCount: userContracts.length,
          runDate,
        }).catch((e) => console.error("Digest email error for", userId, e));
      }
    }

    // ── Update contracts.rewards_generated ────────────────────────────────
    for (const credit of creditInserts) {
      await supabase.rpc("increment_contract_reward", {
        p_contract_id: credit.contract_id,
        p_amount: credit.btc_amount,
      });
    }

    // ── Mark job complete ──────────────────────────────────────────────────
    await supabase
      .from("daily_reward_jobs")
      .update({
        status: "completed",
        btc_price: stats.btcPrice,
        network_hashrate: stats.networkHashrateEH,
        network_difficulty: stats.networkDifficultyT,
        block_reward: stats.blockReward,
        contracts_processed: contractsProcessed,
        total_btc_credited: totalCredited,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({
        ok: true,
        job_id: jobId,
        run_date: runDate,
        contracts_processed: contractsProcessed,
        total_btc_credited: totalCredited,
        btc_price: stats.btcPrice,
        network_hashrate_eh: stats.networkHashrateEH,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("daily_reward_jobs")
      .update({
        status: "failed",
        error_message: msg,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({ ok: false, error: msg, job_id: jobId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
