import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/db/supabase";

export interface MiningPoolOption {
  id: string;
  name: string;
  algorithm: string;
  fee: number;
  uptime: number;
  location: string;
  hashrate_eh: number;
  workers: number;
  is_active: boolean;
}

export interface MiningFarmOption {
  id: string;
  name: string;
  country: string;
  flag: string;
  capacity: number;
  capacity_unit: string;
  power_source: string;
  uptime: number;
  active_miners: number;
  online_miners: number;
  is_active: boolean;
}

export interface LiveStats {
  btcPrice: number;
  networkDifficulty: number;  // T
  networkHashrate: number;    // EH/s
  difficultyChange: number;   // %
  blockReward: number;
  lastUpdated: Date | null;
  loading: boolean;
}

const FALLBACK: LiveStats = {
  btcPrice: 97000,
  networkDifficulty: 120,
  networkHashrate: 850,
  difficultyChange: 0,
  blockReward: 3.125,
  lastUpdated: null,
  loading: true,
};

// 5-minute client-side cache
let _cache: { data: LiveStats; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function fetchLiveStats(): Promise<LiveStats> {
  if (_cache && Date.now() - _cache.ts < CACHE_MS) return _cache.data;

  try {
    const [priceRes, mempoolRes] = await Promise.allSettled([
      fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", { signal: AbortSignal.timeout(6000) }),
      fetch("https://mempool.space/api/v1/mining/hashrate/3d",  { signal: AbortSignal.timeout(6000) }),
    ]);

    let btcPrice = FALLBACK.btcPrice;
    if (priceRes.status === "fulfilled" && priceRes.value.ok) {
      const j = await priceRes.value.json();
      const p = parseFloat(j?.data?.amount);
      if (p > 0) btcPrice = p;
    }

    let networkDifficulty = FALLBACK.networkDifficulty;
    let networkHashrate   = FALLBACK.networkHashrate;
    let difficultyChange  = FALLBACK.difficultyChange;

    if (mempoolRes.status === "fulfilled" && mempoolRes.value.ok) {
      const m = await mempoolRes.value.json();
      const rawHashrate   = m.currentHashrate  as number;
      const rawDifficulty = m.currentDifficulty as number;
      if (rawHashrate   > 0) networkHashrate   = rawHashrate   / 1e18;
      if (rawDifficulty > 0) networkDifficulty = rawDifficulty / 1e12;

      // difficulty adjustment change %
      try {
        const adjRes = await fetch("https://mempool.space/api/v1/difficulty-adjustment", { signal: AbortSignal.timeout(5000) });
        if (adjRes.ok) {
          const adj = await adjRes.json();
          difficultyChange = Number((adj.difficultyChange as number ?? 0).toFixed(2));
        }
      } catch { /* ignore */ }
    }

    const result: LiveStats = {
      btcPrice,
      networkDifficulty: Number(networkDifficulty.toFixed(2)),
      networkHashrate:   Number(networkHashrate.toFixed(2)),
      difficultyChange,
      blockReward: 3.125,
      lastUpdated: new Date(),
      loading: false,
    };
    _cache = { data: result, ts: Date.now() };
    return result;
  } catch {
    return { ...FALLBACK, loading: false, lastUpdated: new Date() };
  }
}

// ── Daily BTC estimate formula (simplified Bitcoin mining calculation) ─────────
// Based on: reward = (hashrate_ths * 86400 * blockReward) / (difficulty * 2^32)
export function estimateDailyBtc(hashrateThs: number, difficulty: number, blockReward = 3.125): number {
  if (hashrateThs <= 0 || difficulty <= 0) return 0;
  const difficultyRaw = difficulty * 1e12; // T → raw
  const dailyBlocks   = 86400 / 600;       // ~144 blocks/day
  // Per-block reward for this hashrate: (hashrate / networkHashrate) * blockReward
  // networkHashrate (H/s) from difficulty: difficulty * 2^32 / 600
  const networkHashrateHs = difficultyRaw * 4294967296 / 600;
  const hashrateHs = hashrateThs * 1e12;   // TH/s → H/s
  const fraction = hashrateHs / networkHashrateHs;
  return fraction * dailyBlocks * blockReward;
}

export function useMiningStats() {
  const [stats, setStats]   = useState<LiveStats>(FALLBACK);
  const [pools, setPools]   = useState<MiningPoolOption[]>([]);
  const [farms, setFarms]   = useState<MiningFarmOption[]>([]);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    const data = await fetchLiveStats();
    setStats(data);
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    refresh();
    const id = setInterval(refresh, CACHE_MS);

    // Fetch pools + farms (relatively static, fetch once)
    supabase.from("mining_pools")
      .select("id,name,algorithm,fee,uptime,location,hashrate_eh,workers,is_active")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => { if (data) setPools(data as MiningPoolOption[]); });

    supabase.from("mining_farms")
      .select("id,name,country,flag,capacity,capacity_unit,power_source,uptime,active_miners,online_miners,is_active")
      .eq("is_active", true)
      .then(({ data }) => { if (data) setFarms(data as MiningFarmOption[]); });

    return () => clearInterval(id);
  }, [refresh]);

  return { stats, pools, farms, refresh };
}
