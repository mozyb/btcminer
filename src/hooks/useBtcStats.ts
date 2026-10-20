import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/db/supabase";

export interface CryptoPriceMap {
  BTC: number;
  ETH: number;
  LTC: number;
  DOGE: number;
  USDT: number;
  USD?: number;
  USDC?: number;
  [key: string]: number | undefined;
}

export interface BtcStats {
  btcPrice: number;
  ethPrice: number;
  ltcPrice: number;
  dogePrice: number;
  prices: CryptoPriceMap;
  getPrice: (currency: string) => number;
  toUsd: (amount: number, currency: string) => number;
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

const DEFAULT_PRICES: CryptoPriceMap = {
  BTC: 89000,
  ETH: 3100,
  LTC: 85,
  DOGE: 0.16,
  USDT: 1.0,
  USD: 1.0,
  USDC: 1.0,
};

function resolveCryptoPrice(cur: string, prices: CryptoPriceMap, btcP?: number, ethP?: number, ltcP?: number, dogeP?: number): number {
  const upper = (cur || "").toUpperCase().trim();
  if (upper === "USDT" || upper === "USD" || upper === "USDC" || upper === "DAI" || upper === "BUSD" || upper === "$") {
    return 1.0;
  }
  if (upper === "BTC" || upper === "BITCOIN" || upper === "XBT" || upper === "SAT" || upper === "SATS" || upper === "₿") {
    return btcP || prices.BTC || DEFAULT_PRICES.BTC;
  }
  if (upper === "ETH" || upper === "ETHEREUM" || upper === "Ξ") {
    return ethP || prices.ETH || DEFAULT_PRICES.ETH;
  }
  if (upper === "LTC" || upper === "LITECOIN" || upper === "Ł") {
    return ltcP || prices.LTC || DEFAULT_PRICES.LTC;
  }
  if (upper === "DOGE" || upper === "DOGECOIN" || upper === "Ð") {
    return dogeP || prices.DOGE || DEFAULT_PRICES.DOGE;
  }
  return prices[upper] ?? DEFAULT_PRICES[upper] ?? 1.0;
}

const INITIAL: BtcStats = {
  btcPrice: DEFAULT_PRICES.BTC,
  ethPrice: DEFAULT_PRICES.ETH,
  ltcPrice: DEFAULT_PRICES.LTC,
  dogePrice: DEFAULT_PRICES.DOGE,
  prices: DEFAULT_PRICES,
  getPrice: (cur: string) => resolveCryptoPrice(cur, DEFAULT_PRICES, DEFAULT_PRICES.BTC, DEFAULT_PRICES.ETH, DEFAULT_PRICES.LTC, DEFAULT_PRICES.DOGE),
  toUsd: (amount: number, cur: string) => (Number(amount) || 0) * resolveCryptoPrice(cur, DEFAULT_PRICES, DEFAULT_PRICES.BTC, DEFAULT_PRICES.ETH, DEFAULT_PRICES.LTC, DEFAULT_PRICES.DOGE),
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

/** Client-side fallback to CoinGecko / Binance if Edge function fails */
async function fetchClientPrices(): Promise<CryptoPriceMap> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,dogecoin&vs_currencies=usd", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("CoinGecko error");
    const j = await res.json();
    return {
      BTC: parseFloat(j?.bitcoin?.usd) || DEFAULT_PRICES.BTC,
      ETH: parseFloat(j?.ethereum?.usd) || DEFAULT_PRICES.ETH,
      LTC: parseFloat(j?.litecoin?.usd) || DEFAULT_PRICES.LTC,
      DOGE: parseFloat(j?.dogecoin?.usd) || DEFAULT_PRICES.DOGE,
      USDT: 1.0,
    };
  } catch {
    return DEFAULT_PRICES;
  }
}

/** Fetch via Edge Function — server-side, no CORS, tries 3 price sources */
async function fetchFromEdgeFunction(): Promise<{
  btcPrice: number;
  ethPrice: number;
  ltcPrice: number;
  dogePrice: number;
  prices: CryptoPriceMap;
  networkHashrate: number;
  networkDifficulty: number;
  difficultyChange: number;
  blockReward: number;
  blockHeight: number;
  nextRetargetHeight: number;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("btc-stats");
    if (error || !data?.btcPrice) {
      throw new Error(error?.message || "Invalid edge function response");
    }

    const prices: CryptoPriceMap = {
      BTC: data.prices?.BTC || data.btcPrice || DEFAULT_PRICES.BTC,
      ETH: data.prices?.ETH || data.ethPrice || DEFAULT_PRICES.ETH,
      LTC: data.prices?.LTC || data.ltcPrice || DEFAULT_PRICES.LTC,
      DOGE: data.prices?.DOGE || data.dogePrice || DEFAULT_PRICES.DOGE,
      USDT: 1.0,
    };

    return {
      btcPrice:           prices.BTC,
      ethPrice:           prices.ETH,
      ltcPrice:           prices.LTC,
      dogePrice:          prices.DOGE,
      prices,
      networkHashrate:    data.networkHashrate    ?? 850,
      networkDifficulty:  data.networkDifficulty  ?? 120,
      difficultyChange:   data.difficultyChange   ?? 0,
      blockReward:        data.blockReward        ?? 3.125,
      blockHeight:        data.blockHeight        ?? 850000,
      nextRetargetHeight: data.nextRetargetHeight ?? 0,
    };
  } catch {
    // Fallback directly to client fetch
    const fallbackPrices = await fetchClientPrices();
    return {
      btcPrice: fallbackPrices.BTC,
      ethPrice: fallbackPrices.ETH,
      ltcPrice: fallbackPrices.LTC,
      dogePrice: fallbackPrices.DOGE,
      prices: fallbackPrices,
      networkHashrate: 850,
      networkDifficulty: 120,
      difficultyChange: 0,
      blockReward: 3.125,
      blockHeight: 850000,
      nextRetargetHeight: 851000,
    };
  }
}

export function useBtcStats(): BtcStats {
  const [stats, setStats] = useState<BtcStats>(INITIAL);
  const prevPriceRef = useRef<number>(0);

  const getPrice = useCallback((cur: string): number => {
    return resolveCryptoPrice(cur, stats.prices, stats.btcPrice, stats.ethPrice, stats.ltcPrice, stats.dogePrice);
  }, [stats.prices, stats.btcPrice, stats.ethPrice, stats.ltcPrice, stats.dogePrice]);

  const toUsd = useCallback((amount: number, cur: string): number => {
    const p = getPrice(cur);
    return (Number(amount) || 0) * p;
  }, [getPrice]);

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
      console.warn("[useBtcStats] fetch failed:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    ...stats,
    getPrice,
    toUsd,
  };
}
