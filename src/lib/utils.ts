import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Params = Partial<
  Record<keyof URLSearchParams, string | number | null | undefined>
>;

export function createQueryString(
  params: Params,
  searchParams: URLSearchParams
) {
  const newSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      newSearchParams.delete(key);
    } else {
      newSearchParams.set(key, String(value));
    }
  }

  return newSearchParams.toString();
}

export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: opts.month ?? "long",
    day: opts.day ?? "numeric",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(new Date(date));
}

/**
 * Formats cryptocurrency and fiat balances without truncating small satoshi values to 0.
 * For crypto like BTC, ETH, LTC, small values like 0.0001 BTC retain all significant decimals (up to 8).
 */
export function formatCryptoBalance(
  balance: number | string | null | undefined,
  currency?: string
): string {
  const num = Number(balance ?? 0);
  if (isNaN(num)) return "0.00";
  if (num === 0) return "0.00";

  const curr = currency?.toUpperCase() || "";
  const isHighPrecision = !curr || ["BTC", "ETH", "LTC", "BCH", "SOL", "DOGE", "SATS"].includes(curr);

  if (isHighPrecision) {
    if (Math.abs(num) < 0.001) {
      // Small satoshi balance like 0.0001 BTC: display up to 8 decimals
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8,
      });
    }
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }

  // Stablecoins / fiat like USDT, USDC, USD
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
