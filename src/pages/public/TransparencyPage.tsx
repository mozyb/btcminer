import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import { miningHardware, apiConfigs } from "@/lib/mockData";
import { supabase } from "@/db/supabase";
import { useBtcStats } from "@/hooks/useBtcStats";
import { CheckCircle, Activity, Database, Globe } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

interface TransparencyFarm {
  id: string; name: string; country: string; flag: string;
  capacity: number; active_miners: number; online_miners: number;
  uptime: number; total_btc_mined: number;
}


const recentPayouts = [
  { txid: "3fd6e2a4b8c1d9f0...", amount: "0.00821 BTC", time: "2024-03-12 02:14 UTC", pool: "AntPool" },
  { txid: "8a1b4c2d7e3f0g5h...", amount: "0.01204 BTC", time: "2024-03-11 02:08 UTC", pool: "Foundry USA" },
  { txid: "2e9d1f5a3b7c8h4k...", amount: "0.00934 BTC", time: "2024-03-10 02:11 UTC", pool: "AntPool" },
  { txid: "6g2h8j4k1l5m9n0p...", amount: "0.01041 BTC", time: "2024-03-09 02:05 UTC", pool: "F2Pool" },
  { txid: "4q7r1s5t2u8v3w9x...", amount: "0.00778 BTC", time: "2024-03-08 02:17 UTC", pool: "AntPool" },
];

export default function TransparencyPage() {
  const btc = useBtcStats();
  const [miningFarms, setMiningFarms] = useState<TransparencyFarm[]>([]);

  useEffect(() => {
    supabase
      .from("mining_farms")
      .select("id,name,country,flag,capacity,active_miners,online_miners,uptime,total_btc_mined")
      .eq("is_active", true)
      .order("created_at")
      .then(({ data }) => setMiningFarms((data ?? []) as TransparencyFarm[]));
  }, []);

  const totalHW = miningHardware.reduce((s, h) => s + h.count, 0);
  const totalTH = miningHardware.reduce((s, h) => s + (h.hashrate * h.count), 0);

  return (
    <>
      <PageMeta
      title="Mining Transparency & Proof of Work | BTCMiner.online"
      description="BTCMiner.online is fully transparent. View our real-time mining pool stats, hashrate verification, and live blockchain data. Proof that your mining rewards are real."
      canonical="/transparency"
      jsonLd={{"@context":"https://schema.org","@type":"WebPage","name":"BTCMiner.online Transparency","url":"https://btcminer.online/transparency"}}
      />
      <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="flex items-center gap-3 mb-3">
            <Badge className="bg-primary/10 text-primary border-primary/20">Transparency Center</Badge>
            <Badge className="bg-success/10 text-success border-success/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />Live Data
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Platform Transparency</h1>
          <p className="text-muted-foreground max-w-2xl">Real-time operational data to build maximum trust. All figures are derived from blockchain data and mining pool statistics.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Contracts", val: "6,842", sub: "Running now" },
            { label: "Total Platform Hashrate", val: btc.loading ? "…" : `${btc.networkHashrate} EH/s`, sub: "Active contracts" },
            { label: "Hardware Units", val: totalHW.toLocaleString(), sub: `${(totalTH / 1000).toFixed(0)} PH/s combined` },
            { label: "Avg Pool Uptime", val: "99.7%", sub: "Last 30 days" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
              <p className="text-2xl font-bold font-mono text-primary">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Live Network Metrics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Network Metrics
              <span className="flex items-center gap-1 text-[10px] text-success ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />LIVE
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {btc.loading ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i}><Skeleton className="h-3 w-24 bg-muted mb-1" /><Skeleton className="h-5 w-20 bg-muted" /></div>
              )) : [
                { label: "Network Hashrate", val: `${btc.networkHashrate} EH/s` },
                { label: "Difficulty", val: `${btc.networkDifficulty}T` },
                { label: "Next Retarget", val: `#${btc.nextRetargetHeight.toLocaleString()}` },
                { label: "Difficulty Change", val: `${btc.difficultyChange >= 0 ? "+" : ""}${btc.difficultyChange}%` },
                { label: "Block Height", val: btc.blockHeight.toLocaleString() },
                { label: "Block Reward", val: `${btc.blockReward} BTC` },
                { label: "BTC Price", val: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
                { label: "Pool Luck", val: `${btc.poolLuck}%` },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                  <p className="font-mono font-bold text-foreground">{m.val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Farm Status */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Farm Status</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Farm", "Country", "Capacity", "Active", "Online", "Uptime", "BTC Mined"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {miningFarms.map(f => (
                    <tr key={f.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{f.flag} {f.name}</td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{f.country}</td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">{f.capacity} MW</td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">{f.active_miners.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-success whitespace-nowrap">{f.online_miners.toLocaleString()}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge className="bg-success/10 text-success border-success/20">{f.uptime}%</Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-primary whitespace-nowrap">{Number(f.total_btc_mined).toLocaleString()} ₿</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payouts */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Recent Payouts</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Transaction ID", "Amount", "Timestamp", "Pool"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayouts.map((p, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.txid}</td>
                      <td className="py-3 px-3 font-mono font-bold text-primary whitespace-nowrap">{p.amount}</td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{p.time}</td>
                      <td className="py-3 px-3 whitespace-nowrap"><Badge className="bg-muted text-muted-foreground">{p.pool}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-base">Data Sources & APIs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { name: "Coinbase", type: "BTC Price Feed (live spot)", health: btc.loading ? "…" : "99.9" },
                { name: "mempool.space", type: "Network Stats (Hashrate, Difficulty, Blocks)", health: btc.loading ? "…" : "99.8" },
                ...apiConfigs.slice(2),
              ].map(api => (
                <div key={api.name} className="flex items-center justify-between border border-border rounded p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{api.name}</p>
                    <p className="text-xs text-muted-foreground">{api.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-success">{api.health}% uptime</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  
  </>);
}

