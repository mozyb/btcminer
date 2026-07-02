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
  btcPrice: 0,
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
    // Route through the btc-stats Edge Function — server-side, no CORS issues
    const { data, error } = await supabase.functions.invoke("btc-stats");
    if (error || !data?.btcPrice || isNaN(data.btcPrice) || data.btcPrice < 1000) {
      throw new Error(error?.message ?? "btc-stats: invalid response");
    }

    const result: LiveStats = {
      btcPrice:         data.btcPrice,
      networkDifficulty: Number((data.networkDifficulty ?? 120).toFixed(2)),
      networkHashrate:   Number((data.networkHashrate   ?? 850).toFixed(2)),
      difficultyChange:  data.difficultyChange ?? 0,
      blockReward:       data.blockReward      ?? 3.125,
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
