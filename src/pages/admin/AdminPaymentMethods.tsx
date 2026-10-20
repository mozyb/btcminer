import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  getAllPaymentMethodsFull, createPaymentMethodFull, updatePaymentMethodFull,
  deletePaymentMethodRecord, type PaymentMethodFull,
} from "@/lib/api";
import {
  Plus, Pencil, RefreshCw, Trash2, ArrowDownToLine, ArrowUpFromLine,
  Zap, Clock, ToggleLeft, ToggleRight, ArrowUp, ArrowDown, Star,
  Settings, DollarSign, Shield, Globe,
} from "lucide-react";
import { toast } from "sonner";

// Popular crypto presets for quick-add
const CRYPTO_PRESETS = [
  { currency: "BTC",  display_name: "Bitcoin",          coin_symbol: "BTC", network_tag: "Bitcoin Network",   network: "Bitcoin Network" },
  { currency: "ETH",  display_name: "Ethereum",         coin_symbol: "ETH", network_tag: "ERC-20",            network: "ERC-20" },
  { currency: "USDT", display_name: "Tether (TRC-20)",  coin_symbol: "USDT",network_tag: "TRC-20",            network: "TRC-20" },
  { currency: "USDT", display_name: "Tether (ERC-20)",  coin_symbol: "USDT",network_tag: "ERC-20",            network: "ERC-20" },
  { currency: "USDT", display_name: "Tether (BEP-20)",  coin_symbol: "USDT",network_tag: "BEP-20",            network: "BEP-20" },
  { currency: "USDC", display_name: "USD Coin",         coin_symbol: "USDC",network_tag: "ERC-20",            network: "ERC-20" },
  { currency: "LTC",  display_name: "Litecoin",         coin_symbol: "LTC", network_tag: "Litecoin Network",  network: "Litecoin Network" },
  { currency: "DOGE", display_name: "Dogecoin",         coin_symbol: "DOGE",network_tag: "Dogecoin Network",  network: "Dogecoin Network" },
  { currency: "SOL",  display_name: "Solana",           coin_symbol: "SOL", network_tag: "Solana Network",    network: "Solana Network" },
  { currency: "TRX",  display_name: "TRON",             coin_symbol: "TRX", network_tag: "TRON Network",      network: "TRON Network" },
  { currency: "BNB",  display_name: "BNB Chain",        coin_symbol: "BNB", network_tag: "BSC Network",       network: "BSC Network", memo_supported: true, memo_label: "Memo" },
  { currency: "XRP",  display_name: "Ripple",           coin_symbol: "XRP", network_tag: "XRP Ledger",        network: "XRP Ledger", memo_supported: true, memo_label: "Destination Tag" },
  { currency: "KAS",  display_name: "Kaspa",            coin_symbol: "KAS", network_tag: "Kaspa Network",     network: "Kaspa Network" },
  { currency: "XMR",  display_name: "Monero",           coin_symbol: "XMR", network_tag: "Monero Network",    network: "Monero Network" },
  { currency: "CUSTOM", display_name: "Custom",         coin_symbol: "",    network_tag: "",                  network: "" },
];

const EMPTY_FORM: Omit<PaymentMethodFull, "id" | "created_at" | "updated_at"> = {
  currency: "BTC", coin_symbol: "BTC", direction: "deposit", mode: "manual",
  display_name: "Bitcoin", instructions: null, admin_address: null,
  network_tag: "Bitcoin Network", network: "Bitcoin Network",
  logo_url: null, description: null, memo_supported: false, memo_label: null,
  is_active: true, is_featured: false, is_recommended: false, is_maintenance: false,
  sort_order: 0, min_deposit: 0, max_deposit: null, min_withdrawal: 0,
  max_withdrawal: null, daily_limit: null, deposit_fee: 0, withdrawal_fee: 0,
  network_fee: 0, required_confirmations: 1, auto_deposit: false, auto_withdrawal: false,
  api_provider: null, api_endpoint: null, webhook_url: null, extra_addresses: [],
};

type FormState = Omit<PaymentMethodFull, "id" | "created_at" | "updated_at">;

