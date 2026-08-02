import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Megaphone, RefreshCw, Save, Eye, Users, BarChart2,
  MousePointer, Clock, ScrollText, LogOut,
} from "lucide-react";

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
}

const DEFAULT: PopupConfig = {
  title: "Limited-Time Mining Offer",
  subtitle: "Start Earning Bitcoin Today",
  description: "Get exclusive access to our cloud mining contracts. Join thousands of miners worldwide.",
  button_text: "Claim Offer Now",
  cta_url: "/register",
  background_image: "",
  banner_image: "",
  is_active: false,
  expires_at: "",
  display_frequency: "once_per_day",
  cooldown_hours: 24,
  trigger_delay_seconds: 25,
  trigger_scroll_pct: 50,
  trigger_exit_intent: true,
  trigger_multi_page: true,
  multi_page_threshold: 2,
};

interface Stats { impressions: number; captures: number; dismissals: number; }

export default function AdminPopupManager() {
  const [config, setConfig] = useState<PopupConfig>(DEFAULT);
  const [stats, setStats] = useState<Stats>({ impressions: 0, captures: 0, dismissals: 0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: popup }, { data: events }] = await Promise.all([
      supabase.from("popup_configs").select("*").order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("popup_events").select("event_type"),
    ]);
    if (popup) setConfig({ ...DEFAULT, ...popup, expires_at: popup.expires_at ? popup.expires_at.slice(0, 16) : "" });
    if (events) {
      const s = { impressions: 0, captures: 0, dismissals: 0 };
      events.forEach(e => {
        if (e.event_type === "impression") s.impressions++;
        if (e.event_type === "email_captured") s.captures++;
        if (e.event_type === "dismiss") s.dismissals++;
      });
      setStats(s);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof PopupConfig, v: unknown) => setConfig(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      ...config,
      expires_at: config.expires_at ? new Date(config.expires_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = config.id
      ? await supabase.from("popup_configs").update(payload).eq("id", config.id)
      : await supabase.from("popup_configs").insert(payload);
    if (error) toast.error("Failed to save: " + error.message);
    else { toast.success("Popup configuration saved"); load(); }
    setSaving(false);
  };

  const convRate = stats.impressions > 0 ? ((stats.captures / stats.impressions) * 100).toFixed(1) : "0";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Smart Popup Manager</h2>
            <p className="text-sm text-muted-foreground">Configure promotional popups shown to visitors</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} className="gap-1.5 h-8 text-xs">
              <Eye className="w-3.5 h-3.5" /> {preview ? "Hide Preview" : "Preview"}
            </Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1.5 h-8 text-xs">
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Impressions", value: stats.impressions, icon: <Eye className="w-4 h-4 text-primary" /> },
            { label: "Email Captures", value: stats.captures, icon: <Users className="w-4 h-4 text-green-500" /> },
            { label: "Dismissals", value: stats.dismissals, icon: <LogOut className="w-4 h-4 text-amber-500" /> },
            { label: "Conversion Rate", value: convRate + "%", icon: <BarChart2 className="w-4 h-4 text-blue-500" /> },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-muted/40 rounded-lg flex items-center justify-center shrink-0">{s.icon}</div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Content */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" /> Popup Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Active</Label>
                <div className="flex items-center gap-2">
                  <Switch checked={config.is_active} onCheckedChange={v => set("is_active", v)} />
                  <Badge className={config.is_active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}>
                    {config.is_active ? "Live" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <Separator />
              {(["title", "subtitle", "button_text", "cta_url"] as const).map(f => (
                <div key={f} className="space-y-1.5">
                  <Label className="text-xs capitalize">{f.replace(/_/g, " ")}</Label>
                  <Input value={config[f]} onChange={e => set(f, e.target.value)} className="h-8 text-sm" />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea rows={3} value={config.description} onChange={e => set("description", e.target.value)} className="text-sm resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Background Image URL</Label>
                <Input value={config.background_image} onChange={e => set("background_image", e.target.value)} className="h-8 text-sm" placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Banner Image URL</Label>
                <Input value={config.banner_image} onChange={e => set("banner_image", e.target.value)} className="h-8 text-sm" placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiration Date (optional)</Label>
                <Input type="datetime-local" value={config.expires_at} onChange={e => set("expires_at", e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Display Frequency</Label>
                <Select value={config.display_frequency} onValueChange={v => set("display_frequency", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once_per_session">Once per session</SelectItem>
                    <SelectItem value="once_per_day">Once per day</SelectItem>
                    <SelectItem value="always">Always</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Dismissal Cooldown (hours)</Label>
                <Input type="number" min={1} value={config.cooldown_hours} onChange={e => set("cooldown_hours", Number(e.target.value))} className="h-8 text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Triggers */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MousePointer className="w-4 h-4 text-primary" /> Display Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Time on page</Label>
                  </div>
                  <Badge variant="outline" className="text-xs">Always on</Badge>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Trigger after (seconds)</Label>
                  <Input type="number" min={5} max={120} value={config.trigger_delay_seconds} onChange={e => set("trigger_delay_seconds", Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm">Scroll depth</Label>
                  </div>
                  <Badge variant="outline" className="text-xs">Always on</Badge>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Trigger at scroll % (e.g. 50)</Label>
                  <Input type="number" min={10} max={100} value={config.trigger_scroll_pct} onChange={e => set("trigger_scroll_pct", Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Exit intent (desktop)</Label>
                  <p className="text-xs text-muted-foreground">Mouse moves toward top of browser</p>
                </div>
                <Switch checked={config.trigger_exit_intent} onCheckedChange={v => set("trigger_exit_intent", v)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Multi-page visit</Label>
                  <p className="text-xs text-muted-foreground">User visits multiple pages</p>
                </div>
                <Switch checked={config.trigger_multi_page} onCheckedChange={v => set("trigger_multi_page", v)} />
              </div>
              {config.trigger_multi_page && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pages visited threshold</Label>
                  <Input type="number" min={2} max={10} value={config.multi_page_threshold} onChange={e => set("multi_page_threshold", Number(e.target.value))} className="h-8 text-sm" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        {preview && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-border shadow-xl"
                style={{
                  background: config.background_image
                    ? `linear-gradient(rgba(0,0,0,0.7),rgba(0,0,0,0.85)), url(${config.background_image}) center/cover`
                    : "hsl(var(--card))",
                }}>
                {config.banner_image && <div className="w-full h-36 overflow-hidden"><img src={config.banner_image} alt="" className="w-full h-full object-cover" /></div>}
                <div className="p-6">
                  <h2 className="text-xl font-bold text-foreground">{config.title || "Title"}</h2>
                  {config.subtitle && <p className="text-primary font-semibold text-sm mt-1">{config.subtitle}</p>}
                  {config.description && <p className="text-muted-foreground text-sm mt-2">{config.description}</p>}
                  <div className="mt-4 space-y-2">
                    <div className="h-9 bg-muted/30 rounded border border-border text-xs flex items-center px-3 text-muted-foreground">Email address *</div>
                    <Button type="button" onClick={() => {}} className="w-full">{config.button_text || "Claim Offer"}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
