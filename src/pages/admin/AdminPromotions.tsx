import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Plus, RefreshCw, Edit, Trash2, Copy, Tag, Zap, Percent, DollarSign } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  promo_type: string;
  discount_value: number | null;
  bonus_hashpower_th: number | null;
  coupon_code: string | null;
  start_date: string | null;
  end_date: string | null;
  max_redemptions: number | null;
  redemptions_count: number;
  max_per_user: number;
  min_purchase_usd: number;
  can_stack: boolean;
  is_active: boolean;
  created_at: string;
}

const PROMO_TYPES = ["percentage", "fixed", "bonus_hashpower", "maintenance_discount", "coupon", "campaign"];
const TYPE_ICON: Record<string, React.ReactNode> = {
  percentage: <Percent className="w-3.5 h-3.5" />,
  fixed: <DollarSign className="w-3.5 h-3.5" />,
  bonus_hashpower: <Zap className="w-3.5 h-3.5" />,
  maintenance_discount: <Percent className="w-3.5 h-3.5" />,
  coupon: <Tag className="w-3.5 h-3.5" />,
  campaign: <Tag className="w-3.5 h-3.5" />,
};

const EMPTY = {
  name: "", promo_type: "percentage", discount_value: "", bonus_hashpower_th: "",
  coupon_code: "", start_date: "", end_date: "",
  max_redemptions: "", max_per_user: "1", min_purchase_usd: "0", can_stack: false,
};

