import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { blogPosts } from "@/lib/mockData";
import { Plus, Edit, Trash2, Eye, FileText, Image } from "lucide-react";
import { toast } from "sonner";

const cmsPages = [
  { id: "p1", title: "Homepage", slug: "/", status: "published", lastEdited: "2024-03-10" },
  { id: "p2", title: "About Us", slug: "/about", status: "published", lastEdited: "2024-02-28" },
  { id: "p3", title: "Pricing", slug: "/pricing", status: "published", lastEdited: "2024-03-05" },
  { id: "p4", title: "Security", slug: "/security", status: "draft", lastEdited: "2024-03-12" },
];

export default function AdminCMS() {
  const [tab, setTab] = useState<"pages" | "blog" | "faq">("pages");
  const [posts, setPosts] = useState(blogPosts);
  const [editOpen, setEditOpen] = useState(false);
  const [editPost, setEditPost] = useState<typeof blogPosts[0] | null>(null);
  const [newForm, setNewForm] = useState({ title: "", category: "Education", excerpt: "" });

  const handleSave = () => {
    if (editPost) {
      setPosts(ps => ps.map(p => p.id === editPost.id ? { ...p, title: editPost.title, excerpt: editPost.excerpt } : p));
      toast.success("Post updated.");
    } else {
      const np = { id: `b${posts.length + 1}`, ...newForm, slug: newForm.title.toLowerCase().replace(/\s+/g, "-"), date: "2024-03-13", author: "BTCMiner Team", readTime: 5, image: "" };
      setPosts(ps => [...ps, np]);
      toast.success("Post created.");
    }
    setEditOpen(false);
    setEditPost(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">CMS Management</h2>
            <p className="text-sm text-muted-foreground">Manage pages, blog posts, and FAQs</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => { setEditPost(null); setEditOpen(true); }}>
            <Plus className="w-4 h-4" />New Post
          </Button>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-muted/30 border border-border rounded p-1 w-fit">
          {(["pages", "blog", "faq"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded text-sm capitalize transition-colors ${tab === t ? "bg-card text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "pages" ? "Pages" : t === "blog" ? "Blog Posts" : "FAQs"}
            </button>
          ))}
        </div>

        {tab === "pages" && (
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Page Title", "Slug", "Status", "Last Edited", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cmsPages.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{p.title}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap text-xs">{p.slug}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={`text-xs ${p.status === "published" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>{p.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">{p.lastEdited}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Page editor coming soon")}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Preview page")}><Eye className="w-3.5 h-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "blog" && (
          <div className="grid md:grid-cols-2 gap-4">
            {posts.map(post => (
              <Card key={post.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className="bg-muted text-muted-foreground text-xs">{post.category}</Badge>
                    <p className="text-xs text-muted-foreground">{post.date}</p>
                  </div>
                  <p className="font-semibold text-foreground text-sm mb-1 line-clamp-2 text-balance">{post.title}</p>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 text-pretty">{post.excerpt}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 h-7" onClick={() => { setEditPost(post); setEditOpen(true); }}>
                      <Edit className="w-3 h-3" />Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => { setPosts(ps => ps.filter(p => p.id !== post.id)); toast.success("Post deleted."); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "faq" && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">
              FAQ Entries
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs h-7" onClick={() => toast.info("FAQ editor coming soon")}>
                <Plus className="w-3 h-3" />Add FAQ
              </Button>
            </CardTitle></CardHeader>
            <CardContent>
              {[
                "What is cloud mining?", "How are mining rewards calculated?", "When do I receive my mining rewards?",
                "What cryptocurrencies can I mine?", "Is my investment guaranteed?",
              ].map((q, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{q}</p>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => toast.info("FAQ editor coming soon")}><Edit className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>{editPost ? "Edit Post" : "New Blog Post"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-normal mb-1 block">Title</Label>
              <Input
                value={editPost?.title ?? newForm.title}
                onChange={e => editPost ? setEditPost(p => p ? { ...p, title: e.target.value } : p) : setNewForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs font-normal mb-1 block">Category</Label>
              <Select value={editPost?.category ?? newForm.category} onValueChange={v => editPost ? setEditPost(p => p ? { ...p, category: v } : p) : setNewForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Education", "Hardware", "Guides", "News", "Analysis"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-normal mb-1 block">Excerpt</Label>
              <Textarea
                rows={3}
                value={editPost?.excerpt ?? newForm.excerpt}
                onChange={e => editPost ? setEditPost(p => p ? { ...p, excerpt: e.target.value } : p) : setNewForm(f => ({ ...f, excerpt: e.target.value }))}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditPost(null); }}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
