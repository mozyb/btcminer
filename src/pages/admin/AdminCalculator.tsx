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
import { Pencil, Trash2, Plus, GripVertical, FileText, HelpCircle, Cpu, Link as LinkIcon } from "lucide-react";

interface CalcContent  { id: string; key: string; title: string | null; body: string; visible: boolean; sort_order: number; }
interface CalcFaq      { id: string; question: string; answer: string; sort_order: number; visible: boolean; }
interface CalcHardware { id: string; model: string; manufacturer: string | null; hashrate_ths: number; power_watts: number; efficiency_jth: number | null; est_daily_usd: number | null; efficiency_rating: string | null; sort_order: number; visible: boolean; }
interface CalcLink     { id: string; anchor_text: string; target_url: string; description: string | null; sort_order: number; visible: boolean; }

export default function AdminCalculator() {
  const [content,  setContent]  = useState<CalcContent[]>([]);
  const [faq,      setFaq]      = useState<CalcFaq[]>([]);
  const [hardware, setHardware] = useState<CalcHardware[]>([]);
  const [links,    setLinks]    = useState<CalcLink[]>([]);
  const [loading,  setLoading]  = useState(true);

  const [editContent,  setEditContent]  = useState<CalcContent | null>(null);
  const [faqDialog,    setFaqDialog]    = useState(false);
  const [editFaq,      setEditFaq]      = useState<Partial<CalcFaq> | null>(null);
  const [hwDialog,     setHwDialog]     = useState(false);
  const [editHw,       setEditHw]       = useState<Partial<CalcHardware> | null>(null);
  const [linkDialog,   setLinkDialog]   = useState(false);
  const [editLink,     setEditLink]     = useState<Partial<CalcLink> | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [c, f, h, l] = await Promise.all([
      supabase.from("calculator_content").select("*").order("sort_order"),
      supabase.from("calculator_faq").select("*").order("sort_order"),
      supabase.from("calculator_hardware").select("*").order("sort_order"),
      supabase.from("calculator_links").select("*").order("sort_order"),
    ]);
    setContent(c.data ?? []);
    setFaq(f.data ?? []);
    setHardware(h.data ?? []);
    setLinks(l.data ?? []);
    setLoading(false);
  };

  // Content
  const saveContent = async () => {
    if (!editContent) return;
    const { error } = await supabase.from("calculator_content").update({ title: editContent.title, body: editContent.body, visible: editContent.visible }).eq("id", editContent.id);
    if (error) { toast.error("Failed to save"); return; }
    setContent(prev => prev.map(c => c.id === editContent.id ? editContent : c));
    setEditContent(null);
    toast.success("Content saved");
  };

  // FAQ
  const saveFaq = async () => {
    if (!editFaq?.question || !editFaq.answer) return;
    if (editFaq.id) {
      await supabase.from("calculator_faq").update({ question: editFaq.question, answer: editFaq.answer, sort_order: editFaq.sort_order, visible: editFaq.visible }).eq("id", editFaq.id);
    } else {
      await supabase.from("calculator_faq").insert({ question: editFaq.question, answer: editFaq.answer, sort_order: editFaq.sort_order ?? faq.length + 1, visible: true });
    }
    await fetchAll(); setFaqDialog(false); toast.success("FAQ saved");
  };
  const deleteFaq = async (id: string) => { await supabase.from("calculator_faq").delete().eq("id", id); setFaq(prev => prev.filter(f => f.id !== id)); toast.success("Deleted"); };
  const toggleFaq = async (f: CalcFaq) => { await supabase.from("calculator_faq").update({ visible: !f.visible }).eq("id", f.id); setFaq(prev => prev.map(x => x.id === f.id ? { ...x, visible: !x.visible } : x)); };

  // Hardware
  const saveHw = async () => {
    if (!editHw?.model) return;
    if (editHw.id) {
      await supabase.from("calculator_hardware").update({ model: editHw.model, manufacturer: editHw.manufacturer, hashrate_ths: editHw.hashrate_ths, power_watts: editHw.power_watts, efficiency_jth: editHw.efficiency_jth, est_daily_usd: editHw.est_daily_usd, efficiency_rating: editHw.efficiency_rating, sort_order: editHw.sort_order, visible: editHw.visible }).eq("id", editHw.id);
    } else {
      await supabase.from("calculator_hardware").insert({ model: editHw.model!, manufacturer: editHw.manufacturer, hashrate_ths: editHw.hashrate_ths ?? 0, power_watts: editHw.power_watts ?? 0, efficiency_jth: editHw.efficiency_jth, est_daily_usd: editHw.est_daily_usd, efficiency_rating: editHw.efficiency_rating, sort_order: hardware.length + 1, visible: true });
    }
    await fetchAll(); setHwDialog(false); toast.success("Hardware saved");
  };
  const deleteHw = async (id: string) => { await supabase.from("calculator_hardware").delete().eq("id", id); setHardware(prev => prev.filter(h => h.id !== id)); toast.success("Deleted"); };
  const toggleHw = async (h: CalcHardware) => { await supabase.from("calculator_hardware").update({ visible: !h.visible }).eq("id", h.id); setHardware(prev => prev.map(x => x.id === h.id ? { ...x, visible: !x.visible } : x)); };

  // Links
  const saveLink = async () => {
    if (!editLink?.anchor_text || !editLink.target_url) return;
    if (editLink.id) {
      await supabase.from("calculator_links").update({ anchor_text: editLink.anchor_text, target_url: editLink.target_url, description: editLink.description, sort_order: editLink.sort_order, visible: editLink.visible }).eq("id", editLink.id);
    } else {
      await supabase.from("calculator_links").insert({ anchor_text: editLink.anchor_text, target_url: editLink.target_url, description: editLink.description, sort_order: links.length + 1, visible: true });
    }
    await fetchAll(); setLinkDialog(false); toast.success("Link saved");
  };
  const deleteLink = async (id: string) => { await supabase.from("calculator_links").delete().eq("id", id); setLinks(prev => prev.filter(l => l.id !== id)); toast.success("Deleted"); };
  const toggleLink = async (l: CalcLink) => { await supabase.from("calculator_links").update({ visible: !l.visible }).eq("id", l.id); setLinks(prev => prev.map(x => x.id === l.id ? { ...x, visible: !x.visible } : x)); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calculator Content</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all content displayed on the public Mining Calculator page.</p>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="mb-6">
            <TabsTrigger value="content" className="gap-1.5"><FileText className="w-3.5 h-3.5" />Content</TabsTrigger>
            <TabsTrigger value="faq" className="gap-1.5"><HelpCircle className="w-3.5 h-3.5" />FAQ</TabsTrigger>
            <TabsTrigger value="hardware" className="gap-1.5"><Cpu className="w-3.5 h-3.5" />Hardware</TabsTrigger>
            <TabsTrigger value="links" className="gap-1.5"><LinkIcon className="w-3.5 h-3.5" />Links</TabsTrigger>
          </TabsList>

          {/* Content blocks */}
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
                  <div><Label className="text-sm mb-1 block">Title</Label><Input value={editContent.title ?? ""} onChange={e => setEditContent({ ...editContent, title: e.target.value })} /></div>
                  <div><Label className="text-sm mb-1 block">Body (Markdown)</Label><Textarea value={editContent.body} onChange={e => setEditContent({ ...editContent, body: e.target.value })} rows={14} className="font-mono text-xs" /></div>
                  <div className="flex items-center gap-2"><Switch checked={editContent.visible} onCheckedChange={v => setEditContent({ ...editContent, visible: v })} /><span className="text-sm text-muted-foreground">Visible</span></div>
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
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{c.body.slice(0, 100)}…</p>
                      </div>
                      <Badge className={c.visible ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>{c.visible ? "Visible" : "Hidden"}</Badge>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => setEditContent(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <div className="flex justify-end mb-4"><Button size="sm" className="gap-1.5" onClick={() => { setEditFaq({ question: "", answer: "", sort_order: faq.length + 1 }); setFaqDialog(true); }}><Plus className="w-3.5 h-3.5" />Add FAQ</Button></div>
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
                        <Switch checked={f.visible} onCheckedChange={() => toggleFaq(f)} />
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setEditFaq({ ...f }); setFaqDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteFaq(f.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hardware */}
          <TabsContent value="hardware">
            <div className="flex justify-end mb-4"><Button size="sm" className="gap-1.5" onClick={() => { setEditHw({ model: "", hashrate_ths: 0, power_watts: 0 }); setHwDialog(true); }}><Plus className="w-3.5 h-3.5" />Add Hardware</Button></div>
            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
              <div className="space-y-3">
                {hardware.map(h => (
                  <Card key={h.id} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div><p className="text-xs text-muted-foreground">Model</p><p className="font-medium text-foreground">{h.model}</p></div>
                        <div><p className="text-xs text-muted-foreground">Hashrate</p><p className="font-mono">{h.hashrate_ths} TH/s</p></div>
                        <div><p className="text-xs text-muted-foreground">Power</p><p className="font-mono">{h.power_watts}W</p></div>
                        <div><p className="text-xs text-muted-foreground">Efficiency</p><p className="font-mono">{h.efficiency_jth ?? "—"} J/TH</p></div>
                        <div><p className="text-xs text-muted-foreground">Est. Daily</p><p className="font-mono text-success">${h.est_daily_usd?.toFixed(2) ?? "—"}</p></div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={h.visible} onCheckedChange={() => toggleHw(h)} />
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setEditHw({ ...h }); setHwDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteHw(h.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Links */}
          <TabsContent value="links">
            <div className="flex justify-end mb-4"><Button size="sm" className="gap-1.5" onClick={() => { setEditLink({ anchor_text: "", target_url: "" }); setLinkDialog(true); }}><Plus className="w-3.5 h-3.5" />Add Link</Button></div>
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
                        <Switch checked={l.visible} onCheckedChange={() => toggleLink(l)} />
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setEditLink({ ...l }); setLinkDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteLink(l.id)}><Trash2 className="w-3 h-3" /></Button>
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
            <div><Label className="text-sm mb-1 block">Question</Label><Input value={editFaq?.question ?? ""} onChange={e => setEditFaq(prev => ({ ...prev!, question: e.target.value }))} /></div>
            <div><Label className="text-sm mb-1 block">Answer</Label><Textarea value={editFaq?.answer ?? ""} onChange={e => setEditFaq(prev => ({ ...prev!, answer: e.target.value }))} rows={5} /></div>
            <div><Label className="text-sm mb-1 block">Sort Order</Label><Input type="number" value={editFaq?.sort_order ?? 0} onChange={e => setEditFaq(prev => ({ ...prev!, sort_order: +e.target.value }))} /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setFaqDialog(false)}>Cancel</Button><Button onClick={saveFaq}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hardware Dialog */}
      <Dialog open={hwDialog} onOpenChange={setHwDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editHw?.id ? "Edit Hardware" : "Add Hardware"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-sm mb-1 block">Model</Label><Input value={editHw?.model ?? ""} onChange={e => setEditHw(p => ({ ...p!, model: e.target.value }))} /></div>
              <div><Label className="text-sm mb-1 block">Manufacturer</Label><Input value={editHw?.manufacturer ?? ""} onChange={e => setEditHw(p => ({ ...p!, manufacturer: e.target.value }))} /></div>
              <div><Label className="text-sm mb-1 block">Hashrate (TH/s)</Label><Input type="number" value={editHw?.hashrate_ths ?? ""} onChange={e => setEditHw(p => ({ ...p!, hashrate_ths: +e.target.value }))} /></div>
              <div><Label className="text-sm mb-1 block">Power (W)</Label><Input type="number" value={editHw?.power_watts ?? ""} onChange={e => setEditHw(p => ({ ...p!, power_watts: +e.target.value }))} /></div>
              <div><Label className="text-sm mb-1 block">Efficiency (J/TH)</Label><Input type="number" step="0.1" value={editHw?.efficiency_jth ?? ""} onChange={e => setEditHw(p => ({ ...p!, efficiency_jth: +e.target.value }))} /></div>
              <div><Label className="text-sm mb-1 block">Est. Daily USD</Label><Input type="number" step="0.01" value={editHw?.est_daily_usd ?? ""} onChange={e => setEditHw(p => ({ ...p!, est_daily_usd: +e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-sm mb-1 block">Efficiency Rating</Label><Input value={editHw?.efficiency_rating ?? ""} onChange={e => setEditHw(p => ({ ...p!, efficiency_rating: e.target.value }))} placeholder="Excellent / Very Good / Good" /></div>
            </div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setHwDialog(false)}>Cancel</Button><Button onClick={saveHw}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader><DialogTitle>{editLink?.id ? "Edit Link" : "Add Link"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-sm mb-1 block">Anchor Text</Label><Input value={editLink?.anchor_text ?? ""} onChange={e => setEditLink(p => ({ ...p!, anchor_text: e.target.value }))} /></div>
            <div><Label className="text-sm mb-1 block">Target URL</Label><Input value={editLink?.target_url ?? ""} onChange={e => setEditLink(p => ({ ...p!, target_url: e.target.value }))} placeholder="/marketplace" /></div>
            <div><Label className="text-sm mb-1 block">Description</Label><Input value={editLink?.description ?? ""} onChange={e => setEditLink(p => ({ ...p!, description: e.target.value }))} /></div>
            <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setLinkDialog(false)}>Cancel</Button><Button onClick={saveLink}>Save</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
