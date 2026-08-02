import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { RefreshCw, Mail, CheckCircle, XCircle, Clock, MousePointer, Eye, TrendingUp, AlertCircle } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DayStats { date: string; sent: number; delivered: number; failed: number; opened: number; }

export default function AdminEmailAnalytics() {
  const [range, setRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ sent: 0, delivered: 0, failed: 0, pending: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 });
  const [dailyData, setDailyData] = useState<DayStats[]>([]);
  const [providerStats, setProviderStats] = useState<{name:string;sent:number;delivered:number;failed:number}[]>([]);
  const [templateStats, setTemplateStats] = useState<{slug:string;sent:number;opened:number}[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - Number(range));

    const { data: logs } = await supabase
      .from("email_logs")
      .select("delivery_status,opened_at,clicked_at,sent_at,provider_name,template_slug")
      .gte("sent_at", since.toISOString());

    const rows = logs ?? [];
    const t = { sent: rows.length, delivered: 0, failed: 0, pending: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    rows.forEach(r => {
      if (r.delivery_status === 'delivered') t.delivered++;
      else if (r.delivery_status === 'failed') t.failed++;
      else if (r.delivery_status === 'pending') t.pending++;
      else if (r.delivery_status === 'bounced') t.bounced++;
      else if (r.delivery_status === 'complained') t.complained++;
      if (r.opened_at) t.opened++;
      if (r.clicked_at) t.clicked++;
    });
    setTotals(t);

    // Daily breakdown
    const days: Record<string, DayStats> = {};
    for (let i = Number(range) - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days[key] = { date: d.toLocaleDateString('en',{month:'short',day:'numeric'}), sent:0, delivered:0, failed:0, opened:0 };
    }
    rows.forEach(r => {
      const key = r.sent_at.slice(0,10);
      if (days[key]) {
        days[key].sent++;
        if (r.delivery_status==='delivered') days[key].delivered++;
        if (r.delivery_status==='failed') days[key].failed++;
        if (r.opened_at) days[key].opened++;
      }
    });
    setDailyData(Object.values(days));

    // Provider breakdown
    const pMap: Record<string,{sent:number;delivered:number;failed:number}> = {};
    rows.forEach(r => {
      const n = r.provider_name ?? 'Unknown';
      if (!pMap[n]) pMap[n] = { sent:0, delivered:0, failed:0 };
      pMap[n].sent++;
      if (r.delivery_status==='delivered') pMap[n].delivered++;
      if (r.delivery_status==='failed') pMap[n].failed++;
    });
    setProviderStats(Object.entries(pMap).map(([name,v])=>({name,...v})));

    // Template breakdown
    const tMap: Record<string,{sent:number;opened:number}> = {};
    rows.forEach(r => {
      const s = r.template_slug ?? 'custom';
      if (!tMap[s]) tMap[s] = { sent:0, opened:0 };
      tMap[s].sent++;
      if (r.opened_at) tMap[s].opened++;
    });
    setTemplateStats(Object.entries(tMap).map(([slug,v])=>({slug,...v})).sort((a,b)=>b.sent-a.sent).slice(0,10));

    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const deliveryRate = totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : "0.0";
  const openRate = totals.sent > 0 ? ((totals.opened / totals.sent) * 100).toFixed(1) : "0.0";
  const bounceRate = totals.sent > 0 ? ((totals.bounced / totals.sent) * 100).toFixed(1) : "0.0";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Analytics</h2>
            <p className="text-sm text-muted-foreground">Delivery performance and engagement metrics</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-8 text-xs w-32"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-20 bg-muted rounded-lg"/>) : [
            { label: "Emails Sent", val: totals.sent.toLocaleString(), icon: Mail, color: "text-foreground", sub: `${range}d period` },
            { label: "Delivered", val: totals.delivered.toLocaleString(), icon: CheckCircle, color: "text-success", sub: `${deliveryRate}% rate` },
            { label: "Failed", val: totals.failed.toLocaleString(), icon: XCircle, color: "text-destructive", sub: `${totals.sent>0?((totals.failed/totals.sent)*100).toFixed(1):'0.0'}% fail rate` },
            { label: "Pending", val: totals.pending.toLocaleString(), icon: Clock, color: "text-warning", sub: "in queue" },
            { label: "Opened", val: totals.opened.toLocaleString(), icon: Eye, color: "text-primary", sub: `${openRate}% open rate` },
            { label: "Clicked", val: totals.clicked.toLocaleString(), icon: MousePointer, color: "text-primary", sub: `${totals.sent>0?((totals.clicked/totals.sent)*100).toFixed(1):'0.0'}% CTR` },
            { label: "Bounced", val: totals.bounced.toLocaleString(), icon: AlertCircle, color: "text-destructive", sub: `${bounceRate}% bounce rate` },
            { label: "Complained", val: totals.complained.toLocaleString(), icon: AlertCircle, color: "text-warning", sub: "complaint rate" },
          ].map(k => (
            <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-center gap-1 mb-1.5"><k.icon className={`w-3.5 h-3.5 ${k.color}`}/><p className="text-xs text-muted-foreground">{k.label}</p></div>
              <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Daily volume chart */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary"/>Daily Email Volume</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div className="w-full min-w-0 overflow-hidden" style={{height:220}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{top:5,right:10,left:-10,bottom:0}}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--success,142 71% 45%))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--success,142 71% 45%))" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/>
                  <YAxis tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/>
                  <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:6,fontSize:12}}/>
                  <Legend layout="horizontal" wrapperStyle={{paddingTop:8,fontSize:12}}/>
                  <Area type="monotone" dataKey="sent" stroke="hsl(var(--primary))" fill="url(#colorSent)" strokeWidth={2} name="Sent"/>
                  <Area type="monotone" dataKey="delivered" stroke="hsl(142,71%,45%)" fill="url(#colorDelivered)" strokeWidth={2} name="Delivered"/>
                  <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" name="Failed"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Provider performance */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Provider Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {providerStats.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No provider data yet</div>
              ) : (
                <div className="w-full min-w-0 overflow-hidden" style={{height:180}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerStats} margin={{top:5,right:10,left:-10,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                      <XAxis dataKey="name" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
                      <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))"/>
                      <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:6,fontSize:11}}/>
                      <Legend layout="horizontal" wrapperStyle={{paddingTop:8,fontSize:11}}/>
                      <Bar dataKey="delivered" fill="hsl(142,71%,45%)" radius={[3,3,0,0]} name="Delivered"/>
                      <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[3,3,0,0]} name="Failed"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template performance table */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold">Top Templates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">Template</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">Sent</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">Opened</th>
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">Open Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateStats.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">No data yet</td></tr>
                    ) : templateStats.map(t=>(
                      <tr key={t.slug} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-foreground whitespace-nowrap">{t.slug}</td>
                        <td className="px-4 py-2.5 font-mono">{t.sent}</td>
                        <td className="px-4 py-2.5 font-mono text-primary">{t.opened}</td>
                        <td className="px-4 py-2.5 font-mono">{t.sent>0?((t.opened/t.sent)*100).toFixed(1):'0.0'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
