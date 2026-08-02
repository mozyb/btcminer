import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Plus, RefreshCw, Play, Pause, Copy, Archive,
  BarChart2, Send, Search, Eye,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  status: string;
  subject: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_converted: number;
  created_at: string;
}

const TYPES = ["welcome", "educational", "promotional", "seasonal", "product_launch", "newsletter", "feature_announcement"];
const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-500/10 text-blue-500",
  sending: "bg-amber-500/10 text-amber-500",
  paused: "bg-amber-500/10 text-amber-500",
  completed: "bg-green-500/10 text-green-500",
  archived: "bg-muted text-muted-foreground",
};

const EMPTY = { name: "", campaign_type: "newsletter", status: "draft", subject: "", body_html: "", body_text: "", scheduled_at: "" };

export default function AdminCampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q);
    const matchT = typeFilter === "all" || c.campaign_type === typeFilter;
    return matchQ && matchT;
  });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const saveCampaign = async () => {
    if (!form.name.trim()) return toast.error("Campaign name required");
    setSaving(true);
    const payload = { ...form, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null };
    const { error } = await supabase.from("marketing_campaigns").insert(payload);
    if (error) toast.error("Failed to create campaign: " + error.message);
    else { toast.success("Campaign created"); setShowDialog(false); setForm({ ...EMPTY }); load(); }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    await supabase.from("marketing_campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast.success(`Campaign ${status}`);
    setActionLoading(null);
  };

  const duplicate = async (c: Campaign) => {
    const { error } = await supabase.from("marketing_campaigns").insert({
      name: c.name + " (Copy)", campaign_type: c.campaign_type, status: "draft",
      subject: c.subject, body_html: null, body_text: null,
    });
    if (error) toast.error("Duplicate failed");
    else { toast.success("Campaign duplicated"); load(); }
  };

  const ctr = (c: Campaign) => c.total_sent > 0 ? ((c.total_clicked / c.total_sent) * 100).toFixed(1) + "%" : "—";
  const openRate = (c: Campaign) => c.total_sent > 0 ? ((c.total_opened / c.total_sent) * 100).toFixed(1) + "%" : "—";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Campaign Manager</h2>
            <p className="text-sm text-muted-foreground">{campaigns.length} campaigns · {campaigns.filter(c => c.status === "completed").length} completed</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> New Campaign
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: campaigns.reduce((s, c) => s + c.total_sent, 0).toLocaleString() },
            { label: "Avg Open Rate", value: (() => { const s = campaigns.filter(c => c.total_sent > 0); return s.length ? (s.reduce((a, c) => a + c.total_opened / c.total_sent, 0) / s.length * 100).toFixed(1) + "%" : "—"; })() },
            { label: "Avg CTR", value: (() => { const s = campaigns.filter(c => c.total_sent > 0); return s.length ? (s.reduce((a, c) => a + c.total_clicked / c.total_sent, 0) / s.length * 100).toFixed(1) + "%" : "—"; })() },
            { label: "Conversions", value: campaigns.reduce((s, c) => s + c.total_converted, 0).toLocaleString() },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search campaigns…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
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
                    {["Campaign", "Type", "Status", "Sent", "Open Rate", "CTR", "Converted", "Scheduled", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 9 }).map((__, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-16" /></td>)}
                    </tr>
                  )) : filtered.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">No campaigns yet</td></tr>
                  ) : filtered.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-foreground max-w-[160px] truncate">{c.name}</p>
                        {c.subject && <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.subject}</p>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs capitalize">{c.campaign_type.replace(/_/g, " ")}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs capitalize ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>{c.status}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">{c.total_sent.toLocaleString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">{openRate(c)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">{ctr(c)}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">{c.total_converted}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {c.status === "active" || c.status === "sending" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-amber-500 hover:bg-amber-500/10"
                              onClick={() => updateStatus(c.id, "paused")} disabled={actionLoading === c.id + "paused"} title="Pause">
                              <Pause className="w-3 h-3" />
                            </Button>
                          ) : c.status === "paused" || c.status === "draft" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-green-500 hover:bg-green-500/10"
                              onClick={() => updateStatus(c.id, "sending")} disabled={actionLoading === c.id + "sending"} title="Resume/Send">
                              <Play className="w-3 h-3" />
                            </Button>
                          ) : null}
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => duplicate(c)} title="Duplicate">
                            <Copy className="w-3 h-3" />
                          </Button>
                          {c.status !== "archived" && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                              onClick={() => updateStatus(c.id, "archived")} title="Archive">
                              <Archive className="w-3 h-3" />
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
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Summer Promo 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.campaign_type} onValueChange={v => setF("campaign_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Email Subject</Label>
              <Input value={form.subject} onChange={e => setF("subject", e.target.value)} placeholder="Your email subject line" />
            </div>
            <div className="space-y-1.5">
              <Label>Email Body (HTML)</Label>
              <Textarea rows={5} value={form.body_html} onChange={e => setF("body_html", e.target.value)} className="font-mono text-sm resize-none" placeholder="<p>Email content here</p>" />
            </div>
            <div className="space-y-1.5">
              <Label>Schedule Send (optional)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setF("scheduled_at", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={saveCampaign} disabled={saving}>
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />} Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
