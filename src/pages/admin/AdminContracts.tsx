import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  getContractTemplates, createContractTemplate, updateContractTemplate,
  deleteContractTemplate, duplicateContractTemplate, type ContractTemplate,
} from "@/lib/api";
import { useMiningStats, estimateDailyBtc } from "@/hooks/useMiningStats";
import {
  Search, Plus, Edit, ToggleLeft, ToggleRight, Trash2, Copy, Star,
  Eye, RefreshCw, Archive, ArrowUp, ArrowDown, ChevronDown, Hash,
  DollarSign, Settings, BarChart3, Package, Image, Globe, Calculator,
  Wifi, WifiOff, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active:   "bg-success/10 text-success border-success/20",
  draft:    "bg-muted text-muted-foreground border-border",
  archived: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
};
const HASHRATE_UNITS = ["TH/s", "PH/s", "EH/s", "GH/s", "MH/s", "KH/s"];
const ALGORITHMS     = ["SHA-256", "Scrypt", "KHeavyHash", "Ethash", "X11", "Equihash", "RandomX", "Blake3"];
const COINS          = ["Bitcoin", "Litecoin", "Kaspa", "Dogecoin", "Monero", "Ethereum Classic", "Zcash", "Dash"];
const BADGE_OPTIONS  = [
  { value: "", label: "None" },
  { value: "most_popular", label: "Most Popular" },
  { value: "best_value", label: "Best Value" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New" },
  { value: "limited", label: "Limited" },
];

// Convert any hashrate unit to TH/s for calculations
function toThPerSec(value: number, unit: string): number {
  switch (unit) {
    case "EH/s": return value * 1e6;
    case "PH/s": return value * 1e3;
    case "TH/s": return value;
    case "GH/s": return value / 1e3;
    case "MH/s": return value / 1e6;
    case "KH/s": return value / 1e9;
    default:     return value;
  }
}

// Auto-derive weekly/monthly/annual/btc-production from daily reward + duration
function deriveRewards(daily: number, duration: number, isLifetime: boolean, btcPrice: number) {
  const d = daily > 0 ? daily : 0;
  const effectiveDuration = isLifetime ? 365 : (duration > 0 ? duration : 30);
  return {
    weekly:     Number((d * 7).toFixed(8)),
    monthly:    Number((d * 30).toFixed(8)),
    annual:     Number((d * 365).toFixed(8)),
    total:      Number((d * effectiveDuration).toFixed(8)),
    usd:        Number((d * effectiveDuration * btcPrice).toFixed(2)),
  };
}

const DEFAULT_TEMPLATE: Omit<ContractTemplate, "id" | "created_at" | "updated_at"> = {
  name: "", display_name: "", slug: "", description: null, short_description: null,
  coin: "Bitcoin", algorithm: "SHA-256", hashrate: 100, hashrate_unit: "TH/s",
  mining_pool: null, mining_farm: null, hardware: null, duration: 30, is_lifetime: false,
  estimated_daily_reward: 0, estimated_monthly_reward: 0, estimated_annual_reward: 0,
  reward_method: "fixed", maintenance_fee: 0.0028, electricity_fee: 0, pool_fee: 0,
  price: 0, discount_price: null, promotional_price: null, currency: "USD",
  tax: 0, min_purchase: 1, max_purchase: 100,
  estimated_btc_production: 0, estimated_usd_value: 0, network_difficulty_multiplier: 1,
  pool_efficiency: 98, hardware_efficiency: 100,
  available_capacity: 1000, remaining_capacity: 1000, max_per_user: 10,
  status: "draft", visibility: "public", featured: false, badge: null,
  image_url: null, banner_url: null, seo_title: null, meta_description: null,
  keywords: null, canonical_url: null, notes: null, sort_order: 0,
};

type FormState = Omit<ContractTemplate, "id" | "created_at" | "updated_at">;

function FormField({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function NumericInput({ value, onChange, step, min, placeholder, className }: { value: number | null; onChange: (v: number | null) => void; step?: number; min?: number; placeholder?: string; className?: string }) {
  return (
    <Input
      type="number"
      className={className}
      step={step ?? 1}
      min={min ?? 0}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={e => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
    />
  );
}

export default function AdminContracts() {
  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>({ ...DEFAULT_TEMPLATE });
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContractTemplate | null>(null);
  const [previewOpen, setPreviewOpen]   = useState(false);
  const [previewData, setPreviewData]   = useState<FormState | null>(null);
  const [autoCalcEnabled, setAutoCalcEnabled] = useState(true);

  // Live stats: BTC price, network difficulty, pools, farms
  const { stats: liveStats, pools, farms } = useMiningStats();

  // ── Auto-calculation: whenever daily reward, duration, or BTC price changes ──
  const prevDailyRef = useRef<number>(0);
  useEffect(() => {
    if (!autoCalcEnabled || !sheetOpen) return;
    const daily    = form.estimated_daily_reward ?? 0;
    const duration = form.is_lifetime ? 365 : (form.duration ?? 30);
    const btcPrice = liveStats.btcPrice;

    // Only recalc when these inputs actually changed
    const derived = deriveRewards(daily, duration, form.is_lifetime, btcPrice);
    setForm(f => ({
      ...f,
      estimated_monthly_reward: derived.monthly,
      estimated_annual_reward:  derived.annual,
      estimated_btc_production: derived.total,
      estimated_usd_value:      derived.usd,
    }));
    prevDailyRef.current = daily;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.estimated_daily_reward, form.duration, form.is_lifetime, liveStats.btcPrice, autoCalcEnabled, sheetOpen]);

  // ── Auto-suggest daily reward from hashrate + live difficulty ─────────────
  const suggestDailyFromHashrate = useCallback(() => {
    const thPerSec = toThPerSec(form.hashrate, form.hashrate_unit);
    const difficulty = liveStats.networkDifficulty;
    if (thPerSec > 0 && difficulty > 0) {
      const suggested = estimateDailyBtc(thPerSec, difficulty, liveStats.blockReward);
      // Apply pool efficiency factor
      const efficiency = (form.pool_efficiency ?? 98) / 100;
      const final = Number((suggested * efficiency).toFixed(8));
      setForm(f => ({ ...f, estimated_daily_reward: final }));
      toast.success(`Daily reward auto-calculated: ${final.toFixed(8)} BTC (based on live difficulty ${difficulty.toFixed(1)}T)`);
    } else {
      toast.error("Enter hashrate and ensure live difficulty is loaded.");
    }
  }, [form.hashrate, form.hashrate_unit, form.pool_efficiency, liveStats.networkDifficulty, liveStats.blockReward]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setContracts(await getContractTemplates()); }
    catch { toast.error("Failed to load contracts."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_TEMPLATE, sort_order: contracts.length });
    setSheetOpen(true);
  };

  const openEdit = (c: ContractTemplate) => {
    setEditingId(c.id);
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = c;
    setForm(rest as FormState);
    setSheetOpen(true);
  };

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Contract name is required."); return; }
    if (!form.slug.trim()) { toast.error("Slug is required."); return; }
    if (form.price <= 0) { toast.error("Price must be greater than 0."); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateContractTemplate(editingId, form);
        setContracts(cs => cs.map(c => c.id === editingId ? { ...c, ...form, id: c.id, created_at: c.created_at, updated_at: new Date().toISOString() } : c));
        toast.success("Contract updated.");
      } else {
        const created = await createContractTemplate(form);
        setContracts(cs => [created, ...cs]);
        toast.success("Contract created.");
      }
      setSheetOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (c: ContractTemplate) => {
    try {
      const dup = await duplicateContractTemplate(c.id);
      setContracts(cs => [...cs, dup]);
      toast.success(`Duplicated as "${dup.name}".`);
    } catch { toast.error("Duplicate failed."); }
  };

  const handleToggleStatus = async (c: ContractTemplate) => {
    const newStatus = c.status === "active" ? "inactive" : "active";
    try {
      await updateContractTemplate(c.id, { status: newStatus });
      setContracts(cs => cs.map(x => x.id === c.id ? { ...x, status: newStatus } : x));
      toast.success(`Contract ${newStatus === "active" ? "enabled" : "disabled"}.`);
    } catch { toast.error("Failed to update status."); }
  };

  const handleToggleFeatured = async (c: ContractTemplate) => {
    const featured = !c.featured;
    try {
      await updateContractTemplate(c.id, { featured });
      setContracts(cs => cs.map(x => x.id === c.id ? { ...x, featured } : x));
      toast.success(featured ? "Marked as featured." : "Removed from featured.");
    } catch { toast.error("Failed."); }
  };

  const handleArchive = async (c: ContractTemplate) => {
    try {
      await updateContractTemplate(c.id, { status: "archived" });
      setContracts(cs => cs.map(x => x.id === c.id ? { ...x, status: "archived" } : x));
      toast.success("Contract archived.");
    } catch { toast.error("Failed."); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteContractTemplate(deleteTarget.id);
      setContracts(cs => cs.filter(c => c.id !== deleteTarget.id));
      toast.success("Contract deleted.");
    } catch { toast.error("Delete failed."); }
    finally { setDeleteTarget(null); }
  };

  const moveOrder = async (c: ContractTemplate, dir: -1 | 1) => {
    const sorted = [...contracts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(x => x.id === c.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      updateContractTemplate(c.id, { sort_order: swap.sort_order }),
      updateContractTemplate(swap.id, { sort_order: c.sort_order }),
    ]);
    setContracts(cs => cs.map(x => {
      if (x.id === c.id) return { ...x, sort_order: swap.sort_order };
      if (x.id === swap.id) return { ...x, sort_order: c.sort_order };
      return x;
    }));
  };

  const filtered = contracts
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.coin.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Contract Management</h2>
            <p className="text-sm text-muted-foreground">{contracts.length} contract templates in database</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={load}><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
            <Button size="sm" className="h-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}><Plus className="w-4 h-4" />New Contract</Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
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
                    {["Order", "Contract", "Hashrate", "Duration", "Price", "Availability", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-16" /></td>
                      ))}
                    </tr>
                  )) : filtered.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveOrder(c, -1)}><ArrowUp className="w-3 h-3" /></Button>
                          <span className="text-xs font-mono text-muted-foreground w-4 text-center">{c.sort_order}</span>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveOrder(c, 1)}><ArrowDown className="w-3 h-3" /></Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {c.featured && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                          <div>
                            <p className="font-medium text-foreground">{c.display_name}</p>
                            <p className="text-xs text-muted-foreground">{c.coin} · {c.algorithm}</p>
                          </div>
                          {c.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs ml-1">{c.badge.replace("_", " ")}</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{c.hashrate} {c.hashrate_unit}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{c.is_lifetime ? "Lifetime" : `${c.duration}d`}</td>
                      <td className="py-3 px-4 font-mono text-primary whitespace-nowrap">
                        ${c.price.toLocaleString()}
                        {c.discount_price && <span className="ml-1 text-xs line-through text-muted-foreground">${c.discount_price.toLocaleString()}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{c.remaining_capacity} / {c.available_capacity}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs border ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>{c.status}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit" onClick={() => openEdit(c)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={c.featured ? "Unfeature" : "Feature"} onClick={() => handleToggleFeatured(c)}>
                            <Star className={`w-3.5 h-3.5 ${c.featured ? "text-amber-400 fill-amber-400" : ""}`} />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title={c.status === "active" ? "Disable" : "Enable"} onClick={() => handleToggleStatus(c)}>
                            {c.status === "active" ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Preview" onClick={() => { const { id: _, created_at: __, updated_at: ___, ...rest } = c; setPreviewData(rest as FormState); setPreviewOpen(true); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Duplicate" onClick={() => handleDuplicate(c)}><Copy className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" title="Archive" onClick={() => handleArchive(c)}><Archive className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Delete" onClick={() => setDeleteTarget(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No contracts found. Create your first contract.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Builder Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
            <SheetTitle>{editingId ? "Edit Contract" : "Create New Contract"}</SheetTitle>
          </SheetHeader>
          <div className="p-6">
            <Tabs defaultValue="general">
              <TabsList className="w-full grid grid-cols-4 md:grid-cols-8 h-auto mb-6 gap-1 bg-muted p-1">
                {[
                  { val: "general", icon: <Settings className="w-3.5 h-3.5" />, label: "General" },
                  { val: "mining", icon: <Hash className="w-3.5 h-3.5" />, label: "Mining" },
                  { val: "pricing", icon: <DollarSign className="w-3.5 h-3.5" />, label: "Pricing" },
                  { val: "performance", icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Perf." },
                  { val: "availability", icon: <Package className="w-3.5 h-3.5" />, label: "Avail." },
                  { val: "media", icon: <Image className="w-3.5 h-3.5" />, label: "Media" },
                  { val: "seo", icon: <Globe className="w-3.5 h-3.5" />, label: "SEO" },
                  { val: "advanced", icon: <ChevronDown className="w-3.5 h-3.5" />, label: "More" },
                ].map(t => (
                  <TabsTrigger key={t.val} value={t.val} className="flex items-center gap-1 text-xs px-2 py-1.5 h-auto">
                    {t.icon}<span className="hidden md:inline">{t.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Contract Name *" className="col-span-2">
                    <Input value={form.name} onChange={e => { set("name", e.target.value); if (!editingId) set("slug", slugify(e.target.value)); if (!form.display_name || form.display_name === form.name) set("display_name", e.target.value); }} placeholder="Starter SHA-256" />
                  </FormField>
                  <FormField label="Display Name *">
                    <Input value={form.display_name} onChange={e => set("display_name", e.target.value)} placeholder="Displayed to users" />
                  </FormField>
                  <FormField label="Slug *">
                    <Input value={form.slug} onChange={e => set("slug", slugify(e.target.value))} placeholder="starter-sha256" className="font-mono text-xs" />
                  </FormField>
                  <FormField label="Short Description" className="col-span-2">
                    <Input value={form.short_description ?? ""} onChange={e => set("short_description", e.target.value || null)} placeholder="One-line summary for cards" />
                  </FormField>
                  <FormField label="Description" className="col-span-2">
                    <Textarea value={form.description ?? ""} onChange={e => set("description", e.target.value || null)} rows={4} placeholder="Full contract description..." />
                  </FormField>
                  <FormField label="Status">
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Visibility">
                    <Select value={form.visibility} onValueChange={v => set("visibility", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Badge">
                    <Select value={form.badge ?? ""} onValueChange={v => set("badge", v || null)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BADGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Featured">
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={form.featured} onCheckedChange={v => set("featured", v)} />
                      <span className="text-sm text-muted-foreground">Show on featured section</span>
                    </div>
                  </FormField>
                </div>
              </TabsContent>

              {/* Mining Tab */}
              <TabsContent value="mining" className="space-y-4 mt-0">
                {/* Live Network Stats Bar */}
                <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border border-border text-xs">
                  <div className="flex items-center gap-1.5">
                    {liveStats.loading ? <WifiOff className="w-3 h-3 text-muted-foreground" /> : <Wifi className="w-3 h-3 text-success" />}
                    <span className="text-muted-foreground">BTC Price:</span>
                    <span className="font-mono font-bold text-primary">${liveStats.btcPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span className="font-mono font-bold text-foreground">{liveStats.networkDifficulty.toFixed(1)}T</span>
                    {liveStats.difficultyChange !== 0 && (
                      <span className={`font-mono ${liveStats.difficultyChange > 0 ? "text-destructive" : "text-success"}`}>
                        ({liveStats.difficultyChange > 0 ? "+" : ""}{liveStats.difficultyChange.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-mono font-bold text-foreground">{liveStats.networkHashrate.toFixed(0)} EH/s</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Block Reward:</span>
                    <span className="font-mono font-bold text-foreground">{liveStats.blockReward} BTC</span>
                  </div>
                  {liveStats.lastUpdated && (
                    <span className="text-muted-foreground ml-auto">
                      Updated {liveStats.lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Coin">
                    <Select value={form.coin} onValueChange={v => set("coin", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COINS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Algorithm">
                    <Select value={form.algorithm} onValueChange={v => set("algorithm", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ALGORITHMS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Hashrate">
                    <NumericInput value={form.hashrate} onChange={v => set("hashrate", v ?? 0)} step={1} />
                  </FormField>
                  <FormField label="Hashrate Unit">
                    <Select value={form.hashrate_unit} onValueChange={v => set("hashrate_unit", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{HASHRATE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Duration (days)">
                    <NumericInput value={form.duration} onChange={v => set("duration", v ?? 30)} step={1} />
                  </FormField>
                  <FormField label="Lifetime Contract">
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={form.is_lifetime} onCheckedChange={v => set("is_lifetime", v)} />
                      <span className="text-sm text-muted-foreground">No expiry date</span>
                    </div>
                  </FormField>

                  {/* Mining Pool selector (from DB) */}
                  <FormField label="Mining Pool" className="col-span-2">
                    <Select
                      value={form.mining_pool ?? "none"}
                      onValueChange={v => set("mining_pool", v === "none" ? null : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a pool…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {pools
                          .filter(p => p.algorithm === form.algorithm || p.algorithm === "SHA-256")
                          .map(p => (
                            <SelectItem key={p.id} value={p.name}>
                              {p.name} — {p.fee}% fee · {p.uptime}% uptime · {p.hashrate_eh.toFixed(0)} EH/s
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Mining Farm selector (from DB) */}
                  <FormField label="Mining Farm" className="col-span-2">
                    <Select
                      value={form.mining_farm ?? "none"}
                      onValueChange={v => set("mining_farm", v === "none" ? null : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a farm…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {farms.map(f => (
                          <SelectItem key={f.id} value={f.name}>
                            {f.flag} {f.name} ({f.country}) — {f.uptime}% uptime · {f.power_source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Hardware" className="col-span-2">
                    <Input value={form.hardware ?? ""} onChange={e => set("hardware", e.target.value || null)} placeholder="e.g. Bitmain Antminer S21 XP" />
                  </FormField>
                  <FormField label="Maintenance Fee (BTC/TH/day)">
                    <NumericInput value={form.maintenance_fee} onChange={v => set("maintenance_fee", v ?? 0)} step={0.0001} />
                  </FormField>
                  <FormField label="Electricity Fee">
                    <NumericInput value={form.electricity_fee} onChange={v => set("electricity_fee", v ?? 0)} step={0.0001} />
                  </FormField>
                  <FormField label="Pool Fee (%)">
                    <NumericInput value={form.pool_fee} onChange={v => set("pool_fee", v ?? 0)} step={0.1} />
                  </FormField>
                  <FormField label="Reward Method">
                    <Select value={form.reward_method} onValueChange={v => set("reward_method", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="dynamic">Dynamic (Network)</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* ── Smart Reward Calculator ─────────────────────────────── */}
                <div className="border border-primary/20 rounded-lg p-4 space-y-4 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Smart Reward Calculator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={autoCalcEnabled} onCheckedChange={setAutoCalcEnabled} />
                      <span className="text-xs text-muted-foreground">Auto-calculate</span>
                    </div>
                  </div>

                  {/* Auto-suggest from hashrate */}
                  <div className="flex items-center gap-2 p-2 bg-muted/40 rounded border border-border">
                    <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">
                      Auto-estimate daily reward from your hashrate ({form.hashrate} {form.hashrate_unit}) using live difficulty ({liveStats.networkDifficulty.toFixed(1)}T)
                    </span>
                    <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={suggestDailyFromHashrate}>
                      Suggest
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* PRIMARY INPUT: Daily Reward */}
                    <FormField
                      label="★ Est. Daily Reward (BTC) — Primary Input"
                      className="col-span-2"
                      hint="All other reward fields are auto-calculated from this value. Change this to update everything."
                    >
                      <NumericInput
                        value={form.estimated_daily_reward}
                        onChange={v => set("estimated_daily_reward", v ?? 0)}
                        step={0.000001}
                        placeholder="e.g. 0.000250"
                        className="font-mono border-primary/40 focus:border-primary"
                      />
                    </FormField>

                    {/* READ-ONLY derived fields */}
                    <FormField label="Weekly Reward (auto)" hint="Daily × 7">
                      <Input
                        readOnly
                        value={((form.estimated_daily_reward ?? 0) * 7).toFixed(8)}
                        className="font-mono bg-muted/30 text-muted-foreground cursor-default"
                      />
                    </FormField>
                    <FormField label="Monthly Reward (auto)" hint="Daily × 30">
                      <Input
                        readOnly
                        value={(form.estimated_monthly_reward ?? 0).toFixed(8)}
                        className="font-mono bg-muted/30 text-muted-foreground cursor-default"
                      />
                    </FormField>
                    <FormField label="Annual Reward (auto)" hint="Daily × 365">
                      <Input
                        readOnly
                        value={(form.estimated_annual_reward ?? 0).toFixed(8)}
                        className="font-mono bg-muted/30 text-muted-foreground cursor-default"
                      />
                    </FormField>
                    <FormField
                      label="Total BTC Production (auto)"
                      hint={`Daily × ${form.is_lifetime ? "365 (lifetime)" : `${form.duration}d`} — read-only`}
                    >
                      <Input
                        readOnly
                        value={(form.estimated_btc_production ?? 0).toFixed(8)}
                        className="font-mono bg-muted/30 text-muted-foreground cursor-default"
                      />
                    </FormField>
                    <FormField
                      label="Est. USD Value (auto)"
                      hint={`Total BTC × $${liveStats.btcPrice.toLocaleString()} live price`}
                      className="col-span-2"
                    >
                      <Input
                        readOnly
                        value={`$${(form.estimated_usd_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="font-mono bg-muted/30 text-muted-foreground cursor-default"
                      />
                    </FormField>
                  </div>

                  {/* ROI summary */}
                  {form.price > 0 && (form.estimated_usd_value ?? 0) > 0 && (
                    <div className="p-3 bg-muted/20 rounded border border-border text-xs space-y-1">
                      <p className="font-semibold text-foreground">Estimated ROI Summary <span className="text-muted-foreground font-normal">(display only, not guaranteed)</span></p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          ["Contract Cost",  `$${form.price.toLocaleString()}`],
                          ["Est. Total Return", `$${(form.estimated_usd_value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
                          ["Est. ROI",       `${(((form.estimated_usd_value ?? 0) - form.price) / form.price * 100).toFixed(1)}%`],
                        ].map(([k, v]) => (
                          <div key={k} className="bg-card rounded p-2 text-center">
                            <p className="text-muted-foreground">{k}</p>
                            <p className="font-mono font-bold text-foreground">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Purchase Price ($) *">
                    <NumericInput value={form.price} onChange={v => set("price", v ?? 0)} step={0.01} />
                  </FormField>
                  <FormField label="Currency">
                    <Select value={form.currency} onValueChange={v => set("currency", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Discount Price ($)">
                    <NumericInput value={form.discount_price} onChange={v => set("discount_price", v)} step={0.01} placeholder="Optional" />
                  </FormField>
                  <FormField label="Promotional Price ($)">
                    <NumericInput value={form.promotional_price} onChange={v => set("promotional_price", v)} step={0.01} placeholder="Optional" />
                  </FormField>
                  <FormField label="Tax (%)">
                    <NumericInput value={form.tax} onChange={v => set("tax", v ?? 0)} step={0.1} />
                  </FormField>
                  <FormField label="Min Purchase (units)">
                    <NumericInput value={form.min_purchase} onChange={v => set("min_purchase", v ?? 1)} step={1} min={1} />
                  </FormField>
                  <FormField label="Max Purchase (units)">
                    <NumericInput value={form.max_purchase} onChange={v => set("max_purchase", v ?? 100)} step={1} min={1} />
                  </FormField>
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4 mt-0">
                <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground mb-2">
                  BTC Production and USD Value are auto-calculated in the Mining tab. Use the fields below for efficiency tuning only.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Est. BTC Production (auto)" hint="Daily × duration — set in Mining tab">
                    <Input readOnly value={(form.estimated_btc_production ?? 0).toFixed(8)} className="font-mono bg-muted/30 text-muted-foreground cursor-default" />
                  </FormField>
                  <FormField label="Est. USD Value (auto)" hint={`At live BTC $${liveStats.btcPrice.toLocaleString()}`}>
                    <Input readOnly value={`$${(form.estimated_usd_value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="font-mono bg-muted/30 text-muted-foreground cursor-default" />
                  </FormField>
                  <FormField label="Network Difficulty Multiplier" hint="1.0 = current difficulty; use >1 for conservative estimates">
                    <NumericInput value={form.network_difficulty_multiplier} onChange={v => set("network_difficulty_multiplier", v ?? 1)} step={0.01} />
                  </FormField>
                  <FormField label="Pool Efficiency (%)">
                    <NumericInput value={form.pool_efficiency} onChange={v => set("pool_efficiency", v ?? 98)} step={0.1} />
                  </FormField>
                  <FormField label="Hardware Efficiency (%)">
                    <NumericInput value={form.hardware_efficiency} onChange={v => set("hardware_efficiency", v ?? 100)} step={0.1} />
                  </FormField>
                </div>
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Available Capacity">
                    <NumericInput value={form.available_capacity} onChange={v => set("available_capacity", v ?? 1000)} step={1} />
                  </FormField>
                  <FormField label="Remaining Capacity">
                    <NumericInput value={form.remaining_capacity} onChange={v => set("remaining_capacity", v ?? 1000)} step={1} />
                  </FormField>
                  <FormField label="Max Contracts Per User">
                    <NumericInput value={form.max_per_user} onChange={v => set("max_per_user", v ?? 10)} step={1} min={1} />
                  </FormField>
                </div>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Contract Image URL">
                    <Input value={form.image_url ?? ""} onChange={e => set("image_url", e.target.value || null)} placeholder="https://..." className="font-mono text-xs" />
                    {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 rounded border border-border w-full max-h-40 object-cover" />}
                  </FormField>
                  <FormField label="Banner Image URL">
                    <Input value={form.banner_url ?? ""} onChange={e => set("banner_url", e.target.value || null)} placeholder="https://..." className="font-mono text-xs" />
                    {form.banner_url && <img src={form.banner_url} alt="banner preview" className="mt-2 rounded border border-border w-full max-h-24 object-cover" />}
                  </FormField>
                </div>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="SEO Title">
                    <Input value={form.seo_title ?? ""} onChange={e => set("seo_title", e.target.value || null)} placeholder="Custom page title for search engines" />
                  </FormField>
                  <FormField label="Meta Description">
                    <Textarea value={form.meta_description ?? ""} onChange={e => set("meta_description", e.target.value || null)} rows={3} placeholder="150-160 characters recommended" />
                  </FormField>
                  <FormField label="Keywords">
                    <Input value={form.keywords ?? ""} onChange={e => set("keywords", e.target.value || null)} placeholder="bitcoin mining, cloud mining, SHA-256" />
                  </FormField>
                  <FormField label="Canonical URL">
                    <Input value={form.canonical_url ?? ""} onChange={e => set("canonical_url", e.target.value || null)} placeholder="https://btcminer.online/marketplace/..." className="font-mono text-xs" />
                  </FormField>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Sort Order">
                    <NumericInput value={form.sort_order} onChange={v => set("sort_order", v ?? 0)} step={1} />
                  </FormField>
                  <FormField label="Internal Notes" className="col-span-2">
                    <Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value || null)} rows={4} placeholder="Admin-only notes (not shown to users)..." />
                  </FormField>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => { setPreviewData(null); setPreviewOpen(true); }}
                disabled={saving}
              >
                <Eye className="w-4 h-4" />Preview
              </Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Saving…</> : editingId ? "Save Changes" : "Create Contract"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Preview Sheet — with live stats */}
      <Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
        <SheetContent side="right" className="w-full max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Eye className="w-4 h-4" />Contract Preview</SheetTitle>
          </SheetHeader>
          {(() => {
            const p = previewData ?? (sheetOpen ? form : null);
            if (!p) return null;
            const effectivePrice = p.promotional_price ?? p.price;
            const dailyBTC = p.estimated_daily_reward > 0 ? p.estimated_daily_reward : 0;
            const duration = p.is_lifetime ? 365 : (p.duration ?? 30);
            const totalBtc = dailyBTC * duration;
            const roiPct   = p.price > 0 ? (((totalBtc * liveStats.btcPrice) - p.price) / p.price * 100) : 0;
            return (
              <div className="mt-4 space-y-4">
                {/* Live stats bar */}
                <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded border border-border text-xs">
                  <span className="text-muted-foreground">BTC:</span>
                  <span className="font-mono font-bold text-primary">${liveStats.btcPrice.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">Difficulty:</span>
                  <span className="font-mono font-bold text-foreground">{liveStats.networkDifficulty.toFixed(1)}T</span>
                  <span className="text-muted-foreground ml-2">Network:</span>
                  <span className="font-mono font-bold text-foreground">{liveStats.networkHashrate.toFixed(0)} EH/s</span>
                  {liveStats.lastUpdated && (
                    <span className="text-muted-foreground ml-auto">{liveStats.lastUpdated.toLocaleTimeString()}</span>
                  )}
                </div>

                <div className="border border-border rounded-xl p-5 bg-card space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-lg">{p.display_name || "Contract Name"}</h3>
                        {p.featured && <Badge className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-xs">Featured</Badge>}
                        {p.badge && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{p.badge.replace("_", " ")}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.coin} · {p.algorithm}</p>
                    </div>
                    <Badge className={`text-xs border shrink-0 ${STATUS_COLORS[p.status] ?? ""}`}>{p.status}</Badge>
                  </div>
                  {p.short_description && <p className="text-sm text-muted-foreground">{p.short_description}</p>}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Hashrate",    `${p.hashrate} ${p.hashrate_unit}`],
                      ["Duration",   p.is_lifetime ? "Lifetime" : `${p.duration} days`],
                      ["Hardware",   p.hardware ?? "—"],
                      ["Pool Fee",   `${p.pool_fee}%`],
                      ["Pool",       p.mining_pool ?? "—"],
                      ["Farm",       p.mining_farm ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-muted-foreground">{k}</p>
                        <p className="font-medium text-foreground text-xs">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Estimated rewards grid */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Estimated Rewards <span className="italic">(not guaranteed)</span></p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        ["Daily",   dailyBTC.toFixed(6)],
                        ["Weekly",  (dailyBTC * 7).toFixed(6)],
                        ["Monthly", (dailyBTC * 30).toFixed(5)],
                        ["Total",   totalBtc.toFixed(5)],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-muted/40 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">{k}</p>
                          <p className="font-mono text-xs font-bold text-primary">{v}</p>
                          <p className="text-xs text-muted-foreground">BTC</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-muted/20 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Est. USD Value</p>
                        <p className="font-mono text-sm font-bold text-foreground">${(totalBtc * liveStats.btcPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="bg-muted/20 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Est. ROI</p>
                        <p className={`font-mono text-sm font-bold ${roiPct >= 0 ? "text-success" : "text-destructive"}`}>{roiPct >= 0 ? "+" : ""}{roiPct.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    {p.discount_price && <p className="text-xs line-through text-muted-foreground">${p.discount_price.toLocaleString()}</p>}
                    <p className="text-2xl font-bold text-primary">${effectivePrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{p.currency}</span></p>
                    <Button className="w-full mt-3 bg-primary text-primary-foreground" asChild>
                      <Link to="/register">Purchase Contract →</Link>
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">Preview only. Reward estimates are based on current network conditions and may change.</p>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone. Consider archiving instead.
            </AlertDialogDescription>
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
