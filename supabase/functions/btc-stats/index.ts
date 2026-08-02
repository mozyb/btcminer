/**
 * btc-stats Edge Function
 * Fetches live BTC price + network stats server-side (no browser CORS issues).
 * Called by useBtcStats hook every 30s.
 *
 * Response: { btcPrice, priceChange24h, networkHashrate, networkDifficulty,
 *             difficultyChange, blockReward, blockHeight, nextRetargetHeight }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── BTC Price ─────────────────────────────────────────────────────────────

async function fetchPriceCoinbase(): Promise<number> {
  const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    signal: AbortSignal.timeout(6000),
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`Coinbase HTTP ${res.status}`);
  const j = await res.json();
  const p = parseFloat(j?.data?.amount);
  if (!p || isNaN(p) || p < 1000) throw new Error("Coinbase bad payload");
  return p;
}

async function fetchPriceBinance(): Promise<number> {
  const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
  const j = await res.json();
  const p = parseFloat(j?.price);
  if (!p || isNaN(p) || p < 1000) throw new Error("Binance bad payload");
  return p;
}

async function fetchPriceCoingecko(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    { signal: AbortSignal.timeout(6000), headers: { "Accept": "application/json" } }
  );
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const j = await res.json();
  const p = j?.bitcoin?.usd;
  if (!p || isNaN(p) || p < 1000) throw new Error("CoinGecko bad payload");
  return p;
}

async function fetchBtcPrice(): Promise<number> {
  // Try three sources in parallel — use the first successful one
  const [r1, r2, r3] = await Promise.allSettled([
    fetchPriceCoinbase(),
    fetchPriceBinance(),
    fetchPriceCoingecko(),
  ]);
  if (r1.status === "fulfilled") return r1.value;
  if (r2.status === "fulfilled") return r2.value;
  if (r3.status === "fulfilled") return r3.value;
  throw new Error(`All price sources failed: ${r1.reason} | ${r2.reason} | ${r3.reason}`);
}

// ── Chain Stats ──────────────────────────────────────────────────────────

interface ChainStats {
  networkHashrate: number;     // EH/s
  networkDifficulty: number;   // T
  difficultyChange: number;    // % at next retarget
  blockHeight: number;
  nextRetargetHeight: number;
}

async function fetchChainStatsMempoolSpace(): Promise<ChainStats> {
  const [hrRes, htRes, diffRes] = await Promise.all([
    fetch("https://mempool.space/api/v1/mining/hashrate/3d",   { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/blocks/tip/height",        { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/v1/difficulty-adjustment", { signal: AbortSignal.timeout(7000) }),
  ]);
  if (!hrRes.ok || !htRes.ok || !diffRes.ok)
    throw new Error(`mempool.space error ${hrRes.status}/${htRes.status}/${diffRes.status}`);

  const hrData   = await hrRes.json();
  const blockHeight = parseInt(await htRes.text(), 10);
  const diffData = await diffRes.json();

  return {
    networkHashrate:    Number(((hrData.currentHashrate as number) / 1e18).toFixed(2)),
    networkDifficulty:  Number(((hrData.currentDifficulty as number) / 1e12).toFixed(2)),
    difficultyChange:   Number(((diffData.difficultyChange as number) ?? 0).toFixed(2)),
    blockHeight,
    nextRetargetHeight: (diffData.nextRetargetHeight as number) ?? 0,
  };
}

async function fetchChainStatsBlockchainInfo(): Promise<ChainStats> {
  const res = await fetch("https://blockchain.info/stats?format=json", { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`blockchain.info HTTP ${res.status}`);
  const d = await res.json();
  const diffRaw = d.difficulty as number;
  const hashrateEH = (diffRaw * 4294967296) / 600 / 1e18;
  return {
    networkHashrate:    Number(hashrateEH.toFixed(2)),
    networkDifficulty:  Number((diffRaw / 1e12).toFixed(2)),
    difficultyChange:   0,
    blockHeight:        d.n_blocks_total as number,
    nextRetargetHeight: 0,
  };
}

async function fetchChainStats(): Promise<ChainStats> {
  try {
    return await fetchChainStatsMempoolSpace();
  } catch {
    return await fetchChainStatsBlockchainInfo();
  }
}

// ── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const [priceResult, chainResult] = await Promise.allSettled([
      fetchBtcPrice(),
      fetchChainStats(),
    ]);

    if (priceResult.status === "rejected") {
      console.error(JSON.stringify({ level: "ERROR", tag: "btc-stats", msg: "All price sources failed", error: String(priceResult.reason) }));
      return new Response(
        JSON.stringify({ error: "BTC price unavailable: " + String(priceResult.reason) }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const price = priceResult.value;
    const chain = chainResult.status === "fulfilled" ? chainResult.value : null;

    const payload = {
      btcPrice:           price,
      networkHashrate:    chain?.networkHashrate    ?? 850,
      networkDifficulty:  chain?.networkDifficulty  ?? 120,
      difficultyChange:   chain?.difficultyChange   ?? 0,
      blockReward:        3.125,
      blockHeight:        chain?.blockHeight        ?? 850000,
      nextRetargetHeight: chain?.nextRetargetHeight ?? 0,
      fetchedAt:          new Date().toISOString(),
    };

    console.log(JSON.stringify({ level: "INFO", tag: "btc-stats", msg: "OK", btcPrice: price, hashrate: payload.networkHashrate }));

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        // Cache for 25 seconds — clients refresh every 30s
        "Cache-Control": "public, max-age=25",
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ level: "ERROR", tag: "btc-stats", msg: String(err) }));
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
