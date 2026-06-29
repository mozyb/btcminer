import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getContracts, getWallets, getNotifications, type Contract, type Wallet, type DBNotification } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Zap, TrendingUp, Wallet as WalletIcon, Bell, ArrowRight, Activity, ShoppingBag, FileText, RefreshCw } from "lucide-react";

export default function DashboardOverview() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setDataLoading(true);
    Promise.all([
      getContracts(user.id),
      getWallets(user.id),
      getNotifications(user.id),
    ]).then(([c, w, n]) => {
      setContracts(c);
      setWallets(w);
      setNotifications(n);
    }).finally(() => setDataLoading(false));
  }, [user?.id]);

  const activeContracts = contracts.filter(c => c.status === "active");
  const totalHashrate = activeContracts.reduce((s, c) => s + c.hashrate, 0);
  const btcWallet = wallets.find(w => w.currency === "BTC");
  const btcBalance = btcWallet?.balance ?? 0;
  const totalUSD = wallets.reduce((s, w) => s + w.balance * (w.currency === "BTC" ? btc.btcPrice : 1), 0);
  const unread = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dataLoading ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-4"><Skeleton className="h-4 w-24 bg-muted mb-2" /><Skeleton className="h-7 w-20 bg-muted" /></CardContent></Card>
          )) : [
            { label: "Total Hashrate", value: totalHashrate > 0 ? `${totalHashrate} TH/s` : "—", icon: Zap, color: "text-primary" },
            { label: "Active Contracts", value: activeContracts.length.toString(), icon: Activity, color: "text-success" },
            { label: "BTC Balance", value: btcBalance > 0 ? `${btcBalance.toFixed(5)} ₿` : "0.00000 ₿", icon: WalletIcon, color: "text-primary" },
            { label: "Portfolio USD", value: `$${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-info" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-card border-border h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live BTC Stats Bar */}
        <div className="flex flex-wrap gap-4 p-3 bg-card border border-border rounded text-xs">
          {btc.loading ? (
            <div className="flex gap-4 flex-1 flex-wrap">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-28 bg-muted" />)}
            </div>
          ) : [
            { label: "BTC Price", val: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
            { label: "Network Hashrate", val: `${btc.networkHashrate} EH/s` },
            { label: "Network Difficulty", val: `${btc.networkDifficulty}T` },
            { label: "Block Reward", val: `${btc.blockReward} BTC` },
          ].map(s => (
            <div key={s.label}>
              <span className="text-muted-foreground">{s.label}: </span>
              <span className="font-mono font-bold text-foreground">{s.val}</span>
            </div>
          ))}
          <span className="flex items-center gap-1 text-success ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />LIVE
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Rewards chart or empty state */}
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily Mining Rewards (BTC)</CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <Skeleton className="h-[200px] w-full bg-muted" />
              ) : contracts.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No mining activity yet</p>
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs" asChild>
                    <Link to="/dashboard/marketplace"><ShoppingBag className="w-3 h-3" />Buy Hashrate</Link>
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={contracts.map(c => ({ date: c.start_date.slice(5), btc: c.rewards_generated }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v.toFixed(4)} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(v: number) => [v.toFixed(6) + " BTC", "Reward"]}
                    />
                    <Line type="monotone" dataKey="btc" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Active Contracts */}
          <Card className="bg-card border-border h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Active Contracts
                <Button variant="ghost" size="sm" className="text-xs text-primary h-6 px-2" asChild>
                  <Link to="/dashboard/contracts">View all</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {dataLoading ? (
                <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 bg-muted rounded" />)}</div>
              ) : activeContracts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 border border-dashed border-border rounded">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">No active contracts yet</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {activeContracts.slice(0, 3).map(c => {
                    const totalDays = Math.max(1, Math.ceil((new Date(c.expiry_date).getTime() - new Date(c.start_date).getTime()) / 86400000));
                    const daysLeft = Math.max(0, Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000));
                    const progress = Math.max(5, ((totalDays - daysLeft) / totalDays) * 100);
                    return (
                      <div key={c.id} className="border border-border rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-foreground truncate">{c.contract_name}</p>
                          <Badge className="bg-success/10 text-success border-success/20 text-[10px] shrink-0">Active</Badge>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="font-mono">{c.hashrate} {c.hashrate_unit}</span>
                          <span>{daysLeft}d left</span>
                        </div>
                        <div className="mt-1.5 bg-muted rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" size="sm" className="w-full gap-1 text-xs mt-3" asChild>
                <Link to="/dashboard/marketplace">Buy More Hashrate <ArrowRight className="w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions + Notifications */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: "Buy Hashrate", href: "/dashboard/marketplace", primary: true },
                { label: "Deposit Funds", href: "/dashboard/deposit", primary: false },
                { label: "Withdraw", href: "/dashboard/withdraw", primary: false },
                { label: "View Analytics", href: "/dashboard/analytics", primary: false },
              ].map(a => (
                <Button key={a.label} size="sm" className={`w-full text-xs h-9 ${a.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`} variant={a.primary ? "default" : "outline"} asChild>
                  <Link to={a.href}>{a.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  Recent Notifications
                  {unread > 0 && <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5">{unread}</Badge>}
                </span>
                <Button variant="ghost" size="sm" className="text-xs text-primary h-6 px-2" asChild>
                  <Link to="/dashboard/notifications">View all</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted rounded" />)}</div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map(n => (
                    <div key={n.id} className={`flex items-start gap-2 p-2 rounded text-xs ${!n.read ? "bg-primary/5 border border-primary/15" : ""}`}>
                      <Bell className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className={`font-medium truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        <p className="text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* First-time CTA if no contracts */}
        {!dataLoading && contracts.length === 0 && (
          <Card className="bg-card border border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Ready to start mining?</h3>
              <p className="text-sm text-muted-foreground mb-4">Purchase your first hashrate contract and start earning Bitcoin rewards daily.</p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                <Link to="/dashboard/marketplace"><ShoppingBag className="w-4 h-4" />Browse Hashrate Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
