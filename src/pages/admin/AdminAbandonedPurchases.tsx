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
import { RefreshCw, Search, Mail, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";

interface AbandonedPurchase {
  id: string;
  user_id: string;
  email: string | null;
  contract_name: string | null;
  contract_price_usd: number | null;
  hashrate_th: number | null;
  abandonment_stage: string;
  status: string;
  recovery_emails_sent: number;
  abandoned_at: string;
  recovered_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  abandoned: "bg-amber-500/10 text-amber-500",
  recovered: "bg-green-500/10 text-green-500",
  lost: "bg-destructive/10 text-destructive",
};

export default function AdminAbandonedPurchases() {
  const [items, setItems] = useState<AbandonedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("abandoned_purchases").select("*").order("abandoned_at", { ascending: false });
    if (error) toast.error("Failed to load data");
    else setItems(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || (i.email ?? "").toLowerCase().includes(q) || (i.contract_name ?? "").toLowerCase().includes(q);
    const matchS = statusFilter === "all" || i.status === statusFilter;
    return matchQ && matchS;
  });

  const markStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    await supabase.from("abandoned_purchases").update({ status }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    toast.success("Status updated");
    setActionLoading(null);
  };

  const sendRecovery = async (item: AbandonedPurchase) => {
    setActionLoading(item.id + "email");
    const { error } = await supabase.functions.invoke("marketing-automation", {
      body: {
        action: "funnel_event",
        event: "recovery_email_manual",
        user_id: item.user_id,
        email: item.email,
        metadata: { contract_name: item.contract_name },
      },
    });
    if (error) toast.error("Failed to queue email");
    else {
      await supabase.from("abandoned_purchases").update({ recovery_emails_sent: (item.recovery_emails_sent ?? 0) + 1 }).eq("id", item.id);
      toast.success("Recovery email queued");
      load();
    }
    setActionLoading(null);
  };

  const totalValue = filtered.reduce((s, i) => s + (i.contract_price_usd ?? 0), 0);
  const recoveredValue = filtered.filter(i => i.status === "recovered").reduce((s, i) => s + (i.contract_price_usd ?? 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Abandoned Purchase Tracker</h2>
            <p className="text-sm text-muted-foreground">{items.filter(i => i.status === "abandoned").length} open abandonments</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Abandoned", value: items.length },
            { label: "Recovered", value: items.filter(i => i.status === "recovered").length },
            { label: "Total Value", value: "$" + totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
            { label: "Recovered Value", value: "$" + recoveredValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email or contract…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
              <SelectItem value="recovered">Recovered</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["User Email", "Contract", "Price", "Stage", "Status", "Emails Sent", "Abandoned", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((__, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-20" /></td>)}
                    </tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No abandoned purchases</td></tr>
                  ) : filtered.map(item => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">{item.email ?? "—"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.contract_name ?? "—"}</span>
                        </div>
                        {item.hashrate_th && <p className="text-xs text-muted-foreground">{item.hashrate_th} TH/s</p>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-foreground">
                        {item.contract_price_usd ? "$" + item.contract_price_usd.toLocaleString() : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs capitalize">{item.abandonment_stage.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs capitalize ${STATUS_COLORS[item.status] ?? "bg-muted text-muted-foreground"}`}>{item.status}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-center">{item.recovery_emails_sent}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(item.abandoned_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {item.status === "abandoned" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-blue-500 hover:bg-blue-500/10"
                                onClick={() => sendRecovery(item)} disabled={actionLoading === item.id + "email"} title="Send recovery email">
                                {actionLoading === item.id + "email" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-500 hover:bg-green-500/10"
                                onClick={() => markStatus(item.id, "recovered")} disabled={actionLoading === item.id + "recovered"} title="Mark recovered">
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => markStatus(item.id, "lost")} disabled={actionLoading === item.id + "lost"} title="Mark lost">
                                <XCircle className="w-3 h-3" />
                              </Button>
                            </>
                          )}
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
