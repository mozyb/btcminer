import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/db/supabase";

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

const INITIAL: BtcStats = {
  btcPrice: 0,
  priceChange24h: 0,
  networkHashrate: 850,
  networkDifficulty: 120,
  difficultyChange: 0,
  blockReward: 3.125,
  blockHeight: 850000,
  nextRetargetHeight: 851000,
  poolLuck: 98.4,
  loading: true,
  lastUpdated: null,
};

// Refresh every 30 seconds
const REFRESH_INTERVAL_MS = 30_000;

/** Fetch via Edge Function — server-side, no CORS, tries 3 price sources */
async function fetchFromEdgeFunction(): Promise<Omit<BtcStats, "priceChange24h" | "poolLuck" | "loading" | "lastUpdated">> {
  const { data, error } = await supabase.functions.invoke("btc-stats");
  if (error) throw new Error("btc-stats edge function error: " + error.message);
  if (!data?.btcPrice || isNaN(data.btcPrice) || data.btcPrice < 1000) {
    throw new Error("btc-stats returned invalid price: " + JSON.stringify(data));
  }
  return {
    btcPrice:           data.btcPrice,
    networkHashrate:    data.networkHashrate    ?? 850,
    networkDifficulty:  data.networkDifficulty  ?? 120,
    difficultyChange:   data.difficultyChange   ?? 0,
    blockReward:        data.blockReward        ?? 3.125,
    blockHeight:        data.blockHeight        ?? 850000,
    nextRetargetHeight: data.nextRetargetHeight ?? 0,
  };
}

export function useBtcStats(): BtcStats {
  const [stats, setStats] = useState<BtcStats>(INITIAL);
  const prevPriceRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchFromEdgeFunction();

      setStats(prev => {
        const oldPrice = prevPriceRef.current || fresh.btcPrice;
        const priceChange24h = oldPrice > 0
          ? Number((((fresh.btcPrice - oldPrice) / oldPrice) * 100).toFixed(2))
          : 0;
        prevPriceRef.current = fresh.btcPrice;

        return {
          ...prev,
          ...fresh,
          priceChange24h,
          loading: false,
          lastUpdated: new Date(),
        };
      });
    } catch (err) {
      // On failure keep the last known price; just clear loading flag
      console.warn("[useBtcStats] fetch failed:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return stats;
}