function FField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function NumInput({ value, onChange, step, placeholder }: { value: number | null; onChange: (v: number | null) => void; step?: number; placeholder?: string }) {
  return (
    <Input type="number" step={step ?? 1} min={0} placeholder={placeholder} value={value ?? ""}
      onChange={e => onChange(e.target.value === "" ? null : parseFloat(e.target.value))} />
  );
}

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethodFull | null>(null);
  const [dirFilter, setDirFilter] = useState<"all" | "deposit" | "withdrawal">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setMethods(await getAllPaymentMethodsFull()); }
    catch { toast.error("Failed to load payment methods"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setForm(f => ({ ...f, [key]: val }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: methods.length });
    setSheetOpen(true);
  };

  const openEdit = (m: PaymentMethodFull) => {
    setEditingId(m.id);
    const { id: _, created_at: __, updated_at: ___, ...rest } = m;
    setForm(rest as FormState);
    setSheetOpen(true);
  };

  const applyPreset = (preset: typeof CRYPTO_PRESETS[0]) => {
    setForm(f => ({
      ...f,
      currency: preset.currency,
      coin_symbol: preset.coin_symbol,
      display_name: `${preset.display_name}${preset.network_tag ? ` (${preset.network_tag})` : ""}`,
      network_tag: preset.network_tag,
      network: preset.network,
      memo_supported: preset.memo_supported ?? false,
      memo_label: preset.memo_label ?? null,
    }));
  };

  const handleSave = async () => {
    if (!form.currency.trim()) { toast.error("Currency is required."); return; }
    if (!form.display_name.trim()) { toast.error("Display name is required."); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updatePaymentMethodFull(editingId, form);
        setMethods(ms => ms.map(m => m.id === editingId ? { ...m, ...form, id: m.id, created_at: m.created_at, updated_at: new Date().toISOString() } : m));
        toast.success("Payment method updated.");
      } else {
        const created = await createPaymentMethodFull(form);
        setMethods(ms => [...ms, created]);
        toast.success("Payment method created.");
      }
      setSheetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaymentMethodRecord(deleteTarget.id);
      setMethods(ms => ms.filter(m => m.id !== deleteTarget.id));
      toast.success("Payment method deleted.");
    } catch { toast.error("Delete failed."); }
    finally { setDeleteTarget(null); }
  };

  const quickToggle = async (m: PaymentMethodFull, field: "is_active" | "is_featured" | "is_maintenance") => {
    const val = !m[field];
    try {
      await updatePaymentMethodFull(m.id, { [field]: val });
      setMethods(ms => ms.map(x => x.id === m.id ? { ...x, [field]: val } : x));
    } catch { toast.error("Update failed."); }
  };

  const quickToggleMode = async (m: PaymentMethodFull) => {
    const newMode = m.mode === "manual" ? "automatic" : "manual";
    try {
      await updatePaymentMethodFull(m.id, { mode: newMode });
      setMethods(ms => ms.map(x => x.id === m.id ? { ...x, mode: newMode } : x));
      toast.success(`${m.display_name} → ${newMode} mode.`);
    } catch { toast.error("Failed."); }
  };

  const moveOrder = async (m: PaymentMethodFull, dir: -1 | 1) => {
    const same = [...methods].filter(x => x.direction === m.direction).sort((a, b) => a.sort_order - b.sort_order);
    const idx = same.findIndex(x => x.id === m.id);
    const swap = same[idx + dir];
    if (!swap) return;
    await Promise.all([
      updatePaymentMethodFull(m.id, { sort_order: swap.sort_order }),
      updatePaymentMethodFull(swap.id, { sort_order: m.sort_order }),
    ]);
    setMethods(ms => ms.map(x => {
      if (x.id === m.id) return { ...x, sort_order: swap.sort_order };
      if (x.id === swap.id) return { ...x, sort_order: m.sort_order };
      return x;
    }));
  };

  const deposits    = methods.filter(m => m.direction === "deposit").sort((a, b) => a.sort_order - b.sort_order);
  const withdrawals = methods.filter(m => m.direction === "withdrawal").sort((a, b) => a.sort_order - b.sort_order);

  const renderTable = (items: PaymentMethodFull[], title: string, icon: React.ReactNode) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">{icon}{title}<span className="text-muted-foreground font-normal">({items.length})</span></CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted rounded" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Order", "Currency", "Name / Network", "Mode", "Wallet Address", "Active", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${m.is_maintenance ? "opacity-60" : ""}`}>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveOrder(m, -1)}><ArrowUp className="w-3 h-3" /></Button>
                        <span className="text-xs font-mono text-muted-foreground w-4 text-center">{m.sort_order}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveOrder(m, 1)}><ArrowDown className="w-3 h-3" /></Button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                      {m.coin_symbol ?? m.currency}
                      {m.is_maintenance && <Badge className="ml-1 bg-warning/10 text-warning border-warning/20 text-xs">Maint.</Badge>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {m.is_featured && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                        <div>
                          <p className="text-xs font-medium text-foreground">{m.display_name}</p>
                          {m.network_tag && <p className="text-xs text-muted-foreground">{m.network_tag}</p>}
                          {m.memo_supported && <p className="text-xs text-primary">Memo/Tag required</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button onClick={() => quickToggleMode(m)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:opacity-80 active:scale-95 ${m.mode === "manual" ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30"}`}>
                        {m.mode === "manual" ? <><ToggleLeft className="w-3.5 h-3.5" /><Clock className="w-3 h-3" />Manual</> : <><ToggleRight className="w-3.5 h-3.5" /><Zap className="w-3 h-3" />Auto</>}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap max-w-[160px] truncate">
                      {m.admin_address ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Switch checked={m.is_active} onCheckedChange={async v => { try { await updatePaymentMethodFull(m.id, { is_active: v }); setMethods(ms => ms.map(x => x.id === m.id ? { ...x, is_active: v } : x)); toast.success(`${m.display_name} ${v ? "enabled" : "disabled"}.`); } catch { toast.error("Failed."); } }} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={m.is_featured ? "Unfeature" : "Feature"} onClick={() => quickToggle(m, "is_featured")}>
                          <Star className={`w-3.5 h-3.5 ${m.is_featured ? "text-amber-400 fill-amber-400" : ""}`} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Delete" onClick={() => setDeleteTarget(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm">No {title.toLowerCase()} configured.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment Methods</h2>
            <p className="text-sm text-muted-foreground">{methods.length} methods configured — add unlimited cryptocurrencies</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={load}><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
            <Button size="sm" className="h-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}><Plus className="w-4 h-4" />Add Method</Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded text-sm">
          <div>
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1"><Clock className="w-3 h-3" />Manual</Badge>
              <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1"><Zap className="w-3 h-3" />Automatic</Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            <strong className="text-foreground">Manual</strong> — admin reviews each request.
            <strong className="text-foreground"> Automatic</strong> — payment gateway integration.
            Click the mode badge to quickly toggle.
          </p>
        </div>

        {(dirFilter === "all" || dirFilter === "deposit") && renderTable(deposits, "Deposit Methods", <ArrowDownToLine className="w-4 h-4 text-success" />)}
        {(dirFilter === "all" || dirFilter === "withdrawal") && renderTable(withdrawals, "Withdrawal Methods", <ArrowUpFromLine className="w-4 h-4 text-destructive" />)}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
            <SheetTitle>{editingId ? "Edit Payment Method" : "Add Payment Method"}</SheetTitle>
          </SheetHeader>
          <div className="p-6 space-y-6">
            {/* Quick preset selector (only for create) */}
            {!editingId && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Quick Preset</Label>
                <div className="flex flex-wrap gap-2">
                  {CRYPTO_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(p)}
                      className="px-2.5 py-1 rounded-full border border-border text-xs hover:bg-muted/50 font-mono transition-colors"
                    >
                      {p.coin_symbol || p.display_name}{p.network_tag && p.currency === "USDT" ? ` ${p.network_tag}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="general">
              <TabsList className="w-full grid grid-cols-4 h-auto gap-1 bg-muted p-1">
                {[
                  { val: "general", icon: <Settings className="w-3.5 h-3.5" />, label: "General" },
                  { val: "limits",  icon: <DollarSign className="w-3.5 h-3.5" />, label: "Limits" },
                  { val: "fees",    icon: <Shield className="w-3.5 h-3.5" />, label: "Fees" },
                  { val: "api",     icon: <Globe className="w-3.5 h-3.5" />, label: "API" },
                ].map(t => (
                  <TabsTrigger key={t.val} value={t.val} className="flex items-center gap-1 text-xs px-2 py-1.5 h-auto">
                    {t.icon}{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* General */}
              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FField label="Direction">
                    <Select value={form.direction} onValueChange={v => set("direction", v as "deposit" | "withdrawal")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  </FField>
                  <FField label="Currency Symbol">
                    <Input value={form.currency} onChange={e => set("currency", e.target.value.toUpperCase())} placeholder="BTC" className="font-mono" />
                  </FField>
                  <FField label="Coin Symbol">
                    <Input value={form.coin_symbol ?? ""} onChange={e => set("coin_symbol", e.target.value.toUpperCase() || null)} placeholder="BTC" className="font-mono" />
                  </FField>
                  <FField label="Display Name *">
                    <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="Bitcoin (BTC)" />
                  </FField>
                  <FField label="Network / Tag">
                    <Input value={form.network_tag ?? ""} onChange={e => set("network_tag", e.target.value || null)} placeholder="ERC-20, TRC-20…" />
                  </FField>
                  <FField label="Network Name">
                    <Input value={form.network ?? ""} onChange={e => set("network", e.target.value || null)} placeholder="Ethereum Network" />
                  </FField>
                  <FField label="Logo URL" className="col-span-2">
                    <Input value={form.logo_url ?? ""} onChange={e => set("logo_url", e.target.value || null)} placeholder="https://…" className="font-mono text-xs" />
                  </FField>
                  <FField label="Description" className="col-span-2">
                    <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value || null)} rows={2} placeholder="Short description shown to users" />
                  </FField>
                  <FField label="Wallet Address (shown to users)" className="col-span-2">
                    <Input value={form.admin_address ?? ""} onChange={e => set("admin_address", e.target.value || null)} className="font-mono text-xs" placeholder="Your receiving wallet address" />
                  </FField>
                  <FField label="Instructions" className="col-span-2">
                    <Textarea value={form.instructions ?? ""} onChange={e => set("instructions", e.target.value || null)} rows={3} placeholder="Step-by-step instructions for users" />
                  </FField>
                  <FField label="Processing Mode">
                    <Select value={form.mode} onValueChange={v => set("mode", v as "manual" | "automatic")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="automatic">Automatic</SelectItem>
                      </SelectContent>
                    </Select>
                  </FField>
                  <FField label="Required Confirmations">
                    <NumInput value={form.required_confirmations} onChange={v => set("required_confirmations", v ?? 1)} step={1} />
                  </FField>
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    {([["is_active", "Active (visible to users)"], ["is_featured", "Featured"], ["is_recommended", "Recommended"], ["is_maintenance", "Maintenance Mode"], ["memo_supported", "Memo / Tag Required"], ["auto_deposit", "Auto Deposit"], ["auto_withdrawal", "Auto Withdrawal"]] as [keyof FormState, string][]).map(([key, label]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Switch checked={!!(form[key] as boolean)} onCheckedChange={v => set(key, v)} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                    {form.memo_supported && (
                      <FField label="Memo/Tag Label" className="col-span-2">
                        <Input value={form.memo_label ?? ""} onChange={e => set("memo_label", e.target.value || null)} placeholder="e.g. Destination Tag" />
                      </FField>
                    )}
                  </div>
                  <FField label="Sort Order">
                    <NumInput value={form.sort_order} onChange={v => set("sort_order", v ?? 0)} step={1} />
                  </FField>
                </div>
              </TabsContent>

              {/* Limits */}
              <TabsContent value="limits" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FField label="Min Deposit"><NumInput value={form.min_deposit} onChange={v => set("min_deposit", v ?? 0)} step={0.001} /></FField>
                  <FField label="Max Deposit"><NumInput value={form.max_deposit} onChange={v => set("max_deposit", v)} step={0.001} placeholder="No limit" /></FField>
                  <FField label="Min Withdrawal"><NumInput value={form.min_withdrawal} onChange={v => set("min_withdrawal", v ?? 0)} step={0.001} /></FField>
                  <FField label="Max Withdrawal"><NumInput value={form.max_withdrawal} onChange={v => set("max_withdrawal", v)} step={0.001} placeholder="No limit" /></FField>
                  <FField label="Daily Limit" className="col-span-2"><NumInput value={form.daily_limit} onChange={v => set("daily_limit", v)} step={1} placeholder="No daily limit" /></FField>
                </div>
              </TabsContent>

              {/* Fees */}
              <TabsContent value="fees" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FField label="Deposit Fee"><NumInput value={form.deposit_fee} onChange={v => set("deposit_fee", v ?? 0)} step={0.001} /></FField>
                  <FField label="Withdrawal Fee"><NumInput value={form.withdrawal_fee} onChange={v => set("withdrawal_fee", v ?? 0)} step={0.001} /></FField>
                  <FField label="Network Fee" className="col-span-2"><NumInput value={form.network_fee} onChange={v => set("network_fee", v ?? 0)} step={0.0001} /></FField>
                </div>
              </TabsContent>

              {/* API */}
              <TabsContent value="api" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <FField label="API Provider"><Input value={form.api_provider ?? ""} onChange={e => set("api_provider", e.target.value || null)} placeholder="e.g. CoinPayments" /></FField>
                  <FField label="API Endpoint / RPC"><Input value={form.api_endpoint ?? ""} onChange={e => set("api_endpoint", e.target.value || null)} placeholder="https://api.provider.com/v1" className="font-mono text-xs" /></FField>
                  <FField label="Webhook URL"><Input value={form.webhook_url ?? ""} onChange={e => set("webhook_url", e.target.value || null)} placeholder="https://btcminer.online/api/webhook/..." className="font-mono text-xs" /></FField>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Saving…</> : editingId ? "Save Changes" : "Add Method"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>Delete <strong>{deleteTarget?.display_name}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
