import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { RefreshCw, Search, Download, RotateCcw, Trash2, X, Eye, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EmailLog {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  template_slug: string | null;
  provider_name: string | null;
  delivery_status: string;
  error_message: string | null;
  retry_count: number;
  message_id: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  sent_at: string;
  metadata: Record<string, unknown>;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  delivered: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  bounced: "bg-destructive/10 text-destructive border-destructive/20",
  complained: "bg-warning/10 text-warning border-warning/20",
  opened: "bg-primary/10 text-primary border-primary/20",
  clicked: "bg-primary/10 text-primary border-primary/20",
};

export default function AdminEmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewLog, setViewLog] = useState<EmailLog | null>(null);
  const [stats, setStats] = useState({ total: 0, delivered: 0, failed: 0, opened: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(500);
    if (statusFilter !== "all") q = q.eq("delivery_status", statusFilter);
    if (search) q = q.ilike("to_email", `%${search}%`);
    const { data } = await q;
    const rows = (data ?? []) as EmailLog[];
    setLogs(rows);
    setStats({
      total: rows.length,
      delivered: rows.filter(r => r.delivery_status === 'delivered').length,
      failed: rows.filter(r => r.delivery_status === 'failed').length,
      opened: rows.filter(r => r.opened_at !== null).length,
    });
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const retryLog = async (log: EmailLog) => {
    await supabase.from("email_queue").insert({
      to_email: log.to_email, to_name: log.to_name, subject: log.subject,
      html_body: '', template_slug: log.template_slug, status: 'queued',
    });
    toast.success("Re-queued for delivery");
  };

  const deleteLog = async (id: string) => {
    await supabase.from("email_logs").delete().eq("id", id);
    toast.success("Log deleted");
    fetchLogs();
  };

  const exportCSV = () => {
    const rows = [["Recipient","Subject","Template","Provider","Status","Sent At","Opened","Error"]];
    logs.forEach(l => rows.push([l.to_email, l.subject, l.template_slug??'',l.provider_name??'',l.delivery_status,new Date(l.sent_at).toLocaleString(),l.opened_at?'Yes':'No',l.error_message??'']));
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `email-logs-${Date.now()}.csv`; a.click();
    toast.success("CSV exported");
  };

  const openRate = stats.total > 0 ? Math.round((stats.opened / stats.total) * 100) : 0;
  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Delivery Logs</h2>
            <p className="text-sm text-muted-foreground">{stats.total} emails logged · {deliveryRate}% delivery rate · {openRate}% open rate</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchLogs}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={exportCSV}><Download className="w-3.5 h-3.5"/>Export CSV</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", val: stats.total, color: "text-foreground" },
            { label: "Delivered", val: stats.delivered, color: "text-success" },
            { label: "Failed", val: stats.failed, color: "text-destructive" },
            { label: "Opened", val: stats.opened, color: "text-primary" },
          ].map(k => (
            <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
            <Input placeholder="Search by recipient email…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 h-8 text-xs"/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5"/></button>}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-40 shrink-0"><SelectValue placeholder="Status"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="complained">Complained</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Recipient","Subject","Template","Provider","Status","Opened","Sent At","Actions"].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({length:6}).map((_,i)=>(<tr key={i} className="border-b border-border">{Array.from({length:8}).map((__,j)=>(<td key={j} className="px-3 py-3"><Skeleton className="h-3 w-20 bg-muted"/></td>))}</tr>))
                  : logs.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50"/>No logs found
                    </td></tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap"><p className="font-medium text-foreground">{log.to_email}</p>{log.to_name&&<p className="text-muted-foreground">{log.to_name}</p>}</td>
                      <td className="px-3 py-2.5 max-w-[180px]"><p className="truncate text-foreground">{log.subject}</p></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.template_slug ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.provider_name ?? '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap"><Badge className={`text-xs ${STATUS_STYLES[log.delivery_status] ?? 'bg-muted'}`}>{log.delivery_status}</Badge></td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{log.opened_at ? <span className="text-success">Yes</span> : '—'}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{new Date(log.sent_at).toLocaleString()}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2" onClick={()=>setViewLog(log)}><Eye className="w-3 h-3"/></Button>
                          {log.delivery_status === 'failed' && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-success border-success/30 hover:bg-success/10" onClick={()=>retryLog(log)}><RotateCcw className="w-3 h-3"/></Button>
                          )}
                          <Button size="sm" variant="outline" className="h-6 px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={()=>deleteLog(log.id)}><Trash2 className="w-3 h-3"/></Button>
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

      {/* View Log Detail */}
      <Dialog open={!!viewLog} onOpenChange={v=>{ if(!v) setViewLog(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Email Log Detail</DialogTitle></DialogHeader>
          {viewLog && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["To", viewLog.to_email], ["Name", viewLog.to_name??'—'], ["Subject", viewLog.subject],
                  ["Template", viewLog.template_slug??'—'], ["Provider", viewLog.provider_name??'—'],
                  ["Status", viewLog.delivery_status], ["Message ID", viewLog.message_id??'—'],
                  ["Sent At", new Date(viewLog.sent_at).toLocaleString()],
                  ["Opened At", viewLog.opened_at ? new Date(viewLog.opened_at).toLocaleString() : '—'],
                  ["Retries", String(viewLog.retry_count)],
                ].map(([label, val]) => (
                  <div key={label} className="border border-border rounded p-2 bg-muted/30">
                    <p className="text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-foreground font-medium break-all">{val}</p>
                  </div>
                ))}
              </div>
              {viewLog.error_message && (
                <div className="border border-destructive/30 bg-destructive/5 rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">Error Message</p>
                  <p className="text-xs text-destructive font-mono">{viewLog.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
