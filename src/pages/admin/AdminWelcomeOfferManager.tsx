import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import {
  Gift, Save, RefreshCw, Plus, Trash2, Copy, BarChart3, Megaphone,
  Percent, Zap, Calendar, Clock, MousePointer, Image, ToggleRight,
  ChevronRight, Loader2,
} from "lucide-react";

interface PopupVariant {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  cta_url: string;
  discount_pct: number;
  is_control?: boolean;
}

interface PopupConfig {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  cta_url: string;
  background_image: string;
  banner_image: string;
  is_active: boolean;
  expires_at: string;
  display_frequency: string;
  cooldown_hours: number;
  trigger_delay_seconds: number;
  trigger_scroll_pct: number;
  trigger_exit_intent: boolean;
  trigger_multi_page: boolean;
  multi_page_threshold: number;
  variant_name: string;
  variants: PopupVariant[];
}

interface Promotion {
  id?: string;
  name: string;
  promo_type: string;
  discount_value: number;
  bonus_hashpower_th: number | null;
  coupon_code: string;
  start_date: string;
  end_date: string;
  max_redemptions: number | null;
  max_per_user: number;
  min_purchase_usd: number;
  is_active: boolean;
  applicable_contract_ids: string[];
}

const DEFAULT_VARIANT: PopupVariant = {
  name: "control",
  title: "Get 10% Off Your First Mining Contract",
  subtitle: "⚡ Exclusive Welcome Bonus",
  description: "Create your free account today, verify your email, and automatically unlock your welcome discount on your first eligible mining contract.",
  button_text: "Unlock My 10% Discount",
  cta_url: "/register?welcome=1",
  discount_pct: 10,
  is_control: true,
};

const DEFAULT_CONFIG: PopupConfig = {
  title: "Get 10% Off Your First Mining Contract",
  subtitle: "⚡ Exclusive Welcome Bonus",
  description: "Create your free account today, verify your email, and automatically unlock your welcome discount on your first eligible mining contract.",
  button_text: "Unlock My 10% Discount",
  cta_url: "/register?welcome=1",
  background_image: "",
  banner_image: "",
  is_active: false,
  expires_at: "",
  display_frequency: "once_per_week",
  cooldown_hours: 168,
  trigger_delay_seconds: 25,
  trigger_scroll_pct: 60,
  trigger_exit_intent: true,
  trigger_multi_page: true,
  multi_page_threshold: 2,
  variant_name: "control",
  variants: [DEFAULT_VARIANT],
};

const DEFAULT_PROMO: Promotion = {
  name: "WELCOME10",
  promo_type: "percentage",
  discount_value: 10,
  bonus_hashpower_th: null,
  coupon_code: "WELCOME10",
  start_date: "",
  end_date: "",
  max_redemptions: null,
  max_per_user: 1,
  min_purchase_usd: 0,
  is_active: true,
  applicable_contract_ids: [],
};

