import { useState, useEffect, useCallback, useRef } from "react";

export interface BtcStats {
  btcPrice: number;
  priceChange24h: number;      // % change vs previous fetch
  networkHashrate: number;     // EH/s
  networkDifficulty: number;   // T
  difficultyChange: number;    // % change at next retarget
  blockReward: number;
  blockHeight: number;
  nextRetargetHeight: number;
  poolLuck: number;
  loading: boolean;
  lastUpdated: Date | null;
}

const FALLBACK: BtcStats = {
  btcPrice: 63000,
  priceChange24h: 0,
  networkHashrate: 850,    // ~850 EH/s realistic mid-2025
  networkDifficulty: 120,  // ~120T realistic mid-2025
  difficultyChange: 0,
  blockReward: 3.125,
  blockHeight: 850000,
  nextRetargetHeight: 851000,
  poolLuck: 98.4,
  loading: true,
  lastUpdated: null,
};

// Refresh every 30 seconds for live data
const REFRESH_INTERVAL_MS = 30_000;

/** Coinbase spot price — no API key, CORS-friendly, live */
async function fetchBtcPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coinbase.com/v2/prices/BTC-USD/spot",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`Coinbase HTTP ${res.status}`);
  const json = await res.json();
  const price = parseFloat(json?.data?.amount);
  if (!price || isNaN(price)) throw new Error("Coinbase: bad payload");
  return price;
}

interface ChainStats {
  hashrate: number;       // EH/s
  difficulty: number;     // T
  difficultyChange: number; // %
  blockHeight: number;
  nextRetargetHeight: number;
}

/** mempool.space — live hashrate + difficulty + block height, no API key */
async function fetchChainStatsMempoolSpace(): Promise<ChainStats> {
  const [hashrateRes, heightRes, diffRes] = await Promise.all([
    fetch("https://mempool.space/api/v1/mining/hashrate/3d",    { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/blocks/tip/height",         { signal: AbortSignal.timeout(7000) }),
    fetch("https://mempool.space/api/v1/difficulty-adjustment",  { signal: AbortSignal.timeout(7000) }),
  ]);

  if (!hashrateRes.ok) throw new Error(`mempool hashrate HTTP ${hashrateRes.status}`);
  if (!heightRes.ok)   throw new Error(`mempool height HTTP ${heightRes.status}`);
  if (!diffRes.ok)     throw new Error(`mempool difficulty HTTP ${diffRes.status}`);

  const hashrateData = await hashrateRes.json();
  const blockHeight  = parseInt(await heightRes.text(), 10);
  const diffData     = await diffRes.json();

  // currentHashrate H/s → EH/s; currentDifficulty raw → T
  const hashrateEH  = (hashrateData.currentHashrate as number) / 1e18;
  const difficultyT = (hashrateData.currentDifficulty as number) / 1e12;

  return {
    hashrate:           Number(hashrateEH.toFixed(2)),
    difficulty:         Number(difficultyT.toFixed(2)),
    difficultyChange:   Number(((diffData.difficultyChange as number) ?? 0).toFixed(2)),
    blockHeight,
    nextRetargetHeight: (diffData.nextRetargetHeight as number) ?? 0,
  };
}

/** blockchain.info/stats — fallback, CORS-friendly */
async function fetchChainStatsBlockchainInfo(): Promise<ChainStats> {
  const res = await fetch(
    "https://blockchain.info/stats?format=json",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error(`blockchain.info HTTP ${res.status}`);
  const d = await res.json();
  // difficulty raw → T
  const difficultyRaw = d.difficulty as number;
  const difficultyT   = difficultyRaw / 1e12;
  // Derive network hashrate from difficulty using Bitcoin's standard formula:
  //   hashrate (H/s) = difficulty × 2^32 / block_time_seconds (≈600)
  // This avoids blockchain.info's ambiguous hash_rate field units entirely.
  const hashrateHS = difficultyRaw * 4294967296 / 600;
  const hashrateEH = hashrateHS / 1e18; // H/s → EH/s
  const blockHeight = d.n_blocks_total as number;
  return {
    hashrate:           Number(hashrateEH.toFixed(2)),
    difficulty:         Number(difficultyT.toFixed(2)),
    difficultyChange:   0,
    blockHeight,
    nextRetargetHeight: 0,
  };
}

/** Try mempool.space first, fall back to blockchain.info */
async function fetchChainStats(): Promise<ChainStats> {
  try {
    return await fetchChainStatsMempoolSpace();
  } catch {
    return await fetchChainStatsBlockchainInfo();
  }
}

export function useBtcStats(): BtcStats {
  const [stats, setStats] = useState<BtcStats>(FALLBACK);
  const prevPriceRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    const [priceResult, chainResult] = await Promise.allSettled([
      fetchBtcPrice(),
      fetchChainStats(),
    ]);

    setStats(prev => {
      const newPrice = priceResult.status === "fulfilled" ? priceResult.value : prev.btcPrice;
      const oldPrice = prevPriceRef.current || newPrice;
      const priceChange24h = oldPrice > 0
        ? Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2))
        : prev.priceChange24h;

      if (priceResult.status === "fulfilled") {
        prevPriceRef.current = newPrice;
      }

      const chain = chainResult.status === "fulfilled" ? chainResult.value : null;

      return {
        ...prev,
        btcPrice:          newPrice,
        priceChange24h,
        networkHashrate:   chain ? chain.hashrate       : prev.networkHashrate,
        networkDifficulty: chain ? chain.difficulty      : prev.networkDifficulty,
        difficultyChange:  chain ? chain.difficultyChange: prev.difficultyChange,
        blockHeight:       chain ? chain.blockHeight     : prev.blockHeight,
        nextRetargetHeight:chain ? chain.nextRetargetHeight : prev.nextRetargetHeight,
        loading: false,
        lastUpdated: new Date(),
      };
    });
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return stats;
}
