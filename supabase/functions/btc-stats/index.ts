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

// ── Multi-Crypto Prices ───────────────────────────────────────────────────

interface CryptoPriceMap {
  BTC: number;
  ETH: number;
  LTC: number;
  DOGE: number;
  USDT: number;
  [key: string]: number;
}

const DEFAULT_PRICES: CryptoPriceMap = {
  BTC: 89000,
  ETH: 3100,
  LTC: 85,
  DOGE: 0.16,
  USDT: 1.0,
};

async function fetchPricesBinance(): Promise<CryptoPriceMap> {
  const symbols = ["BTCUSDT", "ETHUSDT", "LTCUSDT", "DOGEUSDT"];
  const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(symbols))}`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Binance multi-price HTTP ${res.status}`);
  const list = await res.json();
  const prices: CryptoPriceMap = { ...DEFAULT_PRICES };
  for (const item of list) {
    const val = parseFloat(item.price);
    if (val > 0) {
      if (item.symbol === "BTCUSDT") prices.BTC = val;
      if (item.symbol === "ETHUSDT") prices.ETH = val;
      if (item.symbol === "LTCUSDT") prices.LTC = val;
      if (item.symbol === "DOGEUSDT") prices.DOGE = val;
    }
  }
  return prices;
}

async function fetchPricesCoinGecko(): Promise<CryptoPriceMap> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,dogecoin&vs_currencies=usd",
    { signal: AbortSignal.timeout(6000), headers: { "Accept": "application/json" } }
  );
  if (!res.ok) throw new Error(`CoinGecko multi-price HTTP ${res.status}`);
  const j = await res.json();
  return {
    BTC: parseFloat(j?.bitcoin?.usd) || DEFAULT_PRICES.BTC,
    ETH: parseFloat(j?.ethereum?.usd) || DEFAULT_PRICES.ETH,
    LTC: parseFloat(j?.litecoin?.usd) || DEFAULT_PRICES.LTC,
    DOGE: parseFloat(j?.dogecoin?.usd) || DEFAULT_PRICES.DOGE,
    USDT: 1.0,
  };
}

async function fetchPricesCoinbase(): Promise<CryptoPriceMap> {
  const [btc, eth, ltc, doge] = await Promise.allSettled([
    fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
    fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
    fetch("https://api.coinbase.com/v2/prices/LTC-USD/spot", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
    fetch("https://api.coinbase.com/v2/prices/DOGE-USD/spot", { signal: AbortSignal.timeout(5000) }).then(r => r.json()),
  ]);

  const prices: CryptoPriceMap = { ...DEFAULT_PRICES };
  if (btc.status === "fulfilled" && btc.value?.data?.amount) prices.BTC = parseFloat(btc.value.data.amount);
  if (eth.status === "fulfilled" && eth.value?.data?.amount) prices.ETH = parseFloat(eth.value.data.amount);
  if (ltc.status === "fulfilled" && ltc.value?.data?.amount) prices.LTC = parseFloat(ltc.value.data.amount);
  if (doge.status === "fulfilled" && doge.value?.data?.amount) prices.DOGE = parseFloat(doge.value.data.amount);
  return prices;
}

async function fetchAllCryptoPrices(): Promise<CryptoPriceMap> {
  const [r1, r2, r3] = await Promise.allSettled([
    fetchPricesBinance(),
    fetchPricesCoinGecko(),
    fetchPricesCoinbase(),
  ]);

  if (r1.status === "fulfilled") return r1.value;
  if (r2.status === "fulfilled") return r2.value;
  if (r3.status === "fulfilled") return r3.value;
  return DEFAULT_PRICES;
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
    const [pricesResult, chainResult] = await Promise.allSettled([
      fetchAllCryptoPrices(),
      fetchChainStats(),
    ]);

    const prices = pricesResult.status === "fulfilled" ? pricesResult.value : DEFAULT_PRICES;
    const chain = chainResult.status === "fulfilled" ? chainResult.value : null;

    const payload = {
      btcPrice:           prices.BTC,
      ethPrice:           prices.ETH,
      ltcPrice:           prices.LTC,
      dogePrice:          prices.DOGE,
      prices:             prices,
      networkHashrate:    chain?.networkHashrate    ?? 850,
      networkDifficulty:  chain?.networkDifficulty  ?? 120,
      difficultyChange:   chain?.difficultyChange   ?? 0,
      blockReward:        3.125,
      blockHeight:        chain?.blockHeight        ?? 850000,
      nextRetargetHeight: chain?.nextRetargetHeight ?? 0,
      fetchedAt:          new Date().toISOString(),
    };

    console.log(JSON.stringify({ level: "INFO", tag: "btc-stats", msg: "OK", btcPrice: prices.BTC, ltcPrice: prices.LTC, ethPrice: prices.ETH }));

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
