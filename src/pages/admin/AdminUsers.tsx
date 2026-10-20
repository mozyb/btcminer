import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPublicContractTemplates, adminAssignContract, getWallets,
  isStarterPlan, hasUserPurchasedStarterPlan,
  type ContractTemplate, type Wallet,
} from "@/lib/api";
import { supabase } from "@/db/supabase";
import {
  Search, CheckCircle2, XCircle, RefreshCw, MailCheck,
  ShieldCheck, Users, ChevronDown, ShieldPlus, ShieldMinus, Trash2,
  LogIn, Zap, Sparkles, Wallet as WalletIcon, ArrowRight, Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useBtcStats } from "@/hooks/useBtcStats";
import { formatCryptoBalance } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { impersonateUser } = useAuth();
  const btc = useBtcStats();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Impersonation state
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Assign & Buy Contract modal state
  const [assignModalUser, setAssignModalUser] = useState<UserRow | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("custom");
  const [allocationMode, setAllocationMode] = useState<"complimentary" | "wallet">("complimentary");
  const [userWallets, setUserWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [selectedWalletCurrency, setSelectedWalletCurrency] = useState<string>("USDT");
  const [contractName, setContractName] = useState<string>("Custom Hashrate Allocation");
  const [coin, setCoin] = useState<string>("Bitcoin");
  const [algorithm, setAlgorithm] = useState<string>("SHA-256");
  const [customHashrate, setCustomHashrate] = useState<number>(100);
  const [customHashrateUnit, setCustomHashrateUnit] = useState<string>("TH/s");
  const [customDuration, setCustomDuration] = useState<number>(30);
  const [customPrice, setCustomPrice] = useState<number>(50);
  const [isLifetime, setIsLifetime] = useState<boolean>(false);
  const [assigning, setAssigning] = useState(false);
  const [assignUserHasStarter, setAssignUserHasStarter] = useState(false);

  // Confirm dialog state for delete
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

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

  // ── Role & delete actions via Edge Function ───────────────────────────
  const manageUser = useCallback(async (action: "promote" | "demote" | "delete", target: UserRow) => {
    setActionLoading(target.id + "-" + action);
    try {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action, target_user_id: target.id },
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) throw new Error(result.error ?? "Unknown error");
      toast.success(result.message ?? "Done");
      if (action === "delete") {
        setUsers(prev => prev.filter(u => u.id !== target.id));
        setDeleteTarget(null);
      } else {
        const newRole = action === "promote" ? "admin" : "user";
        setUsers(prev => prev.map(u => u.id === target.id ? { ...u, role: newRole } : u));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
    setActionLoading(null);
  }, []);

  const unverifiedCount = users.filter(u => !u.email_verified).length;

  // ── Impersonation & Contract Assignment Handlers ───────────────────────
  const handleLoginAsUser = async (u: UserRow) => {
    if (u.role === "admin") {
      toast.error("Cannot impersonate another administrator account.");
      return;
    }
    setImpersonatingId(u.id);
    try {
      const ok = await impersonateUser(u.id);
      if (ok) {
        toast.success(`Switched session to ${u.email}! Redirecting to user dashboard...`);
        navigate("/dashboard");
      } else {
        toast.error("Failed to switch session to user account.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impersonation failed");
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleOpenAssignModal = async (u: UserRow) => {
    setAssignModalUser(u);
    setAllocationMode("complimentary");
    setAssigning(false);
    setAssignUserHasStarter(false);
    hasUserPurchasedStarterPlan(u.id).then(setAssignUserHasStarter).catch(() => setAssignUserHasStarter(false));

    setTemplatesLoading(true);
    try {
      const tpls = await getPublicContractTemplates();
      setTemplates(tpls);
      if (tpls.length > 0) {
        const first = tpls[0];
        setSelectedTemplateId(first.id);
        setContractName(first.name);
        setCoin(first.coin);
        setAlgorithm(first.algorithm);
        setCustomHashrate(first.hashrate);
        setCustomHashrateUnit(first.hashrate_unit);
        setCustomDuration(first.duration ?? 30);
        setIsLifetime(Boolean(first.is_lifetime));
        setCustomPrice(first.promotional_price ?? first.discount_price ?? first.price);
      }
    } catch (err) {
      console.warn("Could not load templates:", err);
    } finally {
      setTemplatesLoading(false);
    }

    setWalletsLoading(true);
    try {
      const wList = await getWallets(u.id);
      setUserWallets(wList);
      if (wList.length > 0) {
        setSelectedWalletCurrency(wList[0].currency);
      }
    } catch (err) {
      console.warn("Could not load user wallets:", err);
    } finally {
      setWalletsLoading(false);
    }
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (id === "custom") {
      setContractName("Custom Hashrate Allocation");
      setCoin("Bitcoin");
      setAlgorithm("SHA-256");
      setCustomHashrate(100);
      setCustomHashrateUnit("TH/s");
      setCustomDuration(30);
      setIsLifetime(false);
      setCustomPrice(50);
      return;
    }
    const t = templates.find(item => item.id === id);
    if (t) {
      setContractName(t.name);
      setCoin(t.coin);
      setAlgorithm(t.algorithm);
      setCustomHashrate(t.hashrate);
      setCustomHashrateUnit(t.hashrate_unit);
      setCustomDuration(t.duration ?? 30);
      setIsLifetime(Boolean(t.is_lifetime));
      setCustomPrice(t.promotional_price ?? t.discount_price ?? t.price);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignModalUser) return;
    if (isStarterPlan({ name: contractName, template_id: selectedTemplateId }) && assignUserHasStarter) {
      toast.error("Starter SHA-256 is strictly limited to 1 purchase per account. This user has already claimed this plan.");
      return;
    }
    setAssigning(true);
    try {
      await adminAssignContract({
        userId: assignModalUser.id,
        templateId: selectedTemplateId !== "custom" ? selectedTemplateId : undefined,
        contractName: contractName.trim() || "Active Hashrate Contract",
        coin: coin || "Bitcoin",
        algorithm: algorithm || "SHA-256",
        hashrate: Number(customHashrate) || 10,
        hashrateUnit: customHashrateUnit || "TH/s",
        duration: isLifetime ? 0 : (Number(customDuration) || 30),
        isLifetime,
        paymentMode: allocationMode,
        pricePaid: allocationMode === "complimentary" ? 0 : Number(customPrice) || 0,
        walletCurrency: selectedWalletCurrency,
        exchangeRate: btc.getPrice(selectedWalletCurrency),
      });

      toast.success(`Successfully provisioned contract for ${assignModalUser.email}!`);
      setAssignModalUser(null);
    } catch (e) {
      console.error("Assign contract error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to assign contract");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Delete confirmation dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{deleteTarget?.email}</strong> and all their data.
                This action <strong>cannot be undone</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && manageUser("delete", deleteTarget)}
                disabled={actionLoading === deleteTarget?.id + "-delete"}
              >
                {actionLoading === deleteTarget?.id + "-delete"
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
                        <div className="flex items-center gap-1">
                          {/* Impersonate / Login as User — disabled for self and other admins */}
                          {u.id !== currentUserId && u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => handleLoginAsUser(u)}
                              disabled={impersonatingId === u.id}
                              title={`Log in and view dashboard as ${u.email}`}
                            >
                              {impersonatingId === u.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <LogIn className="w-3 h-3" />
                              )}
                              Login as User
                            </Button>
                          )}

                          {/* Buy / Assign Plan for User */}
                          {u.role !== "admin" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                              onClick={() => handleOpenAssignModal(u)}
                              title={`Buy or assign a mining plan directly for ${u.email}`}
                            >
                              <Zap className="w-3 h-3" />
                              Buy Plan
                            </Button>
                          )}

                          {/* Email verification */}
                          {u.email_verified ? (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => markVerified(u.id, false)}
                              disabled={!!actionLoading}
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
                                disabled={!!actionLoading}
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
                                disabled={!!actionLoading}
                                title="Resend verification email"
                              >
                                {actionLoading === u.id + "-resend"
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <MailCheck className="w-3 h-3"/>}
                                Resend
                              </Button>
                            </>
                          )}

                          {/* Role toggle — disabled for self */}
                          {u.id !== currentUserId && (
                            u.role === "admin" ? (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-xs gap-1 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                                onClick={() => manageUser("demote", u)}
                                disabled={!!actionLoading}
                                title="Demote to user"
                              >
                                {actionLoading === u.id + "-demote"
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <ShieldMinus className="w-3 h-3"/>}
                                Demote
                              </Button>
                            ) : (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 text-xs gap-1 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                onClick={() => manageUser("promote", u)}
                                disabled={!!actionLoading}
                                title="Promote to admin"
                              >
                                {actionLoading === u.id + "-promote"
                                  ? <RefreshCw className="w-3 h-3 animate-spin"/>
                                  : <ShieldPlus className="w-3 h-3"/>}
                                Promote
                              </Button>
                            )
                          )}

                          {/* Delete — disabled for self */}
                          {u.id !== currentUserId && (
                            <Button
                              size="sm" variant="ghost"
                              className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(u)}
                              disabled={!!actionLoading}
                              title="Delete account"
                            >
                              <Trash2 className="w-3 h-3"/>
                              Delete
                            </Button>
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

        {/* Assign & Buy Contract for User Modal */}
        <Dialog open={!!assignModalUser} onOpenChange={open => { if (!open) setAssignModalUser(null); }}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Assign & Buy Mining Plan for User
              </DialogTitle>
              <DialogDescription>
                Provision a mining contract directly for <strong>{assignModalUser?.email}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Target User Info & Balances */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium text-foreground">
                    {[assignModalUser?.first_name, assignModalUser?.last_name].filter(Boolean).join(" ") || assignModalUser?.username || "Standard User"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">{assignModalUser?.email}</span>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <WalletIcon className="w-3 h-3" /> User Wallets:
                    </span>
                    {walletsLoading && <span className="text-muted-foreground">Loading balances…</span>}
                  </div>
                  {userWallets.length === 0 && !walletsLoading ? (
                    <p className="text-xs text-muted-foreground italic">No active wallets initialized for this user yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {userWallets.map(w => (
                        <div key={w.id} className="p-1.5 bg-background rounded border text-[11px] flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">{w.currency}</span>
                          <div className="text-right">
                            <span className="font-mono text-foreground font-semibold block">
                              {formatCryptoBalance(w.balance, w.currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ≈ ${btc.toUsd(Number(w.balance || 0), w.currency).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Template Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Mining Plan / Template</Label>
                <Select value={selectedTemplateId} onValueChange={handleSelectTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => {
                      const isStarter = isStarterPlan(t);
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {t.hashrate} {t.hashrate_unit} (${t.promotional_price ?? t.discount_price ?? t.price})
                          {isStarter ? (assignUserHasStarter ? " ⚠️ (Already Claimed - Limit 1)" : " • 1-Time Limit") : ""}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value="custom">⚙️ Custom Hashrate & Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isStarterPlan({ name: contractName, template_id: selectedTemplateId }) && assignUserHasStarter && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>This user account has already claimed the <strong>Starter SHA-256</strong> contract (strictly limited to 1 per account).</span>
                </div>
              )}

              {/* Plan parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contract Name</Label>
                  <Input
                    className="text-xs"
                    value={contractName}
                    onChange={e => setContractName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Coin</Label>
                  <Select value={coin} onValueChange={setCoin}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bitcoin">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="Ethereum">Ethereum (ETH)</SelectItem>
                      <SelectItem value="Litecoin">Litecoin (LTC)</SelectItem>
                      <SelectItem value="Dogecoin">Dogecoin (DOGE)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Hashrate ({customHashrateUnit})</Label>
                  <Input
                    type="number"
                    className="text-xs"
                    value={customHashrate}
                    onChange={e => setCustomHashrate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Duration (Days)</Label>
                  <Input
                    type="number"
                    className="text-xs"
                    value={isLifetime ? 0 : customDuration}
                    disabled={isLifetime}
                    onChange={e => setCustomDuration(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nominal Price ($)</Label>
                  <Input
                    type="number"
                    className="text-xs"
                    value={customPrice}
                    onChange={e => setCustomPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Allocation Mode: Complimentary vs Charge User */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <Label className="text-xs font-semibold">Payment / Allocation Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAllocationMode("complimentary")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      allocationMode === "complimentary"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Administrative Grant</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Complimentary ($0 cost). Provisions contract immediately without charging the user.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllocationMode("wallet")}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      allocationMode === "wallet"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <WalletIcon className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Charge User Balance</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Deduct ${customPrice} equivalent from user's crypto wallet balance.
                    </p>
                  </button>
                </div>

                {allocationMode === "wallet" && (
                  <div className="p-3 bg-muted/20 border border-border/60 rounded-lg space-y-2">
                    <Label className="text-xs text-muted-foreground">Select User Wallet to Deduct:</Label>
                    <Select value={selectedWalletCurrency} onValueChange={setSelectedWalletCurrency}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {userWallets.length > 0 ? (
                          userWallets.map(w => {
                            const balFormatted = formatCryptoBalance(w.balance, w.currency);
                            const usdVal = btc.toUsd(Number(w.balance || 0), w.currency);
                            return (
                              <SelectItem key={w.id} value={w.currency}>
                                {w.currency} (Balance: {balFormatted} ≈ ${usdVal.toFixed(2)} USD)
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="USDT">USDT (Default)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>

                    {/* Selected wallet sufficiency and deduction preview */}
                    {(() => {
                      const targetW = userWallets.find(w => w.currency === selectedWalletCurrency) || userWallets[0];
                      const userBalUSD = targetW ? btc.toUsd(Number(targetW.balance || 0), targetW.currency) : 0;
                      const targetRate = targetW ? (btc.getPrice(targetW.currency) || (targetW.currency === "USDT" ? 1 : 89000)) : 1;
                      const planPriceUSD = Number(customPrice) || 0;
                      const requiredCrypto = targetRate > 0 ? planPriceUSD / targetRate : 0;
                      const isSufficient = userBalUSD + 0.05 >= planPriceUSD;

                      return (
                        <div className={`p-2.5 rounded border text-xs space-y-1.5 ${isSufficient ? "bg-success/10 border-success/30 text-success-foreground" : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"}`}>
                          <div className="flex justify-between items-center font-medium">
                            <span className="flex items-center gap-1.5">
                              {isSufficient ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              {isSufficient ? "Sufficient User Balance" : "Balance Shortfall Detected"}
                            </span>
                            <span className="font-mono text-[11px]">
                              Cost: {formatCryptoBalance(requiredCrypto, targetW?.currency)} {targetW?.currency} (${planPriceUSD.toFixed(2)} USD)
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Available in {targetW?.currency || "Wallet"}:</span>
                            <span className="font-mono font-semibold text-foreground">
                              {formatCryptoBalance(targetW?.balance, targetW?.currency)} {targetW?.currency} (≈ ${userBalUSD.toFixed(2)} USD)
                            </span>
                          </div>
                          {!isSufficient && (
                            <div className="pt-1 border-t border-amber-500/20 text-[11px] flex items-center justify-between gap-2">
                              <span>
                                User wallet has ${userBalUSD.toFixed(2)} USD, plan costs ${planPriceUSD.toFixed(2)} USD.
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-6 text-[10px] px-2 text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                                onClick={() => setAllocationMode("complimentary")}
                              >
                                Switch to Free Grant
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Quick shortcut to login as user */}
              <div className="p-2.5 rounded bg-primary/5 border border-primary/20 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Need to test the user's view or buy directly from the marketplace?
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-primary hover:bg-primary/15 gap-1 shrink-0"
                  onClick={() => {
                    if (assignModalUser) {
                      const u = assignModalUser;
                      setAssignModalUser(null);
                      handleLoginAsUser(u);
                    }
                  }}
                >
                  <LogIn className="w-3 h-3" /> Login as {assignModalUser?.first_name || "User"}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalUser(null)}
                disabled={assigning}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                onClick={handleConfirmAssign}
                disabled={assigning}
              >
                {assigning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Provisioning Plan…
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Confirm & Assign Contract
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

