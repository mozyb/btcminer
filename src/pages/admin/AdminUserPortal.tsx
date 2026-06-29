import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Search, Users, Wallet, TrendingUp, TrendingDown,
  ArrowDownToLine, ArrowUpFromLine, Eye, RefreshCw,
  UserCheck, UserX, Globe, Clock, Shield, ChevronDown,
  Zap, Star, Copy, Bitcoin,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  country: string | null;
  role: string;
  kyc_status: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  // aggregated
  btc_balance: number;
  eth_balance: number;
  usdt_balance: number;
  deposit_count: number;
  withdrawal_count: number;
  total_deposited: number;
  total_withdrawn: number;
  contract_count: number;
}

interface UserTransaction {
  id: string;
  type: string;
  currency: string;
  amount: number;
  usd_value: number;
  status: string;
  note: string | null;
  created_at: string;
}

interface UserExternalWalletAdmin {
  id: string;
  wallet_type: "hot" | "cold";
  provider: string;
  address: string;
  label: string | null;
  is_primary: boolean;
  network: string;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const kycBadge: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  not_submitted: "bg-muted text-muted-foreground",
};

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  suspended: "bg-warning/10 text-warning border-warning/20",
  banned: "bg-destructive/10 text-destructive border-destructive/20",
};

function fmt(n: number, dec = 5) { return n.toLocaleString("en-US", { maximumFractionDigits: dec, minimumFractionDigits: 0 }); }
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Data fetching ──────────────────────────────────────────────────────────
async function fetchUsers(): Promise<UserRow[]> {
  // Fetch profiles
  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, username, country, role, kyc_status, status, last_login_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (pe) throw pe;
  if (!profiles?.length) return [];

  const ids = profiles.map(p => p.id);

  // Fetch wallets for all users
  const { data: wallets } = await supabase
    .from("wallets")
    .select("user_id, currency, balance")
    .in("user_id", ids);

  // Fetch transactions summary
  const { data: txs } = await supabase
    .from("transactions")
    .select("user_id, type, amount, status")
    .in("user_id", ids);

  // Fetch contract counts
  const { data: contracts } = await supabase
    .from("contracts")
    .select("user_id")
    .in("user_id", ids);

  return profiles.map(p => {
    const uw = wallets?.filter(w => w.user_id === p.id) ?? [];
    const ut = txs?.filter(t => t.user_id === p.id) ?? [];
    const deposits = ut.filter(t => t.type === "deposit");
    const withdrawals = ut.filter(t => t.type === "withdrawal");
    return {
      ...p,
      status: p.status ?? "active",
      btc_balance: uw.find(w => w.currency === "BTC")?.balance ?? 0,
      eth_balance: uw.find(w => w.currency === "ETH")?.balance ?? 0,
      usdt_balance: uw.find(w => w.currency === "USDT")?.balance ?? 0,
      deposit_count: deposits.length,
      withdrawal_count: withdrawals.length,
      total_deposited: deposits.filter(t => t.status === "confirmed").reduce((s, t) => s + t.amount, 0),
      total_withdrawn: withdrawals.filter(t => t.status === "confirmed").reduce((s, t) => s + t.amount, 0),
      contract_count: contracts?.filter(c => c.user_id === p.id).length ?? 0,
    };
  });
}