export default function AdminWelcomeOfferManager() {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [promo, setPromo] = useState<Promotion>(DEFAULT_PROMO);
  const [contracts, setContracts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("offer");
  const [variantDialog, setVariantDialog] = useState<{ open: boolean; index: number | null; draft: PopupVariant }>({ open: false, index: null, draft: { ...DEFAULT_VARIANT } });
  const [deleteVariantIndex, setDeleteVariantIndex] = useState<number | null>(null);
  const [stats, setStats] = useState({
    impressions: 0, captures: 0, registrations: 0, verifications: 0,
    deposits: 0, contracts: 0, revenue: 0, dismissals: 0, closeRate: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: popup }, { data: promos }, { data: templs }, { data: events }] = await Promise.all([
        supabase.from("popup_configs").select("*").order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("promotions").select("*").ilike("coupon_code", "WELCOME%").order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("public_contract_templates").select("id, name").eq("is_active", true),
        supabase.from("popup_events").select("event_type, variant, email"),
      ]);

      if (popup) {
        const variants: PopupVariant[] = Array.isArray(popup.variants) && popup.variants.length
          ? popup.variants
          : [DEFAULT_VARIANT];
        setConfig({
          ...DEFAULT_CONFIG,
          ...popup,
          expires_at: popup.expires_at ? popup.expires_at.slice(0, 16) : "",
          variants,
          variant_name: popup.variant_name || variants[0]?.name || "control",
        });
      }

      if (promos) {
        setPromo({
          ...DEFAULT_PROMO,
          ...promos,
          start_date: promos.start_date ? promos.start_date.slice(0, 16) : "",
          end_date: promos.end_date ? promos.end_date.slice(0, 16) : "",
          applicable_contract_ids: promos.applicable_contract_ids || [],
        });
      }

      setContracts(templs ?? []);

      if (events) {
        const s = { impressions: 0, captures: 0, registrations: 0, verifications: 0, deposits: 0, contracts: 0, revenue: 0, dismissals: 0, closeRate: 0 };
        events.forEach((e: { event_type: string; variant?: string; email?: string }) => {
          if (e.event_type === "impression") s.impressions++;
          if (e.event_type === "email_captured") s.captures++;
          if (e.event_type === "dismiss") s.dismissals++;
        });
        s.closeRate = s.impressions ? Math.round((s.dismissals / s.impressions) * 100) : 0;
        setStats(prev => ({ ...prev, ...s }));
      }
    } catch (e) {
      toast.error("Failed to load welcome offer data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const upsertConfig = {
        title: config.title,
        subtitle: config.subtitle,
        description: config.description,
        button_text: config.button_text,
        cta_url: config.cta_url,
        background_image: config.background_image,
        banner_image: config.banner_image,
        is_active: config.is_active,
        expires_at: config.expires_at ? new Date(config.expires_at).toISOString() : null,
        display_frequency: config.display_frequency,
        cooldown_hours: config.cooldown_hours,
        trigger_delay_seconds: config.trigger_delay_seconds,
        trigger_scroll_pct: config.trigger_scroll_pct,
        trigger_exit_intent: config.trigger_exit_intent,
        trigger_multi_page: config.trigger_multi_page,
        multi_page_threshold: config.multi_page_threshold,
        variant_name: config.variant_name,
        variants: config.variants,
        updated_at: new Date().toISOString(),
      };

      const { data: savedPopup } = await supabase.from("popup_configs")
        .upsert({ id: config.id, ...upsertConfig }, { onConflict: "id" })
        .select("id")
        .single();

      const upsertPromo = {
        name: promo.name || "WELCOME10",
        promo_type: "percentage",
        discount_value: promo.discount_value,
        bonus_hashpower_th: promo.bonus_hashpower_th || null,
        coupon_code: promo.coupon_code || "WELCOME10",
        start_date: promo.start_date ? new Date(promo.start_date).toISOString() : null,
        end_date: promo.end_date ? new Date(promo.end_date).toISOString() : null,
        max_redemptions: promo.max_redemptions || null,
        max_per_user: promo.max_per_user,
        min_purchase_usd: promo.min_purchase_usd,
        is_active: promo.is_active,
        applicable_contract_ids: promo.applicable_contract_ids || [],
        updated_at: new Date().toISOString(),
      };

      await supabase.from("promotions")
        .upsert({ id: promo.id, ...upsertPromo }, { onConflict: "id" });

      if (savedPopup) setConfig(c => ({ ...c, id: savedPopup.id }));
      toast.success("Welcome offer saved successfully");
    } catch (e) {
      toast.error("Failed to save welcome offer");
    } finally {
      setSaving(false);
    }
  };

  const setC = <K extends keyof PopupConfig>(k: K, v: PopupConfig[K]) => setConfig(p => ({ ...p, [k]: v }));
  const setP = <K extends keyof Promotion>(k: K, v: Promotion[K]) => setPromo(p => ({ ...p, [k]: v }));

  const openVariant = (idx: number | null, v?: PopupVariant) => {
    setVariantDialog({ open: true, index: idx, draft: v ? { ...v } : { ...DEFAULT_VARIANT, name: `variant_${config.variants.length + 1}` } });
  };

  const saveVariant = () => {
    const draft = variantDialog.draft;
    if (!draft.name || !draft.title || !draft.button_text) {
      toast.error("Variant name, title, and button text are required");
      return;
    }
    setConfig(prev => {
      const variants = [...prev.variants];
      if (variantDialog.index !== null) {
        variants[variantDialog.index] = draft;
      } else {
        variants.push(draft);
      }
      return { ...prev, variants };
    });
    setVariantDialog({ open: false, index: null, draft: { ...DEFAULT_VARIANT } });
  };

  const removeVariant = (idx: number) => {
    setConfig(prev => {
      const variants = prev.variants.filter((_, i) => i !== idx);
      const variant_name = variants.find(v => v.name === prev.variant_name) ? prev.variant_name : (variants[0]?.name || "control");
      return { ...prev, variants, variant_name };
    });
    setDeleteVariantIndex(null);
  };

  const duplicateVariant = (v: PopupVariant) => {
    const copy = { ...v, name: `${v.name}_copy`, is_control: false };
    setConfig(prev => ({ ...prev, variants: [...prev.variants, copy] }));
    toast.success("Variant duplicated");
  };

  const toggleContract = (id: string) => {
    setPromo(prev => {
      const set = new Set(prev.applicable_contract_ids);
      if (set.has(id)) set.delete(id); else set.add(id);
      return { ...prev, applicable_contract_ids: Array.from(set) };
    });
  };

  const metricCard = (label: string, value: string | number, icon: React.ReactNode) => (
    <Card className="flex-1 min-w-[140px]">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome Offer Manager</h1>
            <p className="text-muted-foreground">Configure the popup, discount, and A/B test variants for the new-member welcome offer.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metricCard("Impressions", stats.impressions.toLocaleString(), <Megaphone className="w-5 h-5" />)}
          {metricCard("Email Captures", stats.captures.toLocaleString(), <BarChart3 className="w-5 h-5" />)}
          {metricCard("Close Rate", `${stats.closeRate}%`, <ToggleRight className="w-5 h-5" />)}
          {metricCard("Revenue", `$${stats.revenue.toLocaleString()}`, <Gift className="w-5 h-5" />)}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="offer">Offer & Discount</TabsTrigger>
            <TabsTrigger value="popup">Popup Design</TabsTrigger>
            <TabsTrigger value="variants">A/B Variants ({config.variants.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="offer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" /> Welcome Discount
                </CardTitle>
                <CardDescription>The discount automatically attaches to verified accounts and applies at checkout.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Promotion Name</Label>
                  <Input value={promo.name} onChange={e => setP("name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input value={promo.coupon_code} onChange={e => setP("coupon_code", e.target.value.toUpperCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Discount Percentage</Label>
                  <Input type="number" min={0} max={100} value={promo.discount_value} onChange={e => setP("discount_value", parseFloat(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Bonus Hashpower (TH/s)</Label>
                  <Input type="number" min={0} value={promo.bonus_hashpower_th ?? ""} onChange={e => setP("bonus_hashpower_th", e.target.value ? parseFloat(e.target.value) : null)} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label>Max Claims (Total)</Label>
                  <Input type="number" min={0} value={promo.max_redemptions ?? ""} onChange={e => setP("max_redemptions", e.target.value ? parseInt(e.target.value) : null)} placeholder="Unlimited" />
                </div>
                <div className="space-y-2">
                  <Label>Max Per User</Label>
                  <Input type="number" min={1} value={promo.max_per_user} onChange={e => setP("max_per_user", parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</Label>
                  <Input type="datetime-local" value={promo.start_date} onChange={e => setP("start_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date</Label>
                  <Input type="datetime-local" value={promo.end_date} onChange={e => setP("end_date", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Eligible Contracts</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {contracts.map(c => (
                      <Badge
                        key={c.id}
                        variant={promo.applicable_contract_ids.includes(c.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleContract(c.id)}
                      >
                        {c.name}
                      </Badge>
                    ))}
                    {contracts.length === 0 && <p className="text-sm text-muted-foreground">No active contract templates found.</p>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">If none selected, all eligible contracts qualify.</p>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Switch checked={promo.is_active} onCheckedChange={v => setP("is_active", v)} />
                  <Label className="cursor-pointer">Promotion Active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="popup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" /> Popup Content
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Popup Title</Label>
                  <Input value={config.title} onChange={e => setC("title", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Subtitle</Label>
                  <Input value={config.subtitle} onChange={e => setC("subtitle", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={config.description} onChange={e => setC("description", e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input value={config.button_text} onChange={e => setC("button_text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input value={config.cta_url} onChange={e => setC("cta_url", e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Background Image URL</Label>
                  <Input value={config.background_image} onChange={e => setC("background_image", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2"><Image className="w-4 h-4" /> Banner Image URL</Label>
                  <Input value={config.banner_image} onChange={e => setC("banner_image", e.target.value)} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Timing & Triggers
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Delay (seconds)</Label>
                  <Input type="number" min={0} value={config.trigger_delay_seconds} onChange={e => setC("trigger_delay_seconds", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><MousePointer className="w-4 h-4" /> Scroll Trigger (%)</Label>
                  <Input type="number" min={0} max={100} value={config.trigger_scroll_pct} onChange={e => setC("trigger_scroll_pct", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Clock className="w-4 h-4" /> Cooldown (hours)</Label>
                  <Input type="number" min={0} value={config.cooldown_hours} onChange={e => setC("cooldown_hours", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Multi-Page Threshold (pageviews)</Label>
                  <Input type="number" min={1} value={config.multi_page_threshold} onChange={e => setC("multi_page_threshold", parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>Popup Expires At</Label>
                  <Input type="datetime-local" value={config.expires_at} onChange={e => setC("expires_at", e.target.value)} />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch checked={config.trigger_exit_intent} onCheckedChange={v => setC("trigger_exit_intent", v)} />
                    <Label className="cursor-pointer">Exit Intent</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.trigger_multi_page} onCheckedChange={v => setC("trigger_multi_page", v)} />
                    <Label className="cursor-pointer">Multi-Page</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.is_active} onCheckedChange={v => setC("is_active", v)} />
                    <Label className="cursor-pointer">Popup Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> A/B Test Variants
                </CardTitle>
                <CardDescription>Create variants to test headlines, offers, and CTAs. The popup randomly selects one active variant per visitor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Active Variant</Label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={config.variant_name}
                    onChange={e => setC("variant_name", e.target.value)}
                  >
                    {config.variants.map(v => <option key={v.name} value={v.name}>{v.name} {v.is_control ? "(control)" : ""}</option>)}
                  </select>
                </div>
                <Separator />
                <div className="space-y-3">
                  {config.variants.map((v, idx) => (
                    <div key={v.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{v.name}</p>
                          {v.is_control && <Badge variant="secondary">Control</Badge>}
                          {config.variant_name === v.name && <Badge variant="default">Active</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{v.title} · {v.button_text}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openVariant(idx, v)}><ChevronRight className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicateVariant(v)}><Copy className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteVariantIndex(idx)} disabled={config.variants.length <= 1}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={() => openVariant(null)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Variant
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      <Dialog open={variantDialog.open} onOpenChange={o => !o && setVariantDialog({ open: false, index: null, draft: { ...DEFAULT_VARIANT } })}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{variantDialog.index !== null ? "Edit Variant" : "Add Variant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Variant Name</Label>
              <Input value={variantDialog.draft.name} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, name: e.target.value.toLowerCase().replace(/\s+/g, "_") } }))} />
            </div>
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input value={variantDialog.draft.title} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, title: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input value={variantDialog.draft.subtitle} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, subtitle: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={variantDialog.draft.description} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, description: e.target.value } }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={variantDialog.draft.button_text} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, button_text: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input value={variantDialog.draft.cta_url} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, cta_url: e.target.value } }))} />
            </div>
            <div className="space-y-2">
              <Label>Discount % for This Variant</Label>
              <Input type="number" min={0} max={100} value={variantDialog.draft.discount_pct} onChange={e => setVariantDialog(d => ({ ...d, draft: { ...d.draft, discount_pct: parseFloat(e.target.value) || 0 } }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={!!variantDialog.draft.is_control}
                onCheckedChange={v => setVariantDialog(d => ({ ...d, draft: { ...d.draft, is_control: v } }))}
              />
              <Label className="cursor-pointer">Control Variant</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialog({ open: false, index: null, draft: { ...DEFAULT_VARIANT } })}>Cancel</Button>
            <Button onClick={saveVariant}>Save Variant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteVariantIndex !== null} onOpenChange={o => !o && setDeleteVariantIndex(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>This variant will be removed from the A/B test. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteVariantIndex(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVariantIndex !== null && removeVariant(deleteVariantIndex)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
