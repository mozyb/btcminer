import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Star, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface Review {
  id: string;
  author_name: string;
  author_country: string | null;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  featured: boolean;
  visible: boolean;
  created_at: string;
}

const EMPTY: Omit<Review, "id" | "created_at"> = {
  author_name: "", author_country: "", rating: 5, title: "", body: "",
  verified: false, featured: false, visible: true,
};

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<Omit<Review, "id" | "created_at">>(EMPTY);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    setReviews(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (r: Review) => { setEditing(r); setForm({ author_name: r.author_name, author_country: r.author_country ?? "", rating: r.rating, title: r.title, body: r.body, verified: r.verified, featured: r.featured, visible: r.visible }); setOpen(true); };

  const save = async () => {
    if (!form.author_name || !form.title || !form.body) { toast.error("Fill all required fields"); return; }
    const payload = { ...form, rating: Number(form.rating) };
    if (editing) {
      const { error } = await supabase.from("reviews").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Review updated");
    } else {
      const { error } = await supabase.from("reviews").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Review added");
    }
    setOpen(false); load();
  };

  const toggle = async (r: Review, field: "visible" | "featured" | "verified") => {
    await supabase.from("reviews").update({ [field]: !r[field] }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage testimonials displayed on the homepage</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" /> Add Review
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Author", "Rating", "Title", "Verified", "Featured", "Visible", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">
                        {r.author_name}
                        {r.author_country && <span className="text-xs text-muted-foreground ml-1">({r.author_country})</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />)}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate text-foreground">{r.title}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(r, "verified")}>
                          <Badge className={r.verified ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>{r.verified ? "Yes" : "No"}</Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(r, "featured")}>
                          <Badge className={r.featured ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground"}>{r.featured ? "Yes" : "No"}</Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(r, "visible")} className="text-muted-foreground hover:text-foreground">
                          {r.visible ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>{editing ? "Edit Review" : "Add Review"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Author Name *</Label><Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} /></div>
              <div><Label className="text-xs mb-1 block">Country</Label><Input value={form.author_country ?? ""} onChange={e => setForm(f => ({ ...f, author_country: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Rating *</Label>
              <Select value={String(form.rating)} onValueChange={v => setForm(f => ({ ...f, rating: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5,4,3,2,1].map(n => <SelectItem key={n} value={String(n)}>{n} Star{n>1?"s":""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Review Body *</Label><Textarea rows={4} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} /></div>
            <div className="flex gap-6">
              {(["verified","featured","visible"] as const).map(field => (
                <label key={field} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                  <input type="checkbox" checked={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))} className="accent-primary" />
                  {field}
                </label>
              ))}
            </div>
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
