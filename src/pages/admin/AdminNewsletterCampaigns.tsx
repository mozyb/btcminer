import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Plus, RefreshCw, Send, Eye, Trash2, Pencil, Users, BarChart3, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  status: string;
  audience_filter: Record<string, unknown>;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-primary/10 text-primary border-primary/20",
  sending: "bg-warning/10 text-warning border-warning/20",
  completed: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const AUDIENCE_OPTIONS = [
  { value: "all_verified", label: "All Verified Users" },
  { value: "active_miners", label: "Active Miners" },
  { value: "inactive", label: "Inactive Users (30+ days)" },
  { value: "kyc_approved", label: "KYC Approved" },
  { value: "no_contract", label: "Users Without Contracts" },
];

const EMPTY_FORM = { name: "", subject: "", html_body: "", audience: "all_verified", schedule_send: false, scheduled_at: "" };

export default function AdminNewsletterCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("newsletter_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleSaveDraft = async () => {
    if (!form.name || !form.subject) { toast.error("Name and subject are required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("newsletter_campaigns").insert({
        name: form.name, subject: form.subject, html_body: form.html_body,
        status: "draft", audience_filter: { type: form.audience },
        scheduled_at: form.schedule_send && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Campaign saved as draft");
      setCreateOpen(false); setForm(EMPTY_FORM);
      fetchCampaigns();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleSendNow = async (c: Campaign) => {
    // Update status to 'sending' — in production this triggers the edge function
    await supabase.from("newsletter_campaigns").update({ status: "sending", started_at: new Date().toISOString() }).eq("id", c.id);
    toast.success("Campaign started — emails are being queued");
    fetchCampaigns();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("newsletter_campaigns").delete().eq("id", deleteTarget.id);
    toast.success("Campaign deleted");
    setDeleteTarget(null); setDeleting(false);
    fetchCampaigns();
  };

  const cancelCampaign = async (c: Campaign) => {
    await supabase.from("newsletter_campaigns").update({ status: "cancelled" }).eq("id", c.id);
    toast.info("Campaign cancelled");
    fetchCampaigns();
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Newsletter Campaigns</h2>
            <p className="text-sm text-muted-foreground">{campaigns.length} campaigns · {campaigns.filter(c=>c.status==='completed').length} completed</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetchCampaigns}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-sm gap-1.5" onClick={()=>{setForm(EMPTY_FORM);setCreateOpen(true);}}>
              <Plus className="w-4 h-4"/>New Campaign
            </Button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Campaigns", val: campaigns.length, color: "text-foreground" },
            { label: "Completed", val: campaigns.filter(c=>c.status==='completed').length, color: "text-success" },
            { label: "Scheduled", val: campaigns.filter(c=>c.status==='scheduled').length, color: "text-primary" },
            { label: "Drafts", val: campaigns.filter(c=>c.status==='draft').length, color: "text-warning" },
          ].map(k => (
            <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Campaign list */}
        {loading ? (
          <div className="space-y-3">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 bg-muted rounded-lg"/>)}</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-border rounded-xl bg-muted/20">
            <Send className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
            <p className="text-sm font-medium text-foreground mb-2">No campaigns yet</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm" onClick={()=>{setForm(EMPTY_FORM);setCreateOpen(true);}}>
              <Plus className="w-4 h-4 mr-1"/>Create Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => {
              const openRate = c.sent_count > 0 ? ((c.opened_count / c.sent_count) * 100).toFixed(1) : "—";
              const delivRate = c.sent_count > 0 ? ((c.delivered_count / c.sent_count) * 100).toFixed(1) : "—";
              return (
                <div key={c.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex flex-col md:flex-row md:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-sm text-foreground">{c.name}</p>
                        <Badge className={`text-xs ${STATUS_STYLES[c.status] ?? 'bg-muted'}`}>{c.status}</Badge>
                        {!!c.audience_filter?.type && (
                          <Badge className="text-xs bg-muted text-muted-foreground border-border">
                            {AUDIENCE_OPTIONS.find(a=>a.value===String(c.audience_filter['type']))?.label ?? String(c.audience_filter['type'])}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{c.subject}</p>
                      {c.status !== 'draft' && (
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span><span className="text-muted-foreground">Recipients:</span> <span className="font-mono text-foreground">{c.recipient_count.toLocaleString()}</span></span>
                          <span><span className="text-muted-foreground">Sent:</span> <span className="font-mono text-foreground">{c.sent_count.toLocaleString()}</span></span>
                          <span><span className="text-muted-foreground">Delivered:</span> <span className="font-mono text-success">{delivRate}%</span></span>
                          <span><span className="text-muted-foreground">Open Rate:</span> <span className="font-mono text-primary">{openRate}%</span></span>
                          <span><span className="text-muted-foreground">Clicks:</span> <span className="font-mono text-foreground">{c.clicked_count}</span></span>
                          <span><span className="text-muted-foreground">Unsub:</span> <span className="font-mono text-destructive">{c.unsubscribed_count}</span></span>
                        </div>
                      )}
                      {c.scheduled_at && c.status === 'scheduled' && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Scheduled: {new Date(c.scheduled_at).toLocaleString()}</p>
                      )}
                      {c.completed_at && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success"/>Completed: {new Date(c.completed_at).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={()=>setPreviewCampaign(c)}><Eye className="w-3 h-3"/>Preview</Button>
                      {c.status === 'draft' && (
                        <Button size="sm" className="h-7 text-xs gap-1 px-2 bg-success text-white hover:bg-success/90" onClick={()=>handleSendNow(c)}><Send className="w-3 h-3"/>Send Now</Button>
                      )}
                      {c.status === 'sending' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={()=>cancelCampaign(c)}><XCircle className="w-3 h-3"/>Cancel</Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={()=>setDeleteTarget(c)}><Trash2 className="w-3 h-3"/></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Create Newsletter Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs font-normal mb-1 block">Campaign Name *</Label>
              <Input className="h-8 text-xs" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. June Mining Update"/></div>
            <div><Label className="text-xs font-normal mb-1 block">Subject Line *</Label>
              <Input className="h-8 text-xs" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="Your June mining rewards are ready!"/></div>
            <div><Label className="text-xs font-normal mb-1 block">Audience</Label>
              <Select value={form.audience} onValueChange={v=>setForm(f=>({...f,audience:v}))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{AUDIENCE_OPTIONS.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs font-normal mb-1 block">HTML Body</Label>
              <textarea
                value={form.html_body}
                onChange={e=>setForm(f=>({...f,html_body:e.target.value}))}
                className="w-full h-48 text-xs font-mono border border-input rounded-md p-3 bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="<html><body>...</body></html>"
              /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.schedule_send} onCheckedChange={v=>setForm(f=>({...f,schedule_send:v}))}/>
              <Label className="text-xs font-normal">Schedule send</Label>
            </div>
            {form.schedule_send && (
              <div><Label className="text-xs font-normal mb-1 block">Scheduled Date & Time</Label>
                <Input type="datetime-local" className="h-8 text-xs" value={form.scheduled_at} onChange={e=>setForm(f=>({...f,scheduled_at:e.target.value}))}/></div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5" onClick={handleSaveDraft} disabled={saving}><FileText className="w-3.5 h-3.5"/>{saving?"Saving…":"Save Draft"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewCampaign} onOpenChange={v=>{if(!v) setPreviewCampaign(null);}}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Preview: {previewCampaign?.name}</DialogTitle></DialogHeader>
          {previewCampaign && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Subject: <span className="text-foreground">{previewCampaign.subject}</span></p>
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe srcDoc={previewCampaign.html_body || "<html><body><p>No HTML body yet.</p></body></html>"} className="w-full h-96 bg-white" sandbox="allow-same-origin" title="Campaign Preview"/>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v=>{if(!v) setDeleteTarget(null);}}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription><strong>{deleteTarget?.name}</strong> will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting?"Deleting…":"Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
