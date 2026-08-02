import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { approveTransaction, rejectTransaction, notifyUser } from "@/lib/api";
import { Search, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

interface DepositRow {
  id: string;
  user_id: string;
  user_email: string;
  currency: string;
  amount: number;
  usd_value: number;
  status: string;
  note: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  pending:   "bg-warning/10 text-warning border-warning/20",
  failed:    "bg-destructive/10 text-destructive border-destructive/20",
  processing:"bg-info/10 text-info border-info/20",
};

export default function AdminDeposits() {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch deposits + join user email from profiles via user_id
      const { data, error } = await supabase
        .from("transactions")
        .select("id, user_id, currency, amount, usd_value, status, note, created_at")
        .eq("type", "deposit")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      // Enrich with email from profiles
      const userIds = [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))] as string[];
      let emailMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        (profiles ?? []).forEach((p: { id: string; email: string }) => { emailMap[p.id] = p.email; });
      }

      setRows((data ?? []).map((r: Omit<DepositRow, "user_email">) => ({ ...r, user_email: emailMap[r.user_id] ?? r.user_id })));
    } catch {
      toast.error("Failed to load deposits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (row: DepositRow) => {
    setActing(row.id);
    try {
      await approveTransaction(row.id, "deposit");
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, status: "completed" } : r));
      notifyUser({ type: "deposit_confirmed", user_id: row.user_id, user_email: row.user_email, currency: row.currency, amount: row.amount, usd_value: row.usd_value, transaction_id: row.id });
      toast.success("Deposit approved and balance credited.");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed to approve deposit."); }
    finally { setActing(null); }
  };

  const handleReject = async (row: DepositRow) => {
    setActing(row.id);
    try {
      await rejectTransaction(row.id);
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, status: "failed" } : r));
      notifyUser({ type: "deposit_failed", user_id: row.user_id, user_email: row.user_email, currency: row.currency, amount: row.amount, usd_value: row.usd_value, transaction_id: row.id });
      toast.error("Deposit rejected.");
    } catch { toast.error("Failed to reject deposit."); }
    finally { setActing(null); }
  };

  const filtered = rows.filter(d => {
    const q = search.toLowerCase();
    const matchS = d.user_email.toLowerCase().includes(q) || d.currency.toLowerCase().includes(q);
    const matchSt = statusFilter === "all" || d.status === statusFilter;
    return matchS && matchSt;
  });

  const pending = rows.filter(r => r.status === "pending").length;
  const totalUSD = rows.reduce((s, r) => s + r.usd_value, 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-foreground">Deposit Management</h2>
            <p className="text-sm text-muted-foreground">
              {pending > 0 && <span className="text-warning font-medium">{pending} pending · </span>}
              {rows.length} total · <span className="font-mono text-primary">${totalUSD.toLocaleString()}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by user or currency…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted rounded" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No deposits found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["User", "Currency", "Amount", "USD Value", "Status", "Date", "Note", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(d => (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 text-foreground whitespace-nowrap text-xs">{d.user_email}</td>
                        <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{d.currency}</td>
                        <td className="py-3 px-4 font-mono text-success whitespace-nowrap">+{Number(d.amount).toFixed(6)}</td>
                        <td className="py-3 px-4 font-mono text-primary whitespace-nowrap">${Number(d.usd_value).toLocaleString()}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={`text-xs ${statusColors[d.status] ?? "bg-muted text-muted-foreground"}`}>{d.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs max-w-[160px] truncate">{d.note ?? "—"}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {d.status === "pending" && (
                            <div className="flex gap-1">
                              <Button size="sm" disabled={acting === d.id}
                                className="h-6 px-2 bg-success text-success-foreground hover:bg-success/90 text-xs gap-1"
                                onClick={() => handleApprove(d)}>
                                <CheckCircle className="w-3 h-3" />Approve
                              </Button>
                              <Button size="sm" variant="outline" disabled={acting === d.id}
                                className="h-6 px-2 text-xs gap-1 text-destructive border-destructive/30"
                                onClick={() => handleReject(d)}>
                                <XCircle className="w-3 h-3" />Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
