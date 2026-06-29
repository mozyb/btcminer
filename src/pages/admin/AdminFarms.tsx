import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import {
  Plus, MapPin, Zap, Server, Activity, Pencil, Trash2,
  ToggleLeft, ToggleRight, RefreshCw, Search, Bitcoin,
  Thermometer, Wind, Globe, BarChart3, ChevronUp, ChevronDown,
  Wifi, WifiOff, TrendingUp, LayoutGrid, List, X,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MiningFarm {
  id: string;
  name: string;
  country: string;
  flag: string;
  capacity: number;
  capacity_unit: string;
  power_source: string;
  cooling: string;
  active_miners: number;
  online_miners: number;
  uptime: number;
  total_btc_mined: number;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_active: boolean;
}

type FarmFormData = Omit<MiningFarm, "id" | "total_btc_mined">;
type SortKey = "name" | "capacity" | "uptime" | "active_miners" | "total_btc_mined";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "list";

const EMPTY_FORM: FarmFormData = {
  name: "",
  country: "",
  flag: "🏳️",
  capacity: 0,
  capacity_unit: "MW",
  power_source: "",
  cooling: "",
  active_miners: 0,
  online_miners: 0,
  uptime: 99.0,
  latitude: null,
  longitude: null,
  image_url: "",
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uptimeColor(u: number) {
  if (u >= 99) return "text-success";
  if (u >= 97) return "text-warning";
  return "text-destructive";
}
function uptimeBadgeClass(u: number) {
  if (u >= 99) return "bg-success/10 text-success border-success/20";
  if (u >= 97) return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}
function statusDot(online: boolean) {
  return online
    ? "w-2 h-2 rounded-full bg-success animate-pulse"
    : "w-2 h-2 rounded-full bg-muted-foreground";
}
function formatBTC(n: number) {
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Farm Form Modal ──────────────────────────────────────────────────────────
function FarmModal({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: MiningFarm | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FarmFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        const { id: _id, total_btc_mined: _tb, ...rest } = initial;
        setForm(rest);
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, initial]);

  function set<K extends keyof FarmFormData>(key: K, value: FarmFormData[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.country.trim()) {
      toast.error("Name and country are required");
      return;
    }
    if (form.online_miners > form.active_miners) {
      toast.error("Online miners cannot exceed active miners");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        country: form.country.trim(),
        flag: form.flag.trim() || "🏳️",
        capacity: Number(form.capacity),
        capacity_unit: form.capacity_unit,
        power_source: form.power_source,
        cooling: form.cooling,
        active_miners: Number(form.active_miners),
        online_miners: Number(form.online_miners),
        uptime: Number(form.uptime),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        image_url: form.image_url || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };
      if (initial) {
        const { error } = await supabase.from("mining_farms").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Farm updated");
      } else {
        const { error } = await supabase.from("mining_farms").insert(payload);
        if (error) throw error;
        toast.success("Farm created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof FarmFormData,
    label: string,
    type: "text" | "number" = "text",
    placeholder = ""
  ) => (
    <div>
      <Label className="text-xs font-normal mb-1 block">{label}</Label>
      <Input
        type={type}
        value={(form[key] ?? "") as string | number}
        onChange={e =>
          set(key, type === "number"
            ? e.target.valueAsNumber as FarmFormData[typeof key]
            : e.target.value as FarmFormData[typeof key])
        }
        placeholder={placeholder}
        className="text-xs h-8"
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {initial ? "Edit Mining Farm" : "Add Mining Farm"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
          {field("name", "Farm Name *", "text", "e.g. Iceland Arctic Hub")}
          {field("country", "Country *", "text", "e.g. Iceland")}
          {field("flag", "Flag Emoji", "text", "🇮🇸")}
          {field("capacity", "Capacity", "number", "150")}
          {field("capacity_unit", "Capacity Unit", "text", "MW")}
          {field("power_source", "Power Source", "text", "Geothermal & Hydro")}
          {field("cooling", "Cooling System", "text", "Natural Air + Immersion")}
          {field("active_miners", "Active Miners", "number", "5000")}
          {field("online_miners", "Online Miners", "number", "4950")}
          {field("uptime", "Uptime %", "number", "99.3")}
          {field("latitude", "Latitude", "number", "64.1")}
          {field("longitude", "Longitude", "number", "-21.9")}
          <div className="md:col-span-2">
            <Label className="text-xs font-normal mb-1 block">Image URL</Label>
            <Input
              type="text"
              value={form.image_url ?? ""}
              onChange={e => set("image_url", e.target.value)}
              placeholder="https://..."
              className="text-xs h-8"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <Label className="text-xs font-normal">Status</Label>
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border transition-colors ${
                form.is_active
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {form.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {form.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Farm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Farm Detail Drawer ───────────────────────────────────────────────────────
function FarmDetailDrawer({
  farm, open, onClose, onEdit, onToggle,
}: {
  farm: MiningFarm | null;
  open: boolean;
  onClose: () => void;
  onEdit: (f: MiningFarm) => void;
  onToggle: (f: MiningFarm) => void;
}) {
  if (!farm) return null;
  const onlinePct = farm.active_miners > 0
    ? Math.round((farm.online_miners / farm.active_miners) * 100) : 0;

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto p-0">
        {/* Hero image */}
        <div className="h-52 relative overflow-hidden">
          {farm.image_url ? (
            <img src={farm.image_url} alt={farm.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Server className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={statusDot(farm.is_active)} />
              <Badge className={`text-xs ${farm.is_active ? "bg-success/20 text-success border-success/30" : "bg-muted text-muted-foreground"}`}>
                {farm.is_active ? "Operational" : "Inactive"}
              </Badge>
            </div>
            <h2 className="text-white font-bold text-lg text-balance leading-tight">{farm.name}</h2>
            <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />{farm.flag} {farm.country}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Capacity", value: `${farm.capacity} ${farm.capacity_unit}`, icon: Zap, color: "text-primary" },
              { label: "Uptime", value: `${farm.uptime}%`, icon: Activity, color: uptimeColor(Number(farm.uptime)) },
              { label: "Total BTC Mined", value: `₿ ${formatBTC(farm.total_btc_mined)}`, icon: Bitcoin, color: "text-warning" },
              { label: "Power Source", value: farm.power_source, icon: TrendingUp, color: "text-foreground" },
            ].map(k => (
              <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
                <div className="flex items-center gap-1.5 mb-1">
                  <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
                <p className={`text-sm font-semibold font-mono ${k.color} truncate`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Miner health */}
          <div className="border border-border rounded-lg p-3 bg-card space-y-2">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-primary" /> Miner Health
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-success" />{farm.online_miners.toLocaleString()} online</span>
              <span className="flex items-center gap-1"><WifiOff className="w-3 h-3 text-destructive" />{(farm.active_miners - farm.online_miners).toLocaleString()} offline</span>
              <span className="font-mono font-medium text-foreground">{onlinePct}%</span>
            </div>
            <Progress value={onlinePct} className="h-2" />
            <p className="text-xs text-muted-foreground">{farm.active_miners.toLocaleString()} total active miners</p>
          </div>

          {/* Infrastructure */}
          <div className="border border-border rounded-lg p-3 bg-card space-y-2">
            <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-primary" /> Infrastructure
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Cooling System</p>
                <p className="text-foreground flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-info" />{farm.cooling}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Power</p>
                <p className="text-foreground flex items-center gap-1">
                  <Wind className="w-3 h-3 text-success" />{farm.power_source}
                </p>
              </div>
              {farm.latitude && farm.longitude && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-0.5">GPS Coordinates</p>
                  <p className="text-foreground font-mono text-xs">
                    {Number(farm.latitude).toFixed(4)}°, {Number(farm.longitude).toFixed(4)}°
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-sm"
              onClick={() => { onEdit(farm); onClose(); }}
            >
              <Pencil className="w-4 h-4" /> Edit Farm
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 text-sm"
              onClick={() => { onToggle(farm); onClose(); }}
            >
              {farm.is_active
                ? <><ToggleRight className="w-4 h-4 text-success" />Deactivate</>
                : <><ToggleLeft className="w-4 h-4" />Activate</>}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminFarms() {
  const [farms, setFarms] = useState<MiningFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<MiningFarm | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MiningFarm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailFarm, setDetailFarm] = useState<MiningFarm | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // filters / sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const fetchFarms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("mining_farms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFarms(data ?? []);
    } catch {
      toast.error("Failed to load farms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFarms(); }, [fetchFarms]);

  const handleAdd = () => { setEditTarget(null); setModalOpen(true); };
  const handleEdit = (farm: MiningFarm) => { setEditTarget(farm); setModalOpen(true); };
  const handleDetail = (farm: MiningFarm) => { setDetailFarm(farm); setDetailOpen(true); };

  const handleToggle = async (farm: MiningFarm) => {
    try {
      const { error } = await supabase
        .from("mining_farms")
        .update({ is_active: !farm.is_active, updated_at: new Date().toISOString() })
        .eq("id", farm.id);
      if (error) throw error;
      toast.success(`Farm ${farm.is_active ? "deactivated" : "activated"}`);
      fetchFarms();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("mining_farms").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Farm deleted");
      setDeleteTarget(null);
      fetchFarms();
    } catch {
      toast.error("Failed to delete farm");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
      : <ChevronUp className="w-3 h-3 opacity-20" />;

  const filtered = useMemo(() => {
    let list = [...farms];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.country.toLowerCase().includes(q) ||
        f.power_source.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter(f => f.is_active === (statusFilter === "active"));
    list.sort((a, b) => {
      let av: string | number = a[sortKey] ?? 0;
      let bv: string | number = b[sortKey] ?? 0;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [farms, search, statusFilter, sortKey, sortDir]);

  const activeFarms = farms.filter(f => f.is_active);
  const totalCapacity = activeFarms.reduce((s, f) => s + Number(f.capacity), 0);
  const totalMiners = activeFarms.reduce((s, f) => s + f.active_miners, 0);
  const totalOnline = activeFarms.reduce((s, f) => s + f.online_miners, 0);
  const avgUptime = activeFarms.length
    ? activeFarms.reduce((s, f) => s + Number(f.uptime), 0) / activeFarms.length : 0;
  const totalBTC = farms.reduce((s, f) => s + Number(f.total_btc_mined), 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground text-balance">Mining Farm Management</h2>
            <p className="text-sm text-muted-foreground">
              {farms.length} farms · {activeFarms.length} active · {totalCapacity.toLocaleString()} MW total capacity
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchFarms}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 text-sm h-8" onClick={handleAdd}>
              <Plus className="w-4 h-4" /> Add Farm
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Capacity", val: `${totalCapacity.toLocaleString()} MW`, icon: Zap, color: "text-primary" },
            { label: "Total Miners", val: totalMiners.toLocaleString(), icon: Server, color: "text-foreground" },
            { label: "Online Miners", val: totalOnline.toLocaleString(), icon: Wifi, color: "text-success" },
            { label: "Avg Uptime", val: `${avgUptime.toFixed(1)}%`, icon: Activity, color: uptimeColor(avgUptime) },
            { label: "Total BTC Mined", val: `₿ ${formatBTC(totalBTC)}`, icon: Bitcoin, color: "text-warning" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded-lg p-3 bg-card h-full">
              <div className="flex items-center gap-1 mb-1.5">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Filters & View toggle */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search farms, countries, power sources…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="h-8 text-xs w-36 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 text-xs w-40 shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="capacity">Sort: Capacity</SelectItem>
              <SelectItem value="uptime">Sort: Uptime</SelectItem>
              <SelectItem value="active_miners">Sort: Miners</SelectItem>
              <SelectItem value="total_btc_mined">Sort: BTC Mined</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded overflow-hidden shrink-0 h-8">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 flex items-center transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 flex items-center transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <Tabs defaultValue="cards">
          <TabsList className="h-8 text-xs">
            <TabsTrigger value="cards" className="text-xs gap-1.5 h-7">
              <LayoutGrid className="w-3.5 h-3.5" /> Card View
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs gap-1.5 h-7">
              <BarChart3 className="w-3.5 h-3.5" /> Stats Table
            </TabsTrigger>
          </TabsList>

          {/* ── Card View ── */}
          <TabsContent value="cards" className="mt-4">
            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full bg-muted rounded-xl" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-border rounded-xl bg-muted/20">
                <Server className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  {search || statusFilter !== "all" ? "No farms match your filters" : "No mining farms yet"}
                </p>
                {!search && statusFilter === "all" && (
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm mt-2" onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Add First Farm
                  </Button>
                )}
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-4" : "flex flex-col gap-3"}>
                {filtered.map(farm => {
                  const onlinePct = farm.active_miners > 0
                    ? Math.round((farm.online_miners / farm.active_miners) * 100) : 0;
                  return viewMode === "grid" ? (
                    /* ─ Grid card ─ */
                    <Card
                      key={farm.id}
                      className={`bg-card border-border overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md cursor-pointer ${!farm.is_active ? "opacity-75" : ""}`}
                      onClick={() => handleDetail(farm)}
                    >
                      {/* Image */}
                      <div className="aspect-[16/7] overflow-hidden relative shrink-0">
                        {farm.image_url ? (
                          <img src={farm.image_url} alt={farm.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Server className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className={statusDot(farm.is_active)} />
                          <Badge className={`text-xs ${farm.is_active ? "bg-success/20 text-success border-success/40 backdrop-blur-sm" : "bg-black/40 text-white/70 border-white/20 backdrop-blur-sm"}`}>
                            {farm.is_active ? "Operational" : "Offline"}
                          </Badge>
                        </div>
                        <div className="absolute bottom-2.5 right-2.5">
                          <Badge className={`text-xs backdrop-blur-sm border ${uptimeBadgeClass(Number(farm.uptime))}`}>
                            {farm.uptime}% uptime
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        <div className="mb-3">
                          <p className="font-semibold text-foreground text-balance leading-snug">{farm.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />{farm.flag} {farm.country}
                          </p>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                          <div className="bg-muted/40 rounded p-2">
                            <p className="text-muted-foreground mb-0.5">Capacity</p>
                            <p className="font-mono font-bold text-foreground">{farm.capacity} {farm.capacity_unit}</p>
                          </div>
                          <div className="bg-success/5 rounded p-2">
                            <p className="text-muted-foreground mb-0.5 flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5 text-success" />Online</p>
                            <p className="font-mono text-success">{farm.online_miners.toLocaleString()}</p>
                          </div>
                          <div className="bg-warning/5 rounded p-2">
                            <p className="text-muted-foreground mb-0.5">BTC Mined</p>
                            <p className="font-mono text-warning">₿{formatBTC(farm.total_btc_mined)}</p>
                          </div>
                        </div>

                        {/* Progress */}
                        {farm.active_miners > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Miner utilisation</span>
                              <span className="font-mono">{onlinePct}%</span>
                            </div>
                            <Progress value={onlinePct} className="h-1.5" />
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 text-xs mb-3 flex-1">
                          <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />{farm.power_source}
                          </span>
                          <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 flex items-center gap-1">
                            <Thermometer className="w-2.5 h-2.5" />{farm.cooling}
                          </span>
                        </div>

                        {/* Action row */}
                        <div className="flex gap-1.5 mt-auto" onClick={e => e.stopPropagation()}>
                          <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 gap-1" onClick={() => handleEdit(farm)}>
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 px-2" onClick={() => handleToggle(farm)}>
                            {farm.is_active
                              ? <ToggleRight className="w-3.5 h-3.5 text-success" />
                              : <ToggleLeft className="w-3.5 h-3.5" />}
                            {farm.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteTarget(farm)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* ─ List row ─ */
                    <div
                      key={farm.id}
                      className={`flex items-center gap-3 border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow cursor-pointer ${!farm.is_active ? "opacity-75" : ""}`}
                      onClick={() => handleDetail(farm)}
                    >
                      <div className="w-16 h-12 rounded overflow-hidden shrink-0">
                        {farm.image_url
                          ? <img src={farm.image_url} alt={farm.name} className="w-full h-full object-cover" loading="lazy" />
                          : <div className="w-full h-full bg-muted flex items-center justify-center"><Server className="w-5 h-5 text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={statusDot(farm.is_active)} />
                          <p className="font-medium text-sm text-foreground truncate">{farm.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />{farm.flag} {farm.country}
                        </p>
                      </div>
                      <div className="hidden md:grid grid-cols-4 gap-4 text-xs text-center shrink-0">
                        <div><p className="text-muted-foreground">Capacity</p><p className="font-mono font-medium">{farm.capacity} {farm.capacity_unit}</p></div>
                        <div><p className="text-muted-foreground">Miners</p><p className="font-mono text-success">{farm.online_miners.toLocaleString()}/{farm.active_miners.toLocaleString()}</p></div>
                        <div><p className="text-muted-foreground">Uptime</p><p className={`font-mono font-medium ${uptimeColor(Number(farm.uptime))}`}>{farm.uptime}%</p></div>
                        <div><p className="text-muted-foreground">BTC Mined</p><p className="font-mono text-warning">₿{formatBTC(farm.total_btc_mined)}</p></div>
                      </div>
                      <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => handleEdit(farm)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteTarget(farm)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Stats Table ── */}
          <TabsContent value="table" className="mt-4">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Farm Performance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        {(
                          [
                            { key: "name", label: "Farm" },
                            { key: "capacity", label: "Capacity" },
                            { key: "active_miners", label: "Miners" },
                            { key: "uptime", label: "Uptime" },
                            { key: "total_btc_mined", label: "BTC Mined" },
                          ] as { key: SortKey; label: string }[]
                        ).map(col => (
                          <th
                            key={col.key}
                            className="text-left px-4 py-2.5 text-muted-foreground font-medium cursor-pointer hover:text-foreground whitespace-nowrap select-none"
                            onClick={() => toggleSort(col.key)}
                          >
                            <span className="flex items-center gap-1">
                              {col.label} <SortIcon k={col.key} />
                            </span>
                          </th>
                        ))}
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Power</th>
                        <th className="text-left px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="border-b border-border">
                            {Array.from({ length: 8 }).map((__, j) => (
                              <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-20 bg-muted" /></td>
                            ))}
                          </tr>
                        ))
                        : filtered.map(farm => {
                          const onlinePct = farm.active_miners > 0
                            ? Math.round((farm.online_miners / farm.active_miners) * 100) : 0;
                          return (
                            <tr key={farm.id} className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => handleDetail(farm)}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-6 rounded overflow-hidden shrink-0">
                                    {farm.image_url
                                      ? <img src={farm.image_url} alt={farm.name} className="w-full h-full object-cover" loading="lazy" />
                                      : <div className="w-full h-full bg-muted" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground whitespace-nowrap">{farm.name}</p>
                                    <p className="text-muted-foreground">{farm.flag} {farm.country}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono whitespace-nowrap">{farm.capacity} {farm.capacity_unit}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div>
                                  <p className="font-mono"><span className="text-success">{farm.online_miners.toLocaleString()}</span> / {farm.active_miners.toLocaleString()}</p>
                                  <Progress value={onlinePct} className="h-1 mt-1 w-20" />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-mono font-medium ${uptimeColor(Number(farm.uptime))}`}>{farm.uptime}%</span>
                              </td>
                              <td className="px-4 py-3 font-mono text-warning whitespace-nowrap">₿ {formatBTC(farm.total_btc_mined)}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{farm.power_source}</td>
                              <td className="px-4 py-3">
                                <Badge className={`text-xs whitespace-nowrap ${farm.is_active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                                  {farm.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => handleEdit(farm)}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteTarget(farm)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No farms match your current filters.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Result count */}
        {!loading && (search || statusFilter !== "all") && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {farms.length} farms
          </p>
        )}
      </div>

      {/* Create / Edit Modal */}
      <FarmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSaved={fetchFarms}
      />

      {/* Detail Drawer */}
      <FarmDetailDrawer
        farm={detailFarm}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={handleEdit}
        onToggle={handleToggle}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mining Farm?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete Farm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