async function fetchUserTransactions(userId: string): Promise<UserTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, currency, amount, usd_value, status, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function fetchUserExternalWalletsAdmin(userId: string): Promise<UserExternalWalletAdmin[]> {
  const { data, error } = await supabase
    .from("user_wallets")
    .select("id, wallet_type, provider, address, label, is_primary, network, created_at")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ─── Balance Adjust Modal ───────────────────────────────────────────────────
function BalanceModal({
  user,
  open,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"topup" | "debit">("topup");
  const [currency, setCurrency] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const balance = currency === "BTC" ? user.btc_balance : currency === "ETH" ? user.eth_balance : user.usdt_balance;

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const signed = mode === "debit" ? -amt : amt;
      const { error } = await supabase.rpc("admin_adjust_balance", {
        p_user_id: user.id,
        p_currency: currency,
        p_amount: signed,
        p_note: note || null,
      });
      if (error) throw error;
      toast.success(`${mode === "topup" ? "Top-up" : "Debit"} applied — ${fmt(amt)} ${currency}`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-balance">Adjust Balance — {user.first_name ?? user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("topup")}
              className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors ${mode === "topup" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:bg-muted/50"}`}
            >
              <TrendingUp className="w-4 h-4" /> Top-Up
            </button>
            <button
              onClick={() => setMode("debit")}
              className={`flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors ${mode === "debit" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:bg-muted/50"}`}
            >
              <TrendingDown className="w-4 h-4" /> Debit
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">BTC — current: {fmt(user.btc_balance)} ₿</SelectItem>
                <SelectItem value="ETH">ETH — current: {fmt(user.eth_balance)} ETH</SelectItem>
                <SelectItem value="USDT">USDT — current: {fmt(user.usdt_balance, 2)} USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Amount</Label>
            <Input
              type="number"
              step="0.00001"
              min="0"
              placeholder={`e.g. 0.01`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="font-mono"
            />
            {mode === "debit" && (
              <p className="text-xs text-muted-foreground">Current balance: <span className="font-mono">{fmt(balance)} {currency}</span></p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-normal">Note (optional)</Label>
            <Input placeholder="Reason for adjustment..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !amount}
            className={mode === "topup" ? "bg-success text-success-foreground hover:bg-success/90" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
          >
            {saving ? "Applying…" : mode === "topup" ? "Apply Top-Up" : "Apply Debit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── User Detail Drawer ─────────────────────────────────────────────────────
function UserDetailPanel({
  user,
  open,
  onClose,
  onAdjust,
  onStatusChange,
}: {
  user: UserRow;
  open: boolean;
  onClose: () => void;
  onAdjust: () => void;
  onStatusChange: (status: string) => void;
}) {
  const [txs, setTxs] = useState<UserTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [extWallets, setExtWallets] = useState<UserExternalWalletAdmin[]>([]);
  const [extLoading, setExtLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTxLoading(true);
    setExtLoading(true);
    fetchUserTransactions(user.id)
      .then(setTxs)
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setTxLoading(false));
    fetchUserExternalWalletsAdmin(user.id)
      .then(setExtWallets)
      .catch(() => toast.error("Failed to load connected wallets"))
      .finally(() => setExtLoading(false));
  }, [open, user.id]);

  if (!open) return null;

  const txStatusColor: Record<string, string> = {
    confirmed: "text-success",
    pending: "text-warning",
    failed: "text-destructive",
    processing: "text-info",
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-xl bg-background border-l border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-foreground text-balance">
              {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "—"}
            </h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Status row */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={`text-xs ${statusBadge[user.status] ?? "bg-muted text-muted-foreground"}`}>{user.status}</Badge>
              <Badge className={`text-xs ${kycBadge[user.kyc_status] ?? "bg-muted text-muted-foreground"}`}>KYC: {user.kyc_status.replace("_", " ")}</Badge>
              <Badge className="text-xs bg-muted text-muted-foreground">{user.role}</Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: Globe, label: "Country", val: user.country || "—" },
                { icon: Clock, label: "Last Login", val: fmtDate(user.last_login_at) },
                { icon: Shield, label: "Joined", val: fmtDate(user.created_at) },
                { icon: Users, label: "Contracts", val: user.contract_count.toString() },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="flex items-start gap-2 p-3 bg-muted/30 rounded border border-border">
                  <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-foreground text-pretty">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet balances */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-balance">Wallet Balances</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "BTC", val: fmt(user.btc_balance), suffix: "₿", color: "text-primary" },
                    { label: "ETH", val: fmt(user.eth_balance), suffix: "Ξ", color: "text-info" },
                    { label: "USDT", val: fmt(user.usdt_balance, 2), suffix: "$", color: "text-success" },
                  ].map(w => (
                    <div key={w.label} className="text-center p-2 bg-muted/30 rounded">
                      <p className="text-xs text-muted-foreground mb-1">{w.label}</p>
                      <p className={`font-mono font-bold text-sm ${w.color}`}>{w.val}</p>
                      <p className="text-xs text-muted-foreground">{w.suffix}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transaction summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-success/5 border border-success/20 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="w-4 h-4 text-success" />
                  <p className="text-xs text-muted-foreground">Total Deposited</p>
                </div>
                <p className="font-mono font-bold text-success">{user.deposit_count} txns</p>
                <p className="text-xs text-muted-foreground">{fmt(user.total_deposited)} BTC confirmed</p>
              </div>
              <div className="p-3 bg-warning/5 border border-warning/20 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpFromLine className="w-4 h-4 text-warning" />
                  <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                </div>
                <p className="font-mono font-bold text-warning">{user.withdrawal_count} txns</p>
                <p className="text-xs text-muted-foreground">{fmt(user.total_withdrawn)} BTC confirmed</p>
              </div>
            </div>

            {/* Connected External Wallets */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-primary" />
                  Connected External Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {extLoading ? (
                  <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-muted" />)}</div>
                ) : extWallets.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">No external wallets connected</p>
                ) : (
                  <div className="space-y-2">
                    {extWallets.map(w => (
                      <div key={w.id} className={`flex items-center gap-3 p-2 rounded border ${w.is_primary ? "bg-primary/5 border-primary/20" : "bg-muted/20 border-border"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {w.wallet_type === "hot" ? <Zap className="w-3 h-3 text-warning" /> : <Shield className="w-3 h-3 text-success" />}
                            <span className="text-xs font-medium text-foreground">{w.label || w.provider}</span>
                            {w.is_primary && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-4 px-1">
                                <Star className="w-2.5 h-2.5 mr-0.5" /> Primary
                              </Badge>
                            )}
                            <Badge className={`text-[10px] h-4 px-1 ${
                              w.wallet_type === "hot"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-success/10 text-success border-success/20"
                            }`}>
                              {w.wallet_type === "hot" ? "Hot" : "Cold"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="font-mono text-[10px] text-muted-foreground truncate">{w.address}</p>
                            <button
                              onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Address copied"); }}
                              className="text-muted-foreground hover:text-primary shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{w.provider}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={onAdjust}>
                <Wallet className="w-3.5 h-3.5 mr-1.5" />Adjust Balance
              </Button>
              {user.status === "active" ? (
                <Button size="sm" variant="outline" className="text-warning border-warning/40 hover:bg-warning/10" onClick={() => onStatusChange("suspended")}>
                  <UserX className="w-3.5 h-3.5 mr-1.5" />Suspend
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-success border-success/40 hover:bg-success/10" onClick={() => onStatusChange("active")}>
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />Activate
                </Button>
              )}
            </div>

            {/* Transaction history */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Transaction History</h3>
              {txLoading ? (
                <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full bg-muted" />)}</div>
              ) : txs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {["Date", "Type", "Amount", "Currency", "Status", "Note"].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-muted-foreground uppercase whitespace-nowrap font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {txs.map(tx => (
                        <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="py-2 px-2 whitespace-nowrap text-muted-foreground">{fmtDate(tx.created_at)}</td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <Badge className={`text-[10px] ${tx.type === "deposit" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>{tx.type}</Badge>
                          </td>
                          <td className="py-2 px-2 font-mono whitespace-nowrap text-foreground">{fmt(tx.amount)}</td>
                          <td className="py-2 px-2 whitespace-nowrap text-muted-foreground">{tx.currency}</td>
                          <td className={`py-2 px-2 whitespace-nowrap font-medium ${txStatusColor[tx.status] ?? "text-muted-foreground"}`}>{tx.status}</td>
                          <td className="py-2 px-2 max-w-[120px] truncate text-muted-foreground">{tx.note ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminUserPortal() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [adjustUser, setAdjustUser] = useState<UserRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.first_name ?? "").toLowerCase().includes(q) ||
      (u.last_name ?? "").toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.country ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchKyc = kycFilter === "all" || u.kyc_status === kycFilter;
    return matchSearch && matchStatus && matchKyc;
  });

  const handleStatusChange = async (user: UserRow, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", user.id);
      if (error) throw error;
      setUsers(us => us.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser(u => u ? { ...u, status: newStatus } : u);
      toast.success(`User ${newStatus === "active" ? "activated" : "suspended"}`);
    } catch {
      toast.error("Failed to update user status");
    }
  };

  // Summary stats
  const totalBTC = users.reduce((s, u) => s + u.btc_balance, 0);
  const activeCount = users.filter(u => u.status === "active").length;
  const kycApproved = users.filter(u => u.kyc_status === "approved").length;

  const openDetail = (user: UserRow) => { setSelectedUser(user); setDetailOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">User Portal</h2>
            <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `${users.length} total users`}</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: loading ? null : users.length.toString(), icon: Users, color: "text-primary" },
            { label: "Active Users", value: loading ? null : activeCount.toString(), icon: UserCheck, color: "text-success" },
            { label: "KYC Approved", value: loading ? null : kycApproved.toString(), icon: Shield, color: "text-info" },
            { label: "Total BTC Held", value: loading ? null : `${fmt(totalBTC)} ₿`, icon: Wallet, color: "text-primary" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-card border-border h-full">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                {kpi.value === null
                  ? <Skeleton className="h-6 w-24 bg-muted" />
                  : <p className="text-xl font-bold font-mono text-foreground">{kpi.value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, country…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All KYC</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="not_submitted">Not Submitted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["User", "Country", "Status", "KYC", "BTC Balance", "Deposits", "Withdrawals", "Contracts", "Last Login", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="py-3 px-3"><Skeleton className="h-4 w-20 bg-muted" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-muted-foreground">No users found</td>
                    </tr>
                  ) : filtered.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-medium text-foreground">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-xs">{u.country || "—"}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge className={`text-xs ${statusBadge[u.status] ?? "bg-muted text-muted-foreground"}`}>{u.status}</Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge className={`text-xs ${kycBadge[u.kyc_status] ?? "bg-muted text-muted-foreground"}`}>{u.kyc_status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-3 px-3 font-mono text-primary whitespace-nowrap">{fmt(u.btc_balance)} ₿</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-success">
                          <ArrowDownToLine className="w-3 h-3" />
                          <span className="font-mono text-xs">{u.deposit_count}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-warning">
                          <ArrowUpFromLine className="w-3 h-3" />
                          <span className="font-mono text-xs">{u.withdrawal_count}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground whitespace-nowrap text-xs">{u.contract_count}</td>
                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-xs">{fmtDate(u.last_login_at)}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1 px-2"
                            onClick={() => openDetail(u)}
                          >
                            <Eye className="w-3 h-3" />View
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-7 gap-1 px-2 bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => { setAdjustUser(u); }}
                          >
                            <Wallet className="w-3 h-3" />Adjust
                          </Button>
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

      {/* User Detail Panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedUser(null); }}
          onAdjust={() => { setDetailOpen(false); setAdjustUser(selectedUser); }}
          onStatusChange={s => handleStatusChange(selectedUser, s)}
        />
      )}

      {/* Balance Adjust Modal */}
      {adjustUser && (
        <BalanceModal
          user={adjustUser}
          open={!!adjustUser}
          onClose={() => setAdjustUser(null)}
          onSuccess={load}
        />
      )}
    </AdminLayout>
  );
}
