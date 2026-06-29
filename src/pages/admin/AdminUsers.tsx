import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import {
  Search, CheckCircle2, XCircle, RefreshCw, MailCheck,
  ShieldCheck, Users, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  country: string | null;
  role: string;
  kyc_status: string;
  email_verified: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,first_name,last_name,username,country,role,kyc_status,email_verified,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load users");
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || u.email.toLowerCase().includes(q)
      || (u.first_name ?? "").toLowerCase().includes(q)
      || (u.last_name ?? "").toLowerCase().includes(q)
      || (u.username ?? "").toLowerCase().includes(q);
    const matchVerified =
      verifiedFilter === "all" ||
      (verifiedFilter === "verified" && u.email_verified) ||
      (verifiedFilter === "unverified" && !u.email_verified);
    return matchSearch && matchVerified;
  });

  // ── Single-user actions ───────────────────────────────────────────────
  const markVerified = async (userId: string, verified: boolean) => {
    setActionLoading(userId + "-mark");
    const { error } = await supabase
      .from("profiles")
      .update({ email_verified: verified })
      .eq("id", userId);
    if (error) toast.error("Failed to update verification status");
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, email_verified: verified } : u));
      toast.success(verified ? "Email marked as verified" : "Email marked as unverified");
    }
    setActionLoading(null);
  };

  const resendVerification = async (userId: string, email: string, firstName: string | null) => {
    setActionLoading(userId + "-resend");
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: userId, email, first_name: firstName ?? undefined },
      });
      if (error) throw error;
      toast.success(`Verification email sent to ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send email");
    }
    setActionLoading(null);
  };

  // ── Bulk actions ──────────────────────────────────────────────────────
  const bulkMarkVerified = async () => {
    if (!selected.size) return;
    setActionLoading("bulk-mark");
    const ids = Array.from(selected);
    const { error } = await supabase.from("profiles").update({ email_verified: true }).in("id", ids);
    if (error) toast.error("Bulk update failed");
    else {
      setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, email_verified: true } : u));
      toast.success(`${ids.length} user(s) marked as verified`);
      setSelected(new Set());
    }
    setActionLoading(null);
  };

  const bulkResend = async () => {
    if (!selected.size) return;
    setActionLoading("bulk-resend");
    const targets = users.filter(u => selected.has(u.id) && !u.email_verified);
    if (!targets.length) { toast.info("All selected users are already verified"); setActionLoading(null); return; }
    let sent = 0;
    for (const u of targets) {
      try {
        await supabase.functions.invoke("send-verification-email", {
          body: { user_id: u.id, email: u.email, first_name: u.first_name ?? undefined },
        });
        sent++;
      } catch { /* continue */ }
    }
    toast.success(`Sent ${sent} of ${targets.length} verification email(s)`);
    setSelected(new Set());
    setActionLoading(null);
  };

  // ── Selection helpers ─────────────────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };

  const unverifiedCount = users.filter(u => !u.email_verified).length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-foreground">User Management</h2>
            <p className="text-sm text-muted-foreground">{users.length} total · {unverifiedCount} unverified</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: users.length, icon: <Users className="w-4 h-4 text-primary"/> },
            { label: "Verified", value: users.filter(u => u.email_verified).length, icon: <CheckCircle2 className="w-4 h-4 text-green-500"/> },
            { label: "Unverified", value: unverifiedCount, icon: <XCircle className="w-4 h-4 text-amber-500"/> },
            { label: "Admins", value: users.filter(u => u.role === "admin").length, icon: <ShieldCheck className="w-4 h-4 text-blue-500"/> },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-muted/40 rounded-lg flex items-center justify-center shrink-0">{s.icon}</div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, email or username…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={verifiedFilter} onValueChange={v => setVerifiedFilter(v as typeof verifiedFilter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
              <SelectItem value="unverified">Unverified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 flex-wrap">
            <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                size="sm" className="gap-1.5 h-8 text-xs"
                onClick={bulkMarkVerified}
                disabled={actionLoading === "bulk-mark"}
              >
                {actionLoading === "bulk-mark"
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
                  : <CheckCircle2 className="w-3.5 h-3.5"/>}
                Mark All Verified
              </Button>
              <Button
                size="sm" variant="outline" className="gap-1.5 h-8 text-xs"
                onClick={bulkResend}
                disabled={actionLoading === "bulk-resend"}
              >
                {actionLoading === "bulk-resend"
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/>
                  : <MailCheck className="w-3.5 h-3.5"/>}
                Resend Verification
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-left w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    {["User", "Role", "KYC", "Email Verified", "Joined", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-20"/></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : filtered.map(u => (
                    <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${selected.has(u.id) ? "bg-primary/5" : ""}`}>
                      <td className="py-3 px-4">
                        <Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggleSelect(u.id)} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-foreground">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs ${u.role === "admin" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-muted text-muted-foreground"}`}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs ${
                          u.kyc_status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                          u.kyc_status === "pending"  ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          u.kyc_status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          "bg-muted text-muted-foreground"
                        }`}>{u.kyc_status ?? "—"}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {u.email_verified
                            ? <CheckCircle2 className="w-4 h-4 text-green-500"/>
                            : <XCircle className="w-4 h-4 text-amber-500"/>}
                          <span className={`text-xs ${u.email_verified ? "text-green-500" : "text-amber-500"}`}>
                            {u.email_verified ? "Verified" : "Unverified"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {u.email_verified ? (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => markVerified(u.id, false)}
                              disabled={actionLoading === u.id + "-mark"}
                              title="Mark as unverified"
                            >
                              {actionLoading === u.id + "-mark"
                                ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                : <XCircle className="w-3 h-3"/>}
                              <ChevronDown className="w-3 h-3"/>
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-xs gap-1 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                onClick={() => markVerified(u.id, true)}
                                disabled={actionLoading === u.id + "-mark"}
                                title="Mark as verified"
                              >
                                {actionLoading === u.id + "-mark"
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <CheckCircle2 className="w-3 h-3"/>}
                                Verify
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                                onClick={() => resendVerification(u.id, u.email, u.first_name)}
                                disabled={actionLoading === u.id + "-resend"}
                                title="Resend verification email"
                              >
                                {actionLoading === u.id + "-resend"
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <MailCheck className="w-3 h-3"/>}
                                Resend
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

const kycColors: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  not_submitted: "bg-muted text-muted-foreground",
};

