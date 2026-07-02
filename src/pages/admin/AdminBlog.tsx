import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, Search,
  Star, TrendingUp, BarChart3, FileText, ExternalLink,
} from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  author_name: string;
  author_bio: string | null;
  author_title: string | null;
  featured_image: string | null;
  featured: boolean;
  published: boolean;
  trending: boolean;
  level: string;
  meta_title: string | null;
  meta_description: string | null;
  target_keyword: string | null;
  content_body: string | null;
  read_time_min: number;
  view_count: number;
  publish_date: string | null;
  updated_date: string | null;
  created_at: string;
}

const CATEGORIES = [
  "Bitcoin Mining Basics", "ASIC Hardware", "Profitability",
  "Hashrate & Difficulty", "Cloud Mining", "Bitcoin Network",
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

const EMPTY: Omit<BlogPost, "id" | "view_count" | "created_at"> = {
  slug: "", title: "", excerpt: "", category: "Bitcoin Mining Basics", tags: [],
  author_name: "BTCMiner Research Team", author_bio: "", author_title: "Mining Infrastructure Analysts",
  featured_image: "", featured: false, published: true, trending: false, level: "Beginner",
  meta_title: "", meta_description: "", target_keyword: "",
  content_body: "", read_time_min: 10,
  publish_date: new Date().toISOString().split("T")[0],
  updated_date: new Date().toISOString().split("T")[0],
};

// ── SEO score estimator ───────────────────────────────────────────────────────
function seoScore(form: typeof EMPTY): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  if (!form.meta_title) { issues.push("Missing meta title"); score -= 20; }
  else if (form.meta_title.length > 60) { issues.push("Meta title too long (>60 chars)"); score -= 10; }
  if (!form.meta_description) { issues.push("Missing meta description"); score -= 15; }
  else if (form.meta_description.length > 160) { issues.push("Meta description too long (>160 chars)"); score -= 5; }
  if (!form.target_keyword) { issues.push("No target keyword set"); score -= 10; }
  if (!form.featured_image) { issues.push("Missing featured image"); score -= 10; }
  if (!form.excerpt) { issues.push("Missing excerpt"); score -= 10; }
  if (!form.content_body || form.content_body.length < 500) { issues.push("Content too short (<500 chars)"); score -= 15; }
  if (form.tags.length === 0) { issues.push("No tags added"); score -= 5; }
  if (form.read_time_min < 3) { issues.push("Read time seems too low"); score -= 5; }
  return { score: Math.max(score, 0), issues };
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [tagsInput, setTagsInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setTagsInput(""); setOpen(true); };
  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      slug: p.slug, title: p.title, excerpt: p.excerpt ?? "", category: p.category,
      tags: p.tags, author_name: p.author_name, author_bio: p.author_bio ?? "",
      author_title: p.author_title ?? "", featured_image: p.featured_image ?? "",
      featured: p.featured, published: p.published, trending: p.trending ?? false,
      level: p.level ?? "Beginner", meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "", target_keyword: p.target_keyword ?? "",
      content_body: p.content_body ?? "", read_time_min: p.read_time_min,
      publish_date: p.publish_date ?? "", updated_date: p.updated_date ?? "",
    });
    setTagsInput(p.tags.join(", "));
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.slug) { toast.error("Title and slug are required"); return; }
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    const payload = { ...form, tags };
    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Post updated successfully");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Post published successfully");
    }
    setOpen(false); load();
  };

  const toggle = async (p: BlogPost, field: "published" | "featured" | "trending") => {
    await supabase.from("blog_posts").update({ [field]: !p[field] }).eq("id", p.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Permanently delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast.success("Post deleted"); load();
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const visible = posts.filter(p => {
    const matchQ = !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) || p.slug.includes(searchQ.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchQ && matchCat;
  });

  const seo = seoScore(form);
  const seoColor = seo.score >= 80 ? "text-success" : seo.score >= 50 ? "text-warning" : "text-destructive";

  // Summary stats
  const totalPublished = posts.filter(p => p.published).length;
  const totalFeatured = posts.filter(p => p.featured).length;
  const totalViews = posts.reduce((s, p) => s + (p.view_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mining Knowledge Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage articles, SEO content, and educational guides</p>
        </div>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus className="w-4 h-4" />New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText,   label: "Total Articles", value: posts.length },
          { icon: Eye,        label: "Published",      value: totalPublished },
          { icon: Star,       label: "Featured",       value: totalFeatured },
          { icon: BarChart3,  label: "Total Views",    value: totalViews.toLocaleString() },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search articles..." className="pl-9 h-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-52 h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No articles found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Article", "Category", "Level", "Views", "Featured", "Trending", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate">{p.title}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">/blog/{p.slug}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className="bg-muted text-muted-foreground text-[10px]">{p.category}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className="bg-muted text-muted-foreground text-[10px]">{p.level ?? "—"}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap text-xs">{(p.view_count || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(p, "featured")}>
                          <Badge className={p.featured ? "bg-primary/10 text-primary border-primary/20 text-[10px]" : "bg-muted text-muted-foreground text-[10px]"}>
                            {p.featured ? "Yes" : "No"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(p, "trending")}>
                          <TrendingUp className={`w-4 h-4 ${p.trending ? "text-warning" : "text-muted-foreground"}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button onClick={() => toggle(p, "published")}>
                          {p.published
                            ? <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Published</Badge>
                            : <Badge className="bg-muted text-muted-foreground text-[10px]">Draft</Badge>}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview" asChild>
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl bg-card border-border max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editing ? "Edit Article" : "New Article"}
              {form.title && (
                <span className={`text-xs font-normal ml-2 ${seoColor}`}>
                  SEO Score: {seo.score}/100
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* ── Content Tab ── */}
            <TabsContent value="content" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Title *</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({
                      ...f, title: e.target.value,
                      slug: f.slug || autoSlug(e.target.value),
                      meta_title: f.meta_title || e.target.value,
                    }))}
                    placeholder="Article title"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Slug *</Label>
                  <Input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: autoSlug(e.target.value) }))}
                    placeholder="article-url-slug"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Excerpt / Summary</Label>
                <Textarea rows={2} value={form.excerpt ?? ""} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Brief description shown in article cards..." />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Article Body Content</Label>
                <Textarea
                  rows={12}
                  value={form.content_body ?? ""}
                  onChange={e => setForm(f => ({ ...f, content_body: e.target.value }))}
                  placeholder="Write your full article content here. Use ## for H2 headings, ### for H3, - for bullet lists..."
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{(form.content_body?.length ?? 0).toLocaleString()} characters</p>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Featured Image URL</Label>
                <Input value={form.featured_image ?? ""} onChange={e => setForm(f => ({ ...f, featured_image: e.target.value }))} placeholder="https://..." />
              </div>
            </TabsContent>

            {/* ── SEO Tab ── */}
            <TabsContent value="seo" className="space-y-3">
              {seo.issues.length > 0 && (
                <div className="border border-warning/20 bg-warning/5 rounded-lg p-3">
                  <p className="text-xs font-semibold text-warning mb-2">SEO Issues ({seo.issues.length})</p>
                  <ul className="space-y-1">
                    {seo.issues.map((issue, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-warning shrink-0" />{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <Label className="text-xs mb-1 block">Target Keyword</Label>
                <Input value={form.target_keyword ?? ""} onChange={e => setForm(f => ({ ...f, target_keyword: e.target.value }))} placeholder="bitcoin mining difficulty" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Meta Title ({(form.meta_title?.length ?? 0)}/60 chars)</Label>
                <Input value={form.meta_title ?? ""} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="SEO title for search engines" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Meta Description ({(form.meta_description?.length ?? 0)}/160 chars)</Label>
                <Textarea rows={2} value={form.meta_description ?? ""} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="SEO description for search results (max 160 chars)" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tags (comma-separated)</Label>
                <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="bitcoin, mining, hashrate, ASIC" />
              </div>
            </TabsContent>

            {/* ── Settings Tab ── */}
            <TabsContent value="settings" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Difficulty Level</Label>
                  <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Author Name</Label>
                  <Input value={form.author_name} onChange={e => setForm(f => ({ ...f, author_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Author Title</Label>
                  <Input value={form.author_title ?? ""} onChange={e => setForm(f => ({ ...f, author_title: e.target.value }))} placeholder="Senior Mining Engineer" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Author Bio</Label>
                <Textarea rows={2} value={form.author_bio ?? ""} onChange={e => setForm(f => ({ ...f, author_bio: e.target.value }))} placeholder="Short author bio shown at end of article..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Read Time (min)</Label>
                  <Input type="number" value={form.read_time_min} onChange={e => setForm(f => ({ ...f, read_time_min: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Publish Date</Label>
                  <Input type="date" value={form.publish_date ?? ""} onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Updated Date</Label>
                  <Input type="date" value={form.updated_date ?? ""} onChange={e => setForm(f => ({ ...f, updated_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-6 pt-1">
                {([
                  { field: "published", label: "Published" },
                  { field: "featured",  label: "Featured" },
                  { field: "trending",  label: "Trending" },
                ] as const).map(({ field, label }) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer min-h-12">
                    <input type="checkbox" checked={!!form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))} className="accent-primary w-4 h-4" />
                    {label}
                  </label>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {editing ? "Save Changes" : "Publish Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
