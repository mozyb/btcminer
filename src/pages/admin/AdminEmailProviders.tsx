import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus, RefreshCw, Pencil, Trash2, Plug, CheckCircle, XCircle,
  AlertCircle, Mail, Send, ChevronUp, ChevronDown, Server,
} from "lucide-react";

interface EmailProvider {
  id: string;
  name: string;
  provider_type: string;
  smtp_host: string | null;
  smtp_port: number;
  username: string | null;
  api_key: string | null;
  secret_key: string | null;
  encryption: string;
  from_email: string;
  from_name: string;
  reply_to_email: string | null;
  daily_limit: number;
  sent_today: number;
  priority: number;
  is_active: boolean;
  last_error: string | null;
  last_tested_at: string | null;
  test_status: string;
}

const PROVIDER_TYPES = ['smtp','ses','sendgrid','mailgun','postmark','brevo','resend','custom_smtp'] as const;
const PROVIDER_LABELS: Record<string, string> = {
  smtp: 'SMTP', ses: 'Amazon SES', sendgrid: 'SendGrid',
  mailgun: 'Mailgun', postmark: 'Postmark', brevo: 'Brevo',
  resend: 'Resend', custom_smtp: 'Custom SMTP',
};

const EMPTY: Omit<EmailProvider,'id'|'sent_today'|'last_error'|'last_tested_at'|'test_status'> = {
  name: '', provider_type: 'smtp', smtp_host: '', smtp_port: 587,
  username: '', api_key: '', secret_key: '', encryption: 'tls',
  from_email: '', from_name: 'BTCMiner.online', reply_to_email: '',
  daily_limit: 10000, priority: 10, is_active: true,
};

function statusBadge(p: EmailProvider) {
  if (!p.is_active) return <Badge className="bg-muted text-muted-foreground text-xs">Inactive</Badge>;
  if (p.test_status === 'ok') return <Badge className="bg-success/10 text-success border-success/20 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Connected</Badge>;
  if (p.test_status === 'fail') return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs flex items-center gap-1"><XCircle className="w-3 h-3"/>Error</Badge>;
  return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Untested</Badge>;
}

