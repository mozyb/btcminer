import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, GripVertical, BarChart3, FileText, HelpCircle, Link as LinkIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MarketplaceStat { id: string; key: string; value: string; label: string | null; sort_order: number; }
interface MarketplaceContent { id: string; key: string; title: string | null; body: string; visible: boolean; sort_order: number; }
interface MarketplaceFaq { id: string; question: string; answer: string; sort_order: number; visible: boolean; }
interface MarketplaceLink { id: string; anchor_text: string; target_url: string; description: string | null; sort_order: number; visible: boolean; }

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ stat, onSave }: { stat: MarketplaceStat; onSave: (id: string, value: string, label: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(stat.value);
  const [label, setLabel]     = useState(stat.label ?? "");

  const save = () => { onSave(stat.id, value, label); setEditing(false); };

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded bg-card">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="grid grid-cols-2 gap-2">
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Label" className="h-8 text-sm" />
            <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Value" className="h-8 text-sm font-mono" />
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">{stat.label ?? stat.key}</p>
            <p className="font-mono font-bold text-primary">{stat.value}</p>
          </div>
        )}
      </div>
      {editing ? (
        <div className="flex gap-1 shrink-0">
          <Button size="sm" className="h-7 px-2 text-xs" onClick={save}>Save</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0" onClick={() => setEditing(true)}>
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export default function AdminMarketplace() {
  const [stats,    setStats]    = useState<MarketplaceStat[]>([]);
  const [content,  setContent]  = useState<MarketplaceContent[]>([]);
  const [faq,      setFaq]      = useState<MarketplaceFaq[]>([]);
  const [links,    setLinks]    = useState<MarketplaceLink[]>([]);
  const [loading,  setLoading]  = useState(true);

  // FAQ dialog
  const [faqDialog, setFaqDialog] = useState(false);
  const [editFaq,   setEditFaq]   = useState<Partial<MarketplaceFaq> | null>(null);

  // Link dialog
  const [linkDialog, setLinkDialog] = useState(false);
  const [editLink,   setEditLink]   = useState<Partial<MarketplaceLink> | null>(null);

  // Content editor
  const [editContent, setEditContent] = useState<MarketplaceContent | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [s, c, f, l] = await Promise.all([
      supabase.from("marketplace_stats").select("*").order("sort_order"),
      supabase.from("marketplace_content").select("*").order("sort_order"),
      supabase.from("marketplace_faq").select("*").order("sort_order"),
      supabase.from("marketplace_links").select("*").order("sort_order"),
    ]);
    setStats(s.data ?? []);
    setContent(c.data ?? []);
    setFaq(f.data ?? []);
    setLinks(l.data ?? []);
    setLoading(false);
  };

  // Stats
  const saveStat = async (id: string, value: string, label: string) => {
    const { error } = await supabase.from("marketplace_stats").update({ value, label }).eq("id", id);
    if (error) { toast.error("Failed to save stat"); return; }
    setStats(prev => prev.map(s => s.id === id ? { ...s, value, label } : s));
    toast.success("Stat updated");
  };

  // Content
  const saveContent = async () => {
    if (!editContent) return;
    const { error } = await supabase.from("marketplace_content").update({
      title: editContent.title,
      body:  editContent.body,
      visible: editContent.visible,
    }).eq("id", editContent.id);
    if (error) { toast.error("Failed to save content"); return; }
    setContent(prev => prev.map(c => c.id === editContent.id ? editContent : c));
    setEditContent(null);
    toast.success("Content updated");
  };

  // FAQ CRUD
  const openNewFaq   = () => { setEditFaq({ question: "", answer: "", sort_order: faq.length + 1, visible: true }); setFaqDialog(true); };
  const openEditFaq  = (f: MarketplaceFaq) => { setEditFaq({ ...f }); setFaqDialog(true); };
  const saveFaq = async () => {
    if (!editFaq?.question || !editFaq.answer) return;
    if (editFaq.id) {
      const { error } = await supabase.from("marketplace_faq").update({ question: editFaq.question, answer: editFaq.answer, sort_order: editFaq.sort_order, visible: editFaq.visible }).eq("id", editFaq.id);
      if (error) { toast.error("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("marketplace_faq").insert({ question: editFaq.question, answer: editFaq.answer, sort_order: editFaq.sort_order ?? faq.length + 1, visible: editFaq.visible ?? true });
      if (error) { toast.error("Failed to create"); return; }
    }
    await fetchAll();
    setFaqDialog(false);
    toast.success("FAQ saved");
  };
  const deleteFaq = async (id: string) => {
    await supabase.from("marketplace_faq").delete().eq("id", id);
    setFaq(prev => prev.filter(f => f.id !== id));
    toast.success("FAQ deleted");
  };
  const toggleFaqVisible = async (f: MarketplaceFaq) => {
    await supabase.from("marketplace_faq").update({ visible: !f.visible }).eq("id", f.id);
    setFaq(prev => prev.map(x => x.id === f.id ? { ...x, visible: !x.visible } : x));
  };

  // Link CRUD
  const openNewLink   = () => { setEditLink({ anchor_text: "", target_url: "", description: "", sort_order: links.length + 1, visible: true }); setLinkDialog(true); };
  const openEditLink  = (l: MarketplaceLink) => { setEditLink({ ...l }); setLinkDialog(true); };
  const saveLink = async () => {
    if (!editLink?.anchor_text || !editLink.target_url) return;
    if (editLink.id) {
      const { error } = await supabase.from("marketplace_links").update({ anchor_text: editLink.anchor_text, target_url: editLink.target_url, description: editLink.description, sort_order: editLink.sort_order, visible: editLink.visible }).eq("id", editLink.id);
      if (error) { toast.error("Failed to save"); return; }
    } else {
      const { error } = await supabase.from("marketplace_links").insert({ anchor_text: editLink.anchor_text, target_url: editLink.target_url, description: editLink.description, sort_order: editLink.sort_order ?? links.length + 1, visible: editLink.visible ?? true });
      if (error) { toast.error("Failed to create"); return; }
    }
    await fetchAll();
    setLinkDialog(false);
    toast.success("Link saved");
  };
  const deleteLink = async (id: string) => {
    await supabase.from("marketplace_links").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast.success("Link deleted");
  };
  const toggleLinkVisible = async (l: MarketplaceLink) => {
    await supabase.from("marketplace_links").update({ visible: !l.visible }).eq("id", l.id);
    setLinks(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace Content</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all content displayed on the public hashrate marketplace page.</p>
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="mb-6">
            <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Stats</TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Content Blocks</TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5"><HelpCircle className="w-3.5 h-3.5" />FAQ</TabsTrigger>
            <TabsTrigger value="links" className="gap-1.5"><LinkIcon className="w-3.5 h-3.5" />SEO Links</TabsTrigger>
          </TabsList>

          {/* ── Stats ── */}
          <TabsContent value="stats">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">Marketplace Statistics</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
                  <div className="space-y-3">
                    {stats.map(s => <StatRow key={s.id} stat={s} onSave={saveStat} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Content Blocks ── */}
          <TabsContent value="content">
            {editContent ? (
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Edit: {editContent.title ?? editContent.key}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditContent(null)}>Cancel</Button>
                      <Button size="sm" onClick={saveContent}>Save</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm mb-1 block">Title</Label>
                    <Input value={editContent.title ?? ""} onChange={e => setEditContent({ ...editContent, title: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm mb-1 block">Body (Markdown supported)</Label>
                    <Textarea value={editContent.body} onChange={e => setEditContent({ ...editContent, body: e.target.value })} rows={16} className="font-mono text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editContent.visible} onCheckedChange={v => setEditContent({ ...editContent, visible: v })} />
                    <span className="text-sm text-muted-foreground">Visible</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : content.map(c => (
                  <Card key={c.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{c.title ?? c.key}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.body.slice(0, 120)}…</p>
                      </div>
                      <Badge className={c.visible ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                        {c.visible ? "Visible" : "Hidden"}
                      </Badge>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditContent(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── FAQ ── */}
          <TabsContent value="faq">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="gap-1.5" onClick={openNewFaq}><Plus className="w-3.5 h-3.5" />Add FAQ</Button>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <div className="space-y-3">
                {faq.map(f => (
                  <Card key={f.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{f.question}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={f.visible} onCheckedChange={() => toggleFaqVisible(f)} />
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditFaq(f)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteFaq(f.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── SEO Links ── */}
          <TabsContent value="links">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="gap-1.5" onClick={openNewLink}><Plus className="w-3.5 h-3.5" />Add Link</Button>
            </div>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <div className="space-y-3">
                {links.map(l => (
                  <Card key={l.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{l.anchor_text}</p>
                        <p className="text-xs text-muted-foreground font-mono">{l.target_url}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={l.visible} onCheckedChange={() => toggleLinkVisible(l)} />
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => openEditLink(l)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteLink(l.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editFaq?.id ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1 block">Question</Label>
              <Input value={editFaq?.question ?? ""} onChange={e => setEditFaq(prev => ({ ...prev!, question: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Answer</Label>
              <Textarea value={editFaq?.answer ?? ""} onChange={e => setEditFaq(prev => ({ ...prev!, answer: e.target.value }))} rows={5} />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Sort Order</Label>
              <Input type="number" value={editFaq?.sort_order ?? 0} onChange={e => setEditFaq(prev => ({ ...prev!, sort_order: +e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setFaqDialog(false)}>Cancel</Button>
              <Button onClick={saveFaq}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editLink?.id ? "Edit Link" : "Add SEO Link"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-1 block">Anchor Text</Label>
              <Input value={editLink?.anchor_text ?? ""} onChange={e => setEditLink(prev => ({ ...prev!, anchor_text: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Target URL</Label>
              <Input value={editLink?.target_url ?? ""} onChange={e => setEditLink(prev => ({ ...prev!, target_url: e.target.value }))} placeholder="/calculator" />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Description</Label>
              <Input value={editLink?.description ?? ""} onChange={e => setEditLink(prev => ({ ...prev!, description: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLinkDialog(false)}>Cancel</Button>
              <Button onClick={saveLink}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
