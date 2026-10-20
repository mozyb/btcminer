import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  visible: boolean;
}

const EMPTY: Omit<FaqItem, "id"> = { category: "General", question: "", answer: "", sort_order: 0, visible: true };

export default function AdminFAQ() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState<Omit<FaqItem, "id">>(EMPTY);
  const [filterCat, setFilterCat] = useState("All");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("faq_items").select("*").order("sort_order").order("created_at");
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = ["All", ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = filterCat === "All" ? items : items.filter(i => i.category === filterCat);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (item: FaqItem) => { setEditing(item); setForm({ category: item.category, question: item.question, answer: item.answer, sort_order: item.sort_order, visible: item.visible }); setOpen(true); };

  const save = async () => {
    if (!form.question || !form.answer) { toast.error("Question and answer required"); return; }
    if (editing) {
      const { error } = await supabase.from("faq_items").update(form).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("FAQ updated");
    } else {
      const { error } = await supabase.from("faq_items").insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success("FAQ added");
    }
    setOpen(false); load();
  };

  const toggleVisible = async (item: FaqItem) => {
    await supabase.from("faq_items").update({ visible: !item.visible }).eq("id", item.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faq_items").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage frequently asked questions displayed on the site</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" /> Add FAQ
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${filterCat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
            {c}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-muted/20">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-muted text-muted-foreground text-xs">{item.category}</Badge>
                      {!item.visible && <Badge className="bg-destructive/10 text-destructive text-xs">Hidden</Badge>}
                    </div>
                    <p className="font-medium text-foreground text-sm">{item.question}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisible(item)}>
                      {item.visible ? <Eye className="w-3.5 h-3.5 text-success" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No FAQ items found</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label className="text-xs mb-1 block">Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Question *</Label><Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Answer *</Label><Textarea rows={5} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} /></div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.visible} onChange={e => setForm(f => ({ ...f, visible: e.target.checked }))} className="accent-primary" />
              Visible on site
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