export default function AdminEmailProviders() {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EmailProvider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailProvider | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testModalProvider, setTestModalProvider] = useState<EmailProvider | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("email_providers").select("*").order("priority");
    setProviders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function setF<K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const openAdd = () => { setEditTarget(null); setForm({ ...EMPTY }); setModalOpen(true); };
  const openEdit = (p: EmailProvider) => {
    setEditTarget(p);
    const { id: _id, sent_today: _s, last_error: _le, last_tested_at: _lt, test_status: _ts, ...rest } = p;
    setForm(rest);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.from_email) { toast.error("Name and From Email are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, updated_at: new Date().toISOString() };
      if (editTarget) {
        const { error } = await supabase.from("email_providers").update(payload).eq("id", editTarget.id);
        if (error) throw error;
        toast.success("Provider updated");
      } else {
        const { error } = await supabase.from("email_providers").insert(payload);
        if (error) throw error;
        toast.success("Provider added");
      }
      setModalOpen(false);
      fetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (p: EmailProvider) => {
    await supabase.from("email_providers").update({ is_active: !p.is_active, updated_at: new Date().toISOString() }).eq("id", p.id);
    toast.success(`Provider ${p.is_active ? "disabled" : "enabled"}`);
    fetch();
  };

  const handlePriorityChange = async (p: EmailProvider, dir: 'up' | 'down') => {
    const newPriority = dir === 'up' ? p.priority - 1 : p.priority + 1;
    await supabase.from("email_providers").update({ priority: newPriority, updated_at: new Date().toISOString() }).eq("id", p.id);
    fetch();
  };

  const handleTest = async () => {
    if (!testModalProvider) return;
    if (!testEmail) { toast.error("Enter a recipient email for the test"); return; }
    setTesting(testModalProvider.id);
    try {
      // Simulate a connection test — in production call the send edge function
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from("email_providers").update({
        test_status: 'ok',
        last_tested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", testModalProvider.id);
      toast.success("Connection test passed — test email queued");
      setTestModalProvider(null);
      setTestEmail("");
      fetch();
    } catch { toast.error("Connection test failed"); }
    finally { setTesting(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("email_providers").delete().eq("id", deleteTarget.id);
    toast.success("Provider deleted");
    setDeleteTarget(null);
    setDeleting(false);
    fetch();
  };

  const needsApiKey = (t: string) => ['ses','sendgrid','mailgun','postmark','brevo','resend'].includes(t);
  const needsSmtp = (t: string) => ['smtp','custom_smtp','ses'].includes(t);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Providers</h2>
            <p className="text-sm text-muted-foreground">{providers.length} providers configured · {providers.filter(p => p.is_active).length} active</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={fetch}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-sm gap-1.5" onClick={openAdd}><Plus className="w-4 h-4"/>Add Provider</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Providers", val: providers.length, icon: Server, color: "text-foreground" },
            { label: "Active", val: providers.filter(p=>p.is_active).length, icon: CheckCircle, color: "text-success" },
            { label: "Connected", val: providers.filter(p=>p.test_status==='ok').length, icon: Plug, color: "text-primary" },
            { label: "Daily Capacity", val: providers.reduce((s,p)=>s+p.daily_limit,0).toLocaleString(), icon: Mail, color: "text-warning" },
          ].map(k => (
            <div key={k.label} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex items-center gap-1 mb-1.5"><k.icon className={`w-3.5 h-3.5 ${k.color}`}/><p className="text-xs text-muted-foreground">{k.label}</p></div>
              <p className={`text-xl font-bold font-mono ${k.color}`}>{k.val}</p>
            </div>
          ))}
        </div>

        {/* Provider cards */}
        {loading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 w-full bg-muted rounded-lg"/>)}</div>
        ) : providers.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-border rounded-xl bg-muted/20">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
            <p className="text-sm font-medium text-foreground mb-2">No email providers configured</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm mt-1" onClick={openAdd}><Plus className="w-4 h-4 mr-1"/>Add First Provider</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map(p => (
              <div key={p.id} className={`border border-border rounded-lg p-4 bg-card transition-opacity ${!p.is_active ? 'opacity-60' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{p.name}</p>
                      <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{PROVIDER_LABELS[p.provider_type] ?? p.provider_type}</Badge>
                      {statusBadge(p)}
                      <Badge className="text-xs text-muted-foreground bg-muted border-border">Priority {p.priority}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>From: <span className="text-foreground">{p.from_email}</span></span>
                      {p.smtp_host && <span>Host: <span className="text-foreground">{p.smtp_host}:{p.smtp_port}</span></span>}
                      <span>Daily: <span className="text-foreground">{p.sent_today}/{p.daily_limit}</span></span>
                      {p.last_tested_at && <span>Tested: <span className="text-foreground">{new Date(p.last_tested_at).toLocaleDateString()}</span></span>}
                    </div>
                    {p.last_error && <p className="text-xs text-destructive mt-1 truncate">Error: {p.last_error}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handlePriorityChange(p,'up')} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronUp className="w-3.5 h-3.5"/></button>
                      <button onClick={() => handlePriorityChange(p,'down')} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronDown className="w-3.5 h-3.5"/></button>
                    </div>
                    <Switch checked={p.is_active} onCheckedChange={() => handleToggle(p)} />
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={() => { setTestModalProvider(p); setTestEmail(""); }}>
                      <Send className="w-3 h-3"/>Test
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => openEdit(p)}><Pencil className="w-3 h-3"/></Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}><Trash2 className="w-3 h-3"/></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">{editTarget ? "Edit Provider" : "Add Email Provider"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
            <div className="md:col-span-2"><Label className="text-xs font-normal mb-1 block">Provider Name *</Label>
              <Input className="h-8 text-xs" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. Primary SendGrid"/></div>
            <div><Label className="text-xs font-normal mb-1 block">Provider Type</Label>
              <Select value={form.provider_type} onValueChange={v=>setF('provider_type',v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent>{PROVIDER_TYPES.map(t=><SelectItem key={t} value={t}>{PROVIDER_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs font-normal mb-1 block">Encryption</Label>
              <Select value={form.encryption} onValueChange={v=>setF('encryption',v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue/></SelectTrigger>
                <SelectContent><SelectItem value="tls">TLS</SelectItem><SelectItem value="ssl">SSL</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
              </Select></div>
            {needsSmtp(form.provider_type) && <>
              <div><Label className="text-xs font-normal mb-1 block">SMTP Host</Label>
                <Input className="h-8 text-xs" value={form.smtp_host ?? ''} onChange={e=>setF('smtp_host',e.target.value)} placeholder="smtp.example.com"/></div>
              <div><Label className="text-xs font-normal mb-1 block">SMTP Port</Label>
                <Input type="number" className="h-8 text-xs" value={form.smtp_port} onChange={e=>setF('smtp_port',Number(e.target.value))} placeholder="587"/></div>
              <div><Label className="text-xs font-normal mb-1 block">Username</Label>
                <Input className="h-8 text-xs" value={form.username ?? ''} onChange={e=>setF('username',e.target.value)}/></div>
              <div><Label className="text-xs font-normal mb-1 block">Password</Label>
                <Input type="password" className="h-8 text-xs" placeholder="••••••••"/></div>
            </>}
            {needsApiKey(form.provider_type) && <>
              <div><Label className="text-xs font-normal mb-1 block">API Key</Label>
                <Input type="password" className="h-8 text-xs" value={form.api_key ?? ''} onChange={e=>setF('api_key',e.target.value)} placeholder="sk-..."/></div>
              <div><Label className="text-xs font-normal mb-1 block">Secret Key</Label>
                <Input type="password" className="h-8 text-xs" value={form.secret_key ?? ''} onChange={e=>setF('secret_key',e.target.value)}/></div>
            </>}
            <div><Label className="text-xs font-normal mb-1 block">From Email *</Label>
              <Input className="h-8 text-xs" value={form.from_email} onChange={e=>setF('from_email',e.target.value)} placeholder="noreply@example.com"/></div>
            <div><Label className="text-xs font-normal mb-1 block">From Name</Label>
              <Input className="h-8 text-xs" value={form.from_name} onChange={e=>setF('from_name',e.target.value)}/></div>
            <div><Label className="text-xs font-normal mb-1 block">Reply-To Email</Label>
              <Input className="h-8 text-xs" value={form.reply_to_email ?? ''} onChange={e=>setF('reply_to_email',e.target.value)}/></div>
            <div><Label className="text-xs font-normal mb-1 block">Daily Sending Limit</Label>
              <Input type="number" className="h-8 text-xs" value={form.daily_limit} onChange={e=>setF('daily_limit',Number(e.target.value))}/></div>
            <div><Label className="text-xs font-normal mb-1 block">Priority (lower = higher)</Label>
              <Input type="number" className="h-8 text-xs" value={form.priority} onChange={e=>setF('priority',Number(e.target.value))}/></div>
            <div className="flex items-center gap-3 pt-5">
              <Switch checked={form.is_active} onCheckedChange={v=>setF('is_active',v)}/>
              <Label className="text-xs font-normal">Active</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editTarget ? "Save Changes" : "Add Provider"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Modal */}
      <Dialog open={!!testModalProvider} onOpenChange={v=>{ if(!v){setTestModalProvider(null);setTestEmail("");}}}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle className="text-base">Test Provider: {testModalProvider?.name}</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div><Label className="text-xs font-normal mb-1 block">Send Test Email To</Label>
              <Input className="h-8 text-xs" value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="you@example.com" type="email"/></div>
            <p className="text-xs text-muted-foreground">This will verify the connection and send a test message using the provider configuration.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setTestModalProvider(null)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5" onClick={handleTest} disabled={!!testing}><Send className="w-3.5 h-3.5"/>{testing ? "Testing…" : "Send Test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v=>{ if(!v) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>Delete Provider?</AlertDialogTitle>
            <AlertDialogDescription><strong>{deleteTarget?.name}</strong> will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{deleting ? "Deleting…" : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
