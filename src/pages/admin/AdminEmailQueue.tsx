import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  RefreshCw, Play, Pause, RotateCcw, Trash2, Search, Mail,
  Clock, CheckCircle, XCircle, AlertCircle, List, BarChart3,
} from "lucide-react";

interface QueueItem {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  template_slug: string | null;
  status: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  queued_at: string;
  processed_at: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-primary/10 text-primary border-primary/20",
  processing: "bg-warning/10 text-warning border-warning/20",
  sent: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  dead_letter: "bg-muted text-muted-foreground border-border",
};

export default function AdminEmailQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ queued: 0, processing: 0, sent: 0, failed: 0, dead_letter: 0 });
  const [paused, setPaused] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("email_queue").select("*").order("queued_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    if (search) q = q.ilike("to_email", `%${search}%`);
    const { data } = await q;
    const rows = data ?? [];
    setItems(rows);
    const s = { queued: 0, processing: 0, sent: 0, failed: 0, dead_letter: 0 };
    rows.forEach(r => { if (r.status in s) s[r.status as keyof typeof s]++; });
    setStats(s);

    // Fetch queue config to know paused state
    const { data: cfg } = await supabase.from("email_settings").select("value").eq("key","queue_config").single();
    if (cfg?.value) setPaused(!!(cfg.value as Record<string,unknown>).paused);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePause = async () => {
    const newPaused = !paused;
    const { data: cfg } = await supabase.from("email_settings").select("value").eq("key","queue_config").single();
    if (cfg) {
      await supabase.from("email_settings").update({ value: { ...(cfg.value as object), paused: newPaused }, updated_at: new Date().toISOString() }).eq("key","queue_config");
      setPaused(newPaused);
      toast.success(newPaused ? "Queue paused" : "Queue resumed");
    }
  };

  const retryItem = async (id: string) => {
    await supabase.from("email_queue").update({ status: "queued", retry_count: 0, error_message: null, next_retry_at: null }).eq("id", id);
    toast.success("Email re-queued for retry");
    fetchData();
  };

  const retrySelected = async () => {
    const ids = Array.from(selected);
    await supabase.from("email_queue").update({ status: "queued", retry_count: 0, error_message: null }).in("id", ids);
    toast.success(`${ids.length} emails re-queued`);
    setSelected(new Set());
    fetchData();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("email_queue").delete().eq("id", id);
    toast.success("Removed from queue");
    fetchData();
  };

  const deleteSelected = async () => {
    const ids = Array.from(selected);
    await supabase.from("email_queue").delete().in("id", ids);
    toast.success(`${ids.length} emails deleted`);
    setSelected(new Set());
    fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const total = Object.values(stats).reduce((a,b)=>a+b,0);
  const sentPct = total > 0 ? Math.round((stats.sent / total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Queue Monitor</h2>
            <p className="text-sm text-muted-foreground">{total} emails · Queue {paused ? "paused" : "running"}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchData}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
            <Button size="sm" className={`h-8 text-xs gap-1.5 ${paused ? "bg-success text-success-foreground hover:bg-success/90" : "bg-warning text-warning-foreground hover:bg-warning/90"}`} onClick={togglePause}>
              {paused ? <><Play className="w-3.5 h-3.5"/>Resume Queue</> : <><Pause className="w-3.5 h-3.5"/>Pause Queue</>}
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[
            { label: "Queued", val: stats.queued, color: "text-primary" },
            { label: "Processing", val: stats.processing, color: "text-warning" },
            { label: "Sent", val: stats.sent, color: "text-success" },
            { label: "Failed", val: stats.failed, color: "text-destructive" },
            { label: "Dead Letter", val: stats.dead_letter, color: "text-muted-foreground" },
          ].map(k => (
            <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Delivery rate */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Delivery Success Rate</p>
            <p className="text-sm font-mono font-bold text-success">{sentPct}%</p>
          </div>
          <Progress value={sentPct} className="h-2" />
        </div>

        {/* Filters & bulk actions */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
            <Input placeholder="Search by recipient email…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 h-8 text-xs"/>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-36 shrink-0"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="dead_letter">Dead Letter</SelectItem>
            </SelectContent>
          </Select>
          {selected.size > 0 && (
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-success border-success/30 hover:bg-success/10" onClick={retrySelected}><RotateCcw className="w-3 h-3"/>Retry {selected.size}</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={deleteSelected}><Trash2 className="w-3 h-3"/>Delete {selected.size}</Button>
            </div>
          )}
        </div>

        {/* Queue table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2.5 w-8"><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(items.map(i=>i.id)) : new Set())} checked={selected.size===items.length && items.length>0} className="rounded"/></th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Recipient</th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Subject</th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Template</th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Status</th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Retries</th>
                    <th className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Queued At</th>
                    <th className="px-3 py-2.5"/>
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({length:5}).map((_,i)=>(<tr key={i} className="border-b border-border">{Array.from({length:8}).map((__,j)=>(<td key={j} className="px-3 py-3"><Skeleton className="h-3 w-20 bg-muted"/></td>))}</tr>))
                  : items.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-sm text-muted-foreground">No emails found</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5"><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggleSelect(item.id)} className="rounded"/></td>
                      <td className="px-3 py-2.5"><p className="font-medium text-foreground whitespace-nowrap">{item.to_email}</p>{item.to_name&&<p className="text-muted-foreground">{item.to_name}</p>}</td>
                      <td className="px-3 py-2.5 max-w-[200px]"><p className="truncate text-foreground">{item.subject}</p></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{item.template_slug ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><Badge className={`text-xs ${STATUS_STYLES[item.status] ?? 'bg-muted'}`}>{item.status}</Badge></td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">{item.retry_count}/{item.max_retries}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(item.queued_at).toLocaleString()}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex gap-1">
                          {['failed','dead_letter','queued'].includes(item.status) && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-success border-success/30 hover:bg-success/10" onClick={()=>retryItem(item.id)}><RotateCcw className="w-3 h-3"/></Button>
                          )}
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={()=>deleteItem(item.id)}><Trash2 className="w-3 h-3"/></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
