import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { Users, Mail, MousePointer, TrendingUp, BarChart2, ShoppingCart, Award, DollarSign, Gift, Filter } from "lucide-react";

interface FunnelRow { event: string; cnt: number; }
interface DailyCapture { day: string; captures: number; }
interface VariantPerf { name: string; impressions: number; captures: number; registrations: number; contracts: number; }
interface PopupFunnelRow { stage: string; users: number; }
interface DailyImpression { day: string; impressions: number; captures: number; }

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminMarketingAnalytics() {
  const [funnelData, setFunnelData] = useState<FunnelRow[]>([]);
  const [dailyCaptures, setDailyCaptures] = useState<DailyCapture[]>([]);
  const [popupStats, setPopupStats] = useState({ impressions: 0, captures: 0, dismissals: 0 });
  const [campaignPerf, setCampaignPerf] = useState<{ name: string; sent: number; opened: number; clicked: number }[]>([]);
  const [promoStats, setPromoStats] = useState({ redemptions: 0, active: 0, revenue: 0 });
  const [abandonStats, setAbandonStats] = useState({ abandoned: 0, recovered: 0 });
  const [variantPerf, setVariantPerf] = useState<VariantPerf[]>([]);
  const [popupFunnel, setPopupFunnel] = useState<PopupFunnelRow[]>([]);
  const [dailyImpressions, setDailyImpressions] = useState<DailyImpression[]>([]);

  const load = useCallback(async () => {
    const [
      { data: funnel },
      { data: popups },
      { data: campaigns },
      { data: promos },
      { data: abandoned },
    ] = await Promise.all([
      supabase.from("funnel_events").select("event,email,created_at,metadata"),
      supabase.from("popup_events").select("event_type,variant,email,created_at"),
      supabase.from("marketing_campaigns").select("name,total_sent,total_opened,total_clicked").neq("status", "archived").limit(8),
      supabase.from("promotions").select("is_active,redemptions_count"),
      supabase.from("abandoned_purchases").select("status,abandoned_at"),
    ]);

    // Funnel aggregation
    const funnelCounts: Record<string, number> = {};
    (funnel ?? []).forEach(f => { funnelCounts[f.event] = (funnelCounts[f.event] ?? 0) + 1; });
    const FUNNEL_LABELS = [
      { key: "lead_captured", label: "Email Lead" },
      { key: "registered", label: "Registered" },
      { key: "verified", label: "Verified" },
      { key: "deposited", label: "Deposited" },
      { key: "contract_purchased", label: "Contract" },
      { key: "repeat_purchase", label: "Repeat" },
    ];
    setFunnelData(FUNNEL_LABELS.map(fl => ({ event: fl.label, cnt: funnelCounts[fl.key] ?? 0 })));

    // Popup stats
    const ps = { impressions: 0, captures: 0, dismissals: 0 };
    (popups ?? []).forEach(e => {
      if (e.event_type === "impression") ps.impressions++;
      if (e.event_type === "email_captured") ps.captures++;
      if (e.event_type === "dismiss") ps.dismissals++;
    });
    setPopupStats(ps);

    // Popup funnel
    const leadEmails = new Set((funnel ?? []).filter(f => f.event === "lead_captured" && f.email).map(f => f.email));
    const popupFunnelData: PopupFunnelRow[] = [
      { stage: "Impression", users: ps.impressions },
      { stage: "Email Capture", users: ps.captures },
      { stage: "Registered", users: funnelCounts["registered"] ?? 0 },
      { stage: "Verified", users: funnelCounts["verified"] ?? 0 },
      { stage: "Deposited", users: funnelCounts["deposited"] ?? 0 },
      { stage: "Contract", users: funnelCounts["contract_purchased"] ?? 0 },
    ];
    setPopupFunnel(popupFunnelData);

    // Daily impressions/captures
    const dailyMap: Record<string, { impressions: number; captures: number }> = {};
    (popups ?? []).forEach(e => {
      if (!e.created_at) return;
      const day = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap[day] = dailyMap[day] || { impressions: 0, captures: 0 };
      if (e.event_type === "impression") dailyMap[day].impressions++;
      if (e.event_type === "email_captured") dailyMap[day].captures++;
    });
    setDailyImpressions(Object.entries(dailyMap).slice(-14).map(([day, v]) => ({ day, ...v })));

    // Daily captures — last 14 days
    const capturesByDay: Record<string, number> = {};
    (funnel ?? []).filter(f => f.event === "lead_captured").forEach(f => {
      const day = new Date((f as { created_at?: string }).created_at ?? "").toLocaleDateString("en-US", { month: "short", day: "numeric" });
      capturesByDay[day] = (capturesByDay[day] ?? 0) + 1;
    });
    setDailyCaptures(Object.entries(capturesByDay).slice(-14).map(([day, captures]) => ({ day, captures })));

    // Variant performance
    const variantMap: Record<string, VariantPerf> = {};
    (popups ?? []).forEach(e => {
      const v = e.variant || "control";
      variantMap[v] = variantMap[v] || { name: v, impressions: 0, captures: 0, registrations: 0, contracts: 0 };
      if (e.event_type === "impression") variantMap[v].impressions++;
      if (e.event_type === "email_captured") variantMap[v].captures++;
    });
    (funnel ?? []).forEach(f => {
      if (f.event === "registered" && f.email) {
        const popup = (popups ?? []).find(p => p.email === f.email);
        if (popup?.variant) {
          variantMap[popup.variant] = variantMap[popup.variant] || { name: popup.variant, impressions: 0, captures: 0, registrations: 0, contracts: 0 };
          variantMap[popup.variant].registrations++;
        }
      }
      if (f.event === "contract_purchased") {
        const popup = (popups ?? []).find(p => p.email === f.email);
        if (popup?.variant) {
          variantMap[popup.variant] = variantMap[popup.variant] || { name: popup.variant, impressions: 0, captures: 0, registrations: 0, contracts: 0 };
          variantMap[popup.variant].contracts++;
        }
      }
    });
    setVariantPerf(Object.values(variantMap));

    // Campaign performance
    setCampaignPerf((campaigns ?? []).map(c => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
      sent: c.total_sent, opened: c.total_opened, clicked: c.total_clicked,
    })));

    // Promo stats + revenue
    const pr = { redemptions: 0, active: 0, revenue: 0 };
    (promos ?? []).forEach(p => { pr.redemptions += p.redemptions_count; if (p.is_active) pr.active++; });
    (funnel ?? []).filter(f => f.event === "contract_purchased").forEach(f => {
      const final = typeof f.metadata === "object" && f.metadata !== null ? (f.metadata as { final_price?: number }).final_price : undefined;
      if (final) pr.revenue += Number(final);
    });
    setPromoStats(pr);

    // Abandon stats
    const ab = { abandoned: 0, recovered: 0 };
    (abandoned ?? []).forEach(a => { if (a.status === "abandoned") ab.abandoned++; if (a.status === "recovered") ab.recovered++; });
    setAbandonStats(ab);
  }, []);

  useEffect(() => { load(); }, [load]);

  const convRate = popupStats.impressions > 0 ? ((popupStats.captures / popupStats.impressions) * 100).toFixed(1) : "0";
  const recoveryRate = abandonStats.abandoned + abandonStats.recovered > 0
    ? ((abandonStats.recovered / (abandonStats.abandoned + abandonStats.recovered)) * 100).toFixed(1) : "0";
  const popupToContract = popupStats.captures > 0 ? ((popupFunnel[5]?.users ?? 0) / popupStats.captures * 100).toFixed(1) : "0";

  const pieData = [
    { name: "Captured", value: popupStats.captures },
    { name: "Dismissed", value: popupStats.dismissals },
    { name: "Ignored", value: Math.max(0, popupStats.impressions - popupStats.captures - popupStats.dismissals) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Marketing Analytics</h2>
          <p className="text-sm text-muted-foreground">Full funnel performance overview</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Popup Impressions", value: popupStats.impressions, icon: <MousePointer className="w-4 h-4 text-primary" /> },
            { label: "Email Captures", value: popupStats.captures, icon: <Mail className="w-4 h-4 text-green-500" /> },
            { label: "Popup Conv. Rate", value: convRate + "%", icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
            { label: "Capture → Contract", value: popupToContract + "%", icon: <Filter className="w-4 h-4 text-purple-500" /> },
            { label: "Offer Revenue", value: "$" + promoStats.revenue.toLocaleString(), icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
            { label: "Recovery Rate", value: recoveryRate + "%", icon: <Award className="w-4 h-4 text-amber-500" /> },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-muted/40 rounded-lg flex items-center justify-center shrink-0">{s.icon}</div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Funnel */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" /> Conversion Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="event" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="cnt" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popup funnel */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" /> Welcome Offer Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={popupFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="stage" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={90} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="users" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Popup pie */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-primary" /> Popup Engagement
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Campaign performance */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Campaign Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaignPerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={campaignPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="sent" name="Sent" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="opened" name="Opened" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="clicked" name="Clicked" fill={COLORS[2]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Variant performance */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> A/B Variant Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {variantPerf.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No variant data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={variantPerf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="impressions" name="Impressions" fill={COLORS[0]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="captures" name="Captures" fill={COLORS[1]} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="contracts" name="Contracts" fill={COLORS[2]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Daily impressions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-primary" /> Daily Popup Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyImpressions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No daily data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyImpressions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="impressions" name="Impressions" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="captures" name="Captures" stroke={COLORS[1]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Abandon stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" /> Abandoned Purchases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Abandoned", value: abandonStats.abandoned, color: "text-amber-500" },
                  { label: "Recovered", value: abandonStats.recovered, color: "text-green-500" },
                  { label: "Recovery Rate", value: recoveryRate + "%", color: "text-primary" },
                ].map(s => (
                  <div key={s.label} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{promoStats.active}</p>
                  <p className="text-xs text-muted-foreground">Active Promos</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{promoStats.redemptions}</p>
                  <p className="text-xs text-muted-foreground">Total Redemptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
