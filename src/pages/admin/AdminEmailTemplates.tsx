import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { RefreshCw, Pencil, Copy, Send, RotateCcw, Search, X, Mail, Eye, Code2, FileText } from "lucide-react";

interface EmailTemplate {
  id: string;
  category: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  text_body: string;
  variables: string[];
  is_active: boolean;
  version: number;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  authentication: "Authentication", security: "Security", wallet: "Wallet",
  mining: "Mining", account: "Account", support: "Support", newsletter: "Newsletter",
};
const CATEGORY_COLORS: Record<string, string> = {
  authentication: "bg-primary/10 text-primary border-primary/20",
  security: "bg-destructive/10 text-destructive border-destructive/20",
  wallet: "bg-success/10 text-success border-success/20",
  mining: "bg-warning/10 text-warning border-warning/20",
  account: "bg-muted text-muted-foreground border-border",
  support: "bg-info/10 text-info border-info/20",
  newsletter: "bg-muted text-muted-foreground border-border",
};

const TEMPLATE_VARS = [
  "{{first_name}}","{{last_name}}","{{username}}","{{email}}",
  "{{verification_link}}","{{reset_link}}","{{contract_name}}","{{hashrate}}",
  "{{reward_amount}}","{{wallet_address}}","{{transaction_id}}","{{ticket_number}}",
  "{{current_date}}","{{company_name}}","{{support_email}}","{{dashboard_link}}",
];

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ subject: "", html_body: "", text_body: "", is_active: true });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("email_templates").select("*").order("category").order("name");
    if (categoryFilter !== "all") q = q.eq("category", categoryFilter);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data } = await q;
    setTemplates((data ?? []) as EmailTemplate[]);
    setLoading(false);
  }, [categoryFilter, search]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openEdit = (t: EmailTemplate) => {
    setEditTarget(t);
    setForm({ subject: t.subject, html_body: t.html_body, text_body: t.text_body, is_active: t.is_active });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("email_templates").update({
        subject: form.subject, html_body: form.html_body, text_body: form.text_body,
        is_active: form.is_active, version: editTarget.version + 1, updated_at: new Date().toISOString(),
      }).eq("id", editTarget.id);
      if (error) throw error;
      toast.success("Template saved");
      setEditOpen(false);
      fetchTemplates();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDuplicate = async (t: EmailTemplate) => {
    const { error } = await supabase.from("email_templates").insert({
      category: t.category, slug: `${t.slug}_copy_${Date.now()}`,
      name: `${t.name} (Copy)`, subject: t.subject,
      html_body: t.html_body, text_body: t.text_body,
      variables: t.variables, is_active: false,
    });
    if (error) toast.error("Duplicate failed");
    else { toast.success("Template duplicated"); fetchTemplates(); }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testTemplate) { toast.error("Enter recipient email"); return; }
    setSending(true);
    try {
      await supabase.from("email_queue").insert({
        to_email: testEmail, subject: `[TEST] ${testTemplate.subject}`,
        html_body: testTemplate.html_body, text_body: testTemplate.text_body,
        template_slug: testTemplate.slug, status: "queued", priority: 10,
      });
      toast.success("Test email queued");
      setTestOpen(false); setTestEmail("");
    } catch { toast.error("Failed to queue test email"); }
    finally { setSending(false); }
  };

  const insertVar = (v: string) => {
    setForm(f => ({ ...f, html_body: f.html_body + v }));
  };

  const grouped = templates.reduce<Record<string, EmailTemplate[]>>((acc, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Templates</h2>
            <p className="text-sm text-muted-foreground">{templates.length} templates · {templates.filter(t=>t.is_active).length} active</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={fetchTemplates}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
            <Input placeholder="Search templates…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-8 h-8 text-xs"/>
            {search && <button onClick={()=>setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5"/></button>}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 text-xs w-44 shrink-0"><SelectValue placeholder="Category"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Templates by category */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-36 bg-muted rounded-lg"/>)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-14 border border-dashed border-border rounded-xl bg-muted/20">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3"/>
            <p className="text-sm text-muted-foreground">No templates found</p>
          </div>
        ) : Object.entries(grouped).map(([category, tpls]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{CATEGORY_LABELS[category] ?? category}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tpls.map(t => (
                <div key={t.id} className={`border border-border rounded-lg p-4 bg-card flex flex-col gap-2 ${!t.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.subject}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${CATEGORY_COLORS[t.category] ?? 'bg-muted'}`}>{CATEGORY_LABELS[t.category]??t.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">v{t.version}</span>
                    <span>·</span>
                    <span>{t.is_active ? <span className="text-success">Active</span> : <span className="text-muted-foreground">Inactive</span>}</span>
                    <span>·</span>
                    <span>Updated {new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1.5 mt-auto">
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-7 gap-1" onClick={()=>openEdit(t)}><Pencil className="w-3 h-3"/>Edit</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={()=>{setPreviewTemplate(t);setPreviewOpen(true);}}><Eye className="w-3 h-3"/></Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={()=>{setTestTemplate(t);setTestOpen(true);setTestEmail("");}}><Send className="w-3 h-3"/></Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={()=>handleDuplicate(t)}><Copy className="w-3 h-3"/></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Edit: {editTarget?.name}</DialogTitle></DialogHeader>
          <Tabs defaultValue="html">
            <div className="flex items-center justify-between mb-3">
              <TabsList className="h-8 text-xs">
                <TabsTrigger value="html" className="text-xs gap-1 h-7"><Code2 className="w-3.5 h-3.5"/>HTML</TabsTrigger>
                <TabsTrigger value="text" className="text-xs gap-1 h-7"><FileText className="w-3.5 h-3.5"/>Plain Text</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v=>setForm(f=>({...f,is_active:v}))}/>
                <Label className="text-xs font-normal">Active</Label>
              </div>
            </div>

            {/* Subject line */}
            <div className="mb-3">
              <Label className="text-xs font-normal mb-1 block">Subject Line</Label>
              <Input className="h-8 text-xs" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
            </div>

            {/* Variable chips */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">Click to insert variable into HTML body:</p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARS.map(v => (
                  <button key={v} onClick={()=>insertVar(v)}
                    className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5 hover:bg-primary/20 transition-colors">
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <TabsContent value="html" className="mt-0">
              <Label className="text-xs font-normal mb-1 block">HTML Body</Label>
              <textarea
                value={form.html_body}
                onChange={e=>setForm(f=>({...f,html_body:e.target.value}))}
                className="w-full h-72 text-xs font-mono border border-input rounded-md p-3 bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                spellCheck={false}
              />
            </TabsContent>
            <TabsContent value="text" className="mt-0">
              <Label className="text-xs font-normal mb-1 block">Plain Text Body</Label>
              <textarea
                value={form.text_body}
                onChange={e=>setForm(f=>({...f,text_body:e.target.value}))}
                className="w-full h-72 text-xs font-mono border border-input rounded-md p-3 bg-background text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                spellCheck={false}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter className="gap-2 mt-3">
            <Button variant="outline" onClick={()=>setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save Template"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Preview: {previewTemplate?.name}</DialogTitle></DialogHeader>
          {previewTemplate && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-2">Subject: <span className="text-foreground">{previewTemplate.subject}</span></p>
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={previewTemplate.html_body.replace(/{{[^}]+}}/g, m => `<span style="background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;font-size:11px">${m}</span>`)}
                  className="w-full h-96 bg-white"
                  sandbox="allow-same-origin"
                  title="Email Preview"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test Send Modal */}
      <Dialog open={testOpen} onOpenChange={v=>{if(!v){setTestOpen(false);setTestEmail("");}}}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader><DialogTitle className="text-base">Send Test: {testTemplate?.name}</DialogTitle></DialogHeader>
          <div className="py-3 space-y-2">
            <Label className="text-xs font-normal mb-1 block">Recipient Email</Label>
            <Input type="email" className="h-8 text-xs" value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="you@example.com"/>
            <p className="text-xs text-muted-foreground">Variables will use placeholder values in the test email.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={()=>setTestOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5" onClick={handleSendTest} disabled={sending}><Send className="w-3.5 h-3.5"/>{sending?"Sending…":"Send Test"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