export default function AdminPromotions() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY }); setShowDialog(true); };
  const openEdit = (p: Promotion) => {
    setEditId(p.id);
    setForm({
      name: p.name, promo_type: p.promo_type,
      discount_value: p.discount_value?.toString() ?? "",
      bonus_hashpower_th: p.bonus_hashpower_th?.toString() ?? "",
      coupon_code: p.coupon_code ?? "",
      start_date: p.start_date ? p.start_date.slice(0, 16) : "",
      end_date: p.end_date ? p.end_date.slice(0, 16) : "",
      max_redemptions: p.max_redemptions?.toString() ?? "",
      max_per_user: p.max_per_user.toString(),
      min_purchase_usd: p.min_purchase_usd.toString(),
      can_stack: p.can_stack,
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      promo_type: form.promo_type,
      discount_value: form.discount_value ? Number(form.discount_value) : null,
      bonus_hashpower_th: form.bonus_hashpower_th ? Number(form.bonus_hashpower_th) : null,
      coupon_code: form.coupon_code ? form.coupon_code.toUpperCase() : null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      max_redemptions: form.max_redemptions ? Number(form.max_redemptions) : null,
      max_per_user: Number(form.max_per_user),
      min_purchase_usd: Number(form.min_purchase_usd),
      can_stack: form.can_stack,
      updated_at: new Date().toISOString(),
    };
    const { error } = editId
      ? await supabase.from("promotions").update(payload).eq("id", editId)
      : await supabase.from("promotions").insert(payload);
    if (error) toast.error("Save failed: " + error.message);
    else { toast.success(editId ? "Promotion updated" : "Promotion created"); setShowDialog(false); load(); }
    setSaving(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("promotions").update({ is_active: active }).eq("id", id);
    setPromos(prev => prev.map(p => p.id === id ? { ...p, is_active: active } : p));
    toast.success(active ? "Promotion activated" : "Promotion deactivated");
  };

  const deleteProm = async () => {
    if (!deleteTarget) return;
    await supabase.from("promotions").delete().eq("id", deleteTarget.id);
    setPromos(prev => prev.filter(p => p.id !== deleteTarget.id));
    toast.success("Promotion deleted");
    setDeleteTarget(null);
  };

  const duplicate = async (p: Promotion) => {
    const { error } = await supabase.from("promotions").insert({
      name: p.name + " (Copy)", promo_type: p.promo_type, discount_value: p.discount_value,
      bonus_hashpower_th: p.bonus_hashpower_th, coupon_code: null,
      start_date: p.start_date, end_date: p.end_date,
      max_redemptions: p.max_redemptions, max_per_user: p.max_per_user,
      min_purchase_usd: p.min_purchase_usd, can_stack: p.can_stack, is_active: false,
    });
    if (error) toast.error("Duplicate failed");
    else { toast.success("Promotion duplicated"); load(); }
  };

  const fmtValue = (p: Promotion) => {
    if (p.promo_type === "percentage" || p.promo_type === "maintenance_discount") return `${p.discount_value}% off`;
    if (p.promo_type === "fixed") return `$${p.discount_value} off`;
    if (p.promo_type === "bonus_hashpower") return `+${p.bonus_hashpower_th} TH/s`;
    return "—";
  };

  const isExpired = (p: Promotion) => !!p.end_date && new Date(p.end_date) < new Date();

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Promotion & Discount Engine</h2>
            <p className="text-sm text-muted-foreground">{promos.filter(p => p.is_active).length} active promotions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" /> New Promotion
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Promotions", value: promos.length },
            { label: "Active", value: promos.filter(p => p.is_active && !isExpired(p)).length },
            { label: "Total Redemptions", value: promos.reduce((s, p) => s + p.redemptions_count, 0) },
            { label: "With Coupon Code", value: promos.filter(p => !!p.coupon_code).length },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Promotion", "Type", "Value", "Coupon", "Validity", "Redemptions", "Active", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((__, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-16" /></td>)}
                    </tr>
                  )) : promos.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No promotions yet</td></tr>
                  ) : promos.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-foreground">{p.name}</p>
                        {p.min_purchase_usd > 0 && <p className="text-xs text-muted-foreground">Min ${p.min_purchase_usd}</p>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {TYPE_ICON[p.promo_type]}
                          <span className="text-xs capitalize">{p.promo_type.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-primary">{fmtValue(p)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {p.coupon_code ? (
                          <Badge variant="outline" className="font-mono text-xs">{p.coupon_code}</Badge>
                        ) : <span className="text-muted-foreground text-xs">Auto</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {p.start_date ? new Date(p.start_date).toLocaleDateString() : "—"} →{" "}
                        {p.end_date ? new Date(p.end_date).toLocaleDateString() : "∞"}
                        {isExpired(p) && <Badge className="ml-1 text-xs bg-destructive/10 text-destructive">Expired</Badge>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground text-xs">
                        {p.redemptions_count} / {p.max_redemptions ?? "∞"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Switch checked={p.is_active} onCheckedChange={v => toggleActive(p.id, v)} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(p)} title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => duplicate(p)} title="Duplicate">
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(p)} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Create"} Promotion</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Summer 10% Off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.promo_type} onValueChange={v => setF("promo_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROMO_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.promo_type === "bonus_hashpower" ? "Bonus TH/s" : "Discount Value"}</Label>
                <Input type="number" min={0}
                  value={form.promo_type === "bonus_hashpower" ? form.bonus_hashpower_th : form.discount_value}
                  onChange={e => setF(form.promo_type === "bonus_hashpower" ? "bonus_hashpower_th" : "discount_value", e.target.value)}
                  placeholder={form.promo_type === "percentage" ? "10" : "50"} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Coupon Code (optional)</Label>
              <Input value={form.coupon_code} onChange={e => setF("coupon_code", e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER2026" className="font-mono uppercase" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.start_date} onChange={e => setF("start_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.end_date} onChange={e => setF("end_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Max Redemptions</Label>
                <Input type="number" min={1} value={form.max_redemptions} onChange={e => setF("max_redemptions", e.target.value)} placeholder="∞" />
              </div>
              <div className="space-y-1.5">
                <Label>Per User Limit</Label>
                <Input type="number" min={1} value={form.max_per_user} onChange={e => setF("max_per_user", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Min Purchase ($)</Label>
                <Input type="number" min={0} value={form.min_purchase_usd} onChange={e => setF("min_purchase_usd", e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.can_stack} onCheckedChange={v => setF("can_stack", v)} />
              <Label>Can stack with other promotions</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />} {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={deleteProm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
