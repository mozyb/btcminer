import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layouts/AdminLayout";
import { adminStats, adminUsers, auditLogs, liveStats } from "@/lib/mockData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { Users, Zap, DollarSign, Activity, ArrowRight, AlertCircle } from "lucide-react";

const userGrowth = [
  { month: "Oct", users: 18200 },
  { month: "Nov", users: 20100 },
  { month: "Dec", users: 22400 },
  { month: "Jan", users: 24700 },
  { month: "Feb", users: 26900 },
  { month: "Mar", users: 28471 },
];
const revenueData = [
  { month: "Oct", revenue: 820000 },
  { month: "Nov", revenue: 940000 },
  { month: "Dec", revenue: 1080000 },
  { month: "Jan", revenue: 1120000 },
  { month: "Feb", revenue: 1210000 },
  { month: "Mar", revenue: 1284721 },
];

const tooltipStyle = {
  contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "4px" },
  labelStyle: { color: "hsl(var(--foreground))" },
};

export default function AdminOverview() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", val: adminStats.totalUsers.toLocaleString(), sub: `+${adminStats.newUsersToday} today`, icon: Users, color: "text-primary" },
            { label: "Active Contracts", val: adminStats.activeContracts.toLocaleString(), sub: "2.84 EH/s sold", icon: Zap, color: "text-success" },
            { label: "Mining Revenue", val: `$${(adminStats.miningRevenue / 1000).toFixed(0)}K`, sub: "lifetime", icon: DollarSign, color: "text-primary" },
            { label: "API Health", val: `${adminStats.apiHealth}%`, sub: "all providers", icon: Activity, color: "text-success" },
          ].map(k => (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{k.label}</p>
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                </div>
                <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Deposits", val: `$${(adminStats.totalDeposits / 1000000).toFixed(1)}M`, color: "text-success" },
            { label: "Total Withdrawals", val: `$${(adminStats.totalWithdrawals / 1000000).toFixed(1)}M`, color: "text-destructive" },
            { label: "Open Tickets", val: adminStats.openTickets.toString(), color: "text-warning" },
            { label: "BTC Price", val: `$${liveStats.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Growth */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">User Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v.toLocaleString(), "Users"]} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Revenue (USD)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users + Audit */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Users
                <Link to="/admin/users" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {adminUsers.slice(0, 4).map(u => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · {u.country}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-xs ${u.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>{u.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Audit Activity
                <Link to="/admin/audit" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {auditLogs.slice(0, 4).map(log => (
                <div key={log.id} className="py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-xs font-mono font-medium text-primary truncate">{log.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{log.user} · {log.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
