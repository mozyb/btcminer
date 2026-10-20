import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { useBtcStats } from "@/hooks/useBtcStats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { Users, Zap, DollarSign, Activity, ArrowRight } from "lucide-react";

const tooltipStyle = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px" },
  labelStyle: { color: "hsl(var(--foreground))" },
};

interface AdminStats {
  totalUsers: number;
  activeContracts: number;
  totalDeposits: number;
  openTickets: number;
}
interface RecentUser { id: string; email: string; full_name: string | null; created_at: string; kyc_status: string | null; }
interface RecentTx { id: string; type: string; amount: number; currency: string; status: string; created_at: string; }

export default function AdminOverview() {
  const btc = useBtcStats();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, activeContracts: 0, totalDeposits: 0, openTickets: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTxs, setRecentTxs] = useState<RecentTx[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { count: userCount },
        { count: contractCount },
        { data: txData },
        { count: ticketCount },
        { data: usersData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("transactions").select("amount, usd_value").eq("type", "deposit"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("profiles").select("id, email, full_name, created_at, kyc_status").order("created_at", { ascending: false }).limit(5),
      ]);
      const totalDep = (txData ?? []).reduce((s, t) => s + (Number(t.usd_value) || Number(t.amount) || 0), 0);
      setStats({ totalUsers: userCount ?? 0, activeContracts: contractCount ?? 0, totalDeposits: totalDep, openTickets: ticketCount ?? 0 });
      setRecentUsers((usersData ?? []) as RecentUser[]);

      const { data: txRows } = await supabase
        .from("transactions")
        .select("id, type, amount, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentTxs((txRows ?? []) as RecentTx[]);
      setStatsLoading(false);
    })();
  }, []);
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", val: statsLoading ? "—" : stats.totalUsers.toLocaleString(), sub: "registered accounts", icon: Users, color: "text-primary" },
            { label: "Active Contracts", val: statsLoading ? "—" : stats.activeContracts.toLocaleString(), sub: "currently mining", icon: Zap, color: "text-success" },
            { label: "Total Deposits", val: statsLoading ? "—" : `$${(stats.totalDeposits / 1000).toFixed(1)}K`, sub: "lifetime USD", icon: DollarSign, color: "text-primary" },
            { label: "BTC Price", val: btc.loading ? "—" : `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sub: "live via Coinbase", icon: Activity, color: "text-success" },
          ].map(k => (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                </div>
                {statsLoading ? <Skeleton className="h-6 w-20 bg-muted mb-1" /> : <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Tickets", val: statsLoading ? "—" : stats.openTickets.toString(), color: "text-warning" },
            { label: "Network Hashrate", val: btc.loading ? "—" : `${btc.networkHashrate} EH/s`, color: "text-foreground" },
            { label: "Mining Difficulty", val: btc.loading ? "—" : `${btc.networkDifficulty}T`, color: "text-foreground" },
            { label: "Block Reward", val: btc.loading ? "—" : `${btc.blockReward} BTC`, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              {statsLoading && s.label === "Open Tickets"
                ? <Skeleton className="h-5 w-16 bg-muted" />
                : <p className={`text-lg font-bold font-mono ${s.color}`}>{s.val}</p>}
            </div>
          ))}
        </div>

        {/* Recent Users + Recent Transactions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Users
                <Link to="/admin/users" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-muted rounded" />)
              ) : recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No users yet</p>
              ) : recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge className={`text-xs shrink-0 ${u.kyc_status === "approved" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                    {u.kyc_status ?? "pending"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Transactions
                <Link to="/admin/deposits" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-muted rounded" />)
              ) : recentTxs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
              ) : recentTxs.map(tx => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm text-foreground">{Number(tx.amount).toFixed(6)} {tx.currency}</span>
                    <Badge className={`text-xs ${String(tx.status) === "approved" || String(tx.status) === "confirmed" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                      {String(tx.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
