import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useBtcStats } from "@/hooks/useBtcStats";
import { supabase } from "@/db/supabase";
import {
  Coins, TrendingUp, Calendar, RefreshCw,
  Zap, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface RewardCredit {
  id: string;
  job_id: string;
  contract_id: string;
  btc_amount: number;
  usd_value: number | null;
  created_at: string;
  daily_reward_jobs: {
    run_date: string;
    btc_price: number | null;
    network_hashrate: number | null;
  } | null;
  contracts: {
    contract_name: string;
    hashrate: number;
    hashrate_unit: string;
  } | null;
}

interface DailySummary {
  run_date: string;
  totalBtc: number;
  totalUsd: number;
  credits: RewardCredit[];
  btcPrice: number | null;
  networkHashrate: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function groupByDate(credits: RewardCredit[]): DailySummary[] {
  const map = new Map<string, DailySummary>();
  for (const c of credits) {
    const date = c.daily_reward_jobs?.run_date ?? c.created_at.slice(0, 10);
    if (!map.has(date)) {
      map.set(date, {
        run_date: date,
        totalBtc: 0,
        totalUsd: 0,
        credits: [],
        btcPrice: c.daily_reward_jobs?.btc_price ?? null,
        networkHashrate: c.daily_reward_jobs?.network_hashrate ?? null,
      });
    }
    const s = map.get(date)!;
    s.totalBtc += c.btc_amount;
    s.totalUsd += c.usd_value ?? 0;
    s.credits.push(c);
  }
  return Array.from(map.values()).sort((a, b) => b.run_date.localeCompare(a.run_date));
}

function fmt(n: number, decimals = 8) {
  return n.toFixed(decimals);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { user } = useAuth();
  const btc = useBtcStats();

  const [credits, setCredits] = useState<RewardCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reward_credits")
      .select(`
        id, job_id, contract_id, btc_amount, usd_value, created_at,
        daily_reward_jobs ( run_date, btc_price, network_hashrate ),
        contracts ( contract_name, hashrate, hashrate_unit )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) setCredits(data as unknown as RewardCredit[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const summaries = groupByDate(credits);
  const totalBtcAllTime = credits.reduce((s, c) => s + c.btc_amount, 0);
  const totalUsdAllTime = credits.reduce((s, c) => s + (c.usd_value ?? 0), 0);
  const liveBtcValueUSD = btc.loading ? null : totalBtcAllTime * btc.btcPrice;

  const toggleDay = (date: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">My Rewards</h2>
            <p className="text-sm text-muted-foreground">Daily mining reward history credited to your BTC wallet</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Coins,
              label: "Total BTC Earned",
              value: loading ? null : `${fmt(totalBtcAllTime)} BTC`,
              sub: loading ? null : (liveBtcValueUSD != null ? `≈ $${liveBtcValueUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })} at live price` : ""),
              color: "text-warning",
            },
            {
              icon: TrendingUp,
              label: "Total USD Value",
              value: loading ? null : `$${totalUsdAllTime.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
              sub: "At time of credit",
              color: "text-success",
            },
            {
              icon: Calendar,
              label: "Days Credited",
              value: loading ? null : `${summaries.length}`,
              sub: "Unique reward days",
              color: "text-primary",
            },
            {
              icon: Zap,
              label: "Contracts Active",
              value: loading ? null : `${new Set(credits.map(c => c.contract_id)).size}`,
              sub: "Earning contracts",
              color: "text-foreground",
            },
          ].map(card => (
            <Card key={card.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <card.icon className={`w-3.5 h-3.5 shrink-0 ${card.color}`} />
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
                {loading ? (
                  <Skeleton className="h-6 w-28 bg-muted" />
                ) : (
                  <>
                    <p className={`font-mono font-bold text-sm ${card.color}`}>{card.value}</p>
                    {card.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Daily history */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Daily Reward History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-muted rounded" />
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Coins className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground font-medium">No rewards yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rewards are credited daily at 00:05 UTC once you have an active contract.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {summaries.map(day => {
                  const isOpen = expanded.has(day.run_date);
                  return (
                    <div key={day.run_date}>
                      {/* Day row */}
                      <button
                        onClick={() => toggleDay(day.run_date)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            <p className="text-sm font-medium text-foreground">{day.run_date}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {day.credits.length} contract{day.credits.length !== 1 ? "s" : ""}
                              {day.btcPrice ? ` · BTC $${day.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="font-mono font-bold text-sm text-warning">{fmt(day.totalBtc)} BTC</p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              ≈ ${day.totalUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                            </p>
                          </div>
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] shrink-0">
                            Paid
                          </Badge>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                        </div>
                      </button>

                      {/* Expanded contract breakdown */}
                      {isOpen && (
                        <div className="bg-muted/20 border-t border-border px-4 py-3 space-y-2">
                          <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-max text-xs">
                              <thead>
                                <tr className="text-muted-foreground">
                                  <th className="text-left py-1.5 pr-6 whitespace-nowrap font-medium">Contract</th>
                                  <th className="text-left py-1.5 pr-6 whitespace-nowrap font-medium">Hashrate</th>
                                  <th className="text-right py-1.5 pr-6 whitespace-nowrap font-medium">BTC Earned</th>
                                  <th className="text-right py-1.5 whitespace-nowrap font-medium">USD Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {day.credits.map(c => (
                                  <tr key={c.id} className="text-foreground">
                                    <td className="py-1.5 pr-6 whitespace-nowrap">
                                      {c.contracts?.contract_name ?? "—"}
                                    </td>
                                    <td className="py-1.5 pr-6 font-mono whitespace-nowrap text-muted-foreground">
                                      {c.contracts ? `${c.contracts.hashrate} ${c.contracts.hashrate_unit}` : "—"}
                                    </td>
                                    <td className="py-1.5 pr-6 font-mono text-right text-warning whitespace-nowrap">
                                      {fmt(c.btc_amount)} BTC
                                    </td>
                                    <td className="py-1.5 font-mono text-right text-muted-foreground whitespace-nowrap">
                                      ${(c.usd_value ?? 0).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-border font-semibold">
                                  <td className="py-1.5 pr-6" colSpan={2}>Total</td>
                                  <td className="py-1.5 pr-6 font-mono text-right text-warning whitespace-nowrap">
                                    {fmt(day.totalBtc)} BTC
                                  </td>
                                  <td className="py-1.5 font-mono text-right text-muted-foreground whitespace-nowrap">
                                    ${day.totalUsd.toFixed(2)}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                          {day.networkHashrate && (
                            <p className="text-[10px] text-muted-foreground">
                              Network hashrate on this day: {day.networkHashrate.toFixed(1)} EH/s
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
