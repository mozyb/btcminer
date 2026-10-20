import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Search, Globe, FileCode } from "lucide-react";
import { toast } from "sonner";

const seoPages = [
  { path: "/", title: "BTCMiner.online — Enterprise Cloud Mining & Hashrate Marketplace", desc: "Buy Bitcoin hashrate from our global mining farms. Professional cloud mining infrastructure with real-time analytics.", keywords: "cloud mining, bitcoin mining, buy hashrate, BTC mining" },
  { path: "/marketplace", title: "Hashrate Marketplace — Buy Bitcoin Mining Contracts", desc: "Browse and purchase SHA-256 hashrate contracts. Transparent pricing, daily rewards, professional infrastructure.", keywords: "buy hashrate, mining contracts, SHA-256 hashrate" },
  { path: "/farms", title: "Our Mining Farms — Iceland, Texas, Kazakhstan, Norway", desc: "Explore our global data centers powering your hashrate. 100% renewable energy, 99%+ uptime guaranteed.", keywords: "mining farm, data center, renewable energy mining" },
  { path: "/calculator", title: "Bitcoin Mining Calculator — Estimate Mining Revenue", desc: "Calculate your estimated BTC mining output based on current network difficulty and your hashrate amount.", keywords: "bitcoin mining calculator, mining revenue estimator" },
];

export default function AdminSEO() {
  const [selected, setSelected] = useState(seoPages[0]);
  const [form, setForm] = useState({ ...seoPages[0] });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">SEO Management</h2>
          <p className="text-sm text-muted-foreground">Configure page metadata, structured data, and search optimization</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Page List */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pages</p>
            {seoPages.map(p => (
              <button
                key={p.path}
                onClick={() => { setSelected(p); setForm({ ...p }); }}
                className={`w-full text-left p-3 rounded border text-sm transition-colors ${selected.path === p.path ? "border-primary/40 bg-primary/5 text-foreground" : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"}`}
              >
                <p className="font-mono text-xs mb-0.5">{p.path}</p>
                <p className="text-xs truncate">{p.title.split("—")[0]}</p>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="md:col-span-2 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4" />Meta Tags — {form.path}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs font-normal mb-1 block">Meta Title <span className="text-muted-foreground">({form.title.length}/60 chars)</span></Label>
                  <Input value={form.title} onChange={set("title")} className="text-sm" />
                  <div className={`h-1 rounded-full mt-1 ${form.title.length > 60 ? "bg-destructive" : form.title.length > 50 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(100, (form.title.length / 60) * 100)}%` }} />
                </div>
                <div>
                  <Label className="text-xs font-normal mb-1 block">Meta Description <span className="text-muted-foreground">({form.desc.length}/160 chars)</span></Label>
                  <Textarea value={form.desc} onChange={set("desc")} rows={3} className="resize-none text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-normal mb-1 block">Keywords</Label>
                  <Input value={form.keywords} onChange={set("keywords")} className="text-sm" />
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm" onClick={() => toast.success("SEO settings saved.")}>Save SEO Settings</Button>
              </CardContent>
            </Card>

            {/* Search Preview */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4" />Search Preview</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-muted/20 border border-border rounded p-3">
                  <p className="text-xs text-muted-foreground mb-1">https://btcminer.online{form.path}</p>
                  <p className="text-primary text-base hover:underline cursor-pointer">{form.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{form.desc}</p>
                </div>
              </CardContent>
            </Card>

            {/* Structured Data */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCode className="w-4 h-4" />Structured Data Schemas</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["Organization", "WebSite", "BreadcrumbList", "FAQPage", "Article"].map(schema => (
                    <span key={schema} className="text-xs px-2 py-1 bg-success/10 text-success border border-success/20 rounded font-mono">✓ {schema}</span>
                  ))}
                  {["Product", "Review"].map(schema => (
                    <button key={schema} onClick={() => toast.success(`${schema} schema enabled.`)} className="text-xs px-2 py-1 bg-muted/30 text-muted-foreground border border-border rounded font-mono hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors">+ {schema}</button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
