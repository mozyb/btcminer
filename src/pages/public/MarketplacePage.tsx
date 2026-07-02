import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PublicLayout from "@/components/layouts/PublicLayout";
import { getPublicContractTemplates, type ContractTemplate } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { supabase } from "@/db/supabase";
import PageMeta from "@/components/common/PageMeta";

import {
  Search, Zap, Clock, DollarSign, ChevronRight, ArrowRight,
  TrendingUp, Shield, Server, CheckCircle, ExternalLink,
  Users, Hash, BarChart3, BookOpen,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface MarketplaceStat    { key: string; value: string; label: string | null; sort_order: number; }
interface MarketplaceContent { key: string; title: string | null; body: string; visible: boolean; sort_order: number; }
interface MarketplaceFaq     { id: string; question: string; answer: string; sort_order: number; }
interface MarketplaceLink    { id: string; anchor_text: string; target_url: string; description: string | null; }

// ── JSON-LD helper ──────────────────────────────────────────────────────────
function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

// ── Badge config ────────────────────────────────────────────────────────────
const BADGE_MAP: Record<string, { label: string; cls: string }> = {
  most_popular: { label: "Most Popular", cls: "bg-primary text-primary-foreground" },
  best_value:   { label: "Best Value",   cls: "bg-success text-white" },
  featured:     { label: "Featured",     cls: "bg-amber-500 text-white" },
};

// ── Markdown-lite renderer (bold + headings) ────────────────────────────────
function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4">{line.slice(3)}</h3>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        if (parts.length > 1) return <p key={i} className="text-pretty">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{p}</strong> : p)}</p>;
        if (line.startsWith("- ")) return <p key={i} className="flex gap-2"><span className="text-primary shrink-0">·</span><span className="text-pretty">{line.slice(2)}</span></p>;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-pretty">{line}</p>;
      })}
    </div>
  );
}

export default function MarketplacePage() {
  const btc = useBtcStats();
  const [search,    setSearch]    = useState("");
  const [algorithm, setAlgorithm] = useState("all");
  const [duration,  setDuration]  = useState("all");

  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [mpStats,   setMpStats]   = useState<MarketplaceStat[]>([]);
  const [mpContent, setMpContent] = useState<MarketplaceContent[]>([]);
  const [mpFaq,     setMpFaq]     = useState<MarketplaceFaq[]>([]);
  const [mpLinks,   setMpLinks]   = useState<MarketplaceLink[]>([]);

  useEffect(() => {
    getPublicContractTemplates().then(setContracts).catch(() => {});
    supabase.from("marketplace_stats").select("*").order("sort_order").then(({ data }) => setMpStats(data ?? []));
    supabase.from("marketplace_content").select("*").eq("visible", true).order("sort_order").then(({ data }) => setMpContent(data ?? []));
    supabase.from("marketplace_faq").select("*").eq("visible", true).order("sort_order").then(({ data }) => setMpFaq(data ?? []));
    supabase.from("marketplace_links").select("*").eq("visible", true).order("sort_order").then(({ data }) => setMpLinks(data ?? []));
  }, []);

  const networkTH = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 850e6;
  const btcPrice  = btc.btcPrice > 0 ? btc.btcPrice : 97000;

  const filtered = contracts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.coin.toLowerCase().includes(search.toLowerCase());
    const matchAlgo   = algorithm === "all" || c.algorithm === algorithm;
    const matchDur    = duration  === "all" || c.duration  === Number(duration);
    return matchSearch && matchAlgo && matchDur;
  });

  const introContent = mpContent.find(c => c.key === "intro");
  const eduBlocks    = mpContent.filter(c => c.key !== "intro").sort((a, b) => a.sort_order - b.sort_order);

  // ── Structured data ────────────────────────────────────────────────────────
  const faqSchema = mpFaq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: mpFaq.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",        item: "https://btcminer.online/" },
      { "@type": "ListItem", position: 2, name: "Marketplace", item: "https://btcminer.online/marketplace" },
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BTCMiner.online",
    url: "https://btcminer.online",
    description: "Enterprise Bitcoin cloud mining platform. Buy hashrate, earn daily BTC rewards.",
    sameAs: ["https://twitter.com/btcmineronline"],
  };

  const productSchemas = contracts.map(c => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${c.name} Bitcoin Mining Contract`,
    description: `${c.hashrate} ${c.hashrate_unit} ${c.algorithm} mining hashrate for ${c.duration} days.`,
    brand: { "@type": "Brand", name: "BTCMiner.online" },
    offers: {
      "@type": "Offer",
      price: c.price,
      priceCurrency: c.currency ?? "USD",
      availability: c.remaining_capacity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://btcminer.online/marketplace/${c.slug}`,
    },
  }));

  return (
    <>
      <PageMeta
      title="Bitcoin Mining Plans & Hashrate Contracts | BTCMiner.online Marketplace"
      description="Browse and buy Bitcoin cloud mining contracts. Choose your hashpower, lock in your mining contract, and start earning BTC today. Flexible plans for all budgets."
      canonical="/marketplace"
      />
      <PublicLayout>
      {faqSchema     && <JsonLd data={faqSchema} />}
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={orgSchema} />
      {productSchemas.map((ps, i) => <JsonLd key={i} data={ps} />)}

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Hashrate Marketplace</span>
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Buy Bitcoin Hashrate</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-3">
            Hashrate Marketplace — Buy Bitcoin Mining Contracts
          </h1>
          <p className="text-muted-foreground max-w-2xl text-pretty">
            Purchase SHA-256 mining hashrate from our enterprise data centers and earn daily Bitcoin rewards.
            Real ASIC hardware. Transparent operations. Instant activation.
          </p>
          <div className="flex flex-wrap gap-6 mt-6 text-xs">
            {btc.loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-28 bg-muted" />)
              : [
                  { label: "BTC Price",        val: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
                  { label: "Network Hashrate", val: `${btc.networkHashrate} EH/s` },
                  { label: "Difficulty",       val: `${btc.networkDifficulty}T` },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-muted-foreground">{s.label}</p>
                    <p className="font-mono font-bold text-primary flex items-center gap-1">
                      {s.val}<span className="text-success text-[10px]">● LIVE</span>
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── Marketplace Intro Section ─────────────────────────────────────── */}
      {introContent && (
        <section className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-balance">{introContent.title ?? "Hashrate Marketplace"}</h2>
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <SimpleMarkdown text={introContent.body} />
              </div>
              <div className="space-y-4">
                {[
                  { icon: Shield,      title: "Real Hardware",       desc: "Antminer S21 XP & Whatsminer M60 ASICs" },
                  { icon: TrendingUp,  title: "Daily Payouts",       desc: "Rewards credited every 24 hours" },
                  { icon: Server,      title: "4 Continents",        desc: "555+ MW across 8 data centers" },
                  { icon: CheckCircle, title: "Transparent Data",    desc: "Live blockchain verification" },
                ].map(f => (
                  <div key={f.title} className="flex items-start gap-3 p-3 border border-border rounded bg-card">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center shrink-0">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace Stats ─────────────────────────────────────────────── */}
      {mpStats.length > 0 && (
        <section className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {mpStats.map(s => (
                <div key={s.key} className="text-center">
                  <p className="text-2xl font-bold font-mono text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label ?? s.key}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Comparison Table ──────────────────────────────────────────────── */}
      <section className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Contract Comparison</h2>
          <p className="text-sm text-muted-foreground mb-6">Compare all available mining contracts side-by-side.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm bg-card border border-border rounded">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Contract", "Algorithm", "Hashrate", "Duration", "Est. Daily Reward", "Maintenance", "Availability", ""].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => {
                  const hashrateInTH = c.hashrate_unit === "PH/s" ? c.hashrate * 1000 : c.hashrate_unit === "GH/s" ? c.hashrate / 1000 : c.hashrate_unit === "MH/s" ? c.hashrate / 1e6 : c.hashrate;
                  const dailyBTC     = (hashrateInTH / networkTH) * 144 * (btc.blockReward || 3.125);
                  const dailyUSD     = dailyBTC * btcPrice;
                  const badgeInfo    = c.badge ? BADGE_MAP[c.badge] : null;
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{c.name}</span>
                          {badgeInfo && <Badge className={`text-[10px] py-0 px-1.5 ${badgeInfo.cls}`}>{badgeInfo.label}</Badge>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{c.algorithm}</td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{c.hashrate} {c.hashrate_unit}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{c.is_lifetime ? "Lifetime" : `${c.duration} days`}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {btc.loading ? <Skeleton className="h-4 w-24 bg-muted" /> : (
                          <span className="font-mono text-success">{dailyBTC.toFixed(6)} BTC<br /><span className="text-xs text-muted-foreground">${dailyUSD.toFixed(2)}</span></span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">${c.maintenance_fee}/TH/d</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {c.remaining_capacity > 0
                          ? <span className="text-success font-mono">{c.remaining_capacity} slots</span>
                          : <span className="text-destructive">Sold Out</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/marketplace/${c.slug}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Filters + Contract Grid ───────────────────────────────────────── */}
      <section id="contracts" className="bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Available Mining Contracts</h2>
          <p className="text-sm text-muted-foreground mb-6">Select a hashrate contract and start mining immediately. All contracts run on real hardware in our data centers.</p>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={algorithm} onValueChange={setAlgorithm}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Algorithm" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Algorithms</SelectItem>
                <SelectItem value="SHA-256">SHA-256</SelectItem>
                <SelectItem value="Scrypt">Scrypt</SelectItem>
                <SelectItem value="Kadena">Kadena</SelectItem>
              </SelectContent>
            </Select>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Duration" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Durations</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="180">180 Days</SelectItem>
                <SelectItem value="365">365 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} contract{filtered.length !== 1 ? "s" : ""} available</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const hashrateInTH = c.hashrate_unit === "PH/s" ? c.hashrate * 1000 : c.hashrate_unit === "GH/s" ? c.hashrate / 1000 : c.hashrate_unit === "MH/s" ? c.hashrate / 1e6 : c.hashrate;
              const dailyBtcEst  = (hashrateInTH / networkTH) * 144 * (btc.blockReward || 3.125);
              const dailyUsdEst  = dailyBtcEst * btcPrice;
              const badgeInfo    = c.badge ? BADGE_MAP[c.badge] : null;
              const displayPrice = c.promotional_price ?? c.price;
              return (
                <Card
                  key={c.id}
                  className={`bg-card border-border h-full flex flex-col hover:border-primary/40 transition-colors ${c.featured ? "border-primary/30" : ""}`}
                >
                  {badgeInfo ? (
                    <div className={`px-4 py-1.5 border-b border-border ${c.badge === "most_popular" ? "bg-primary/10" : c.badge === "best_value" ? "bg-success/10" : "bg-amber-500/10"}`}>
                      <p className={`text-xs font-semibold ${c.badge === "most_popular" ? "text-primary" : c.badge === "best_value" ? "text-success" : "text-amber-600"}`}>
                        ★ {badgeInfo.label}
                      </p>
                    </div>
                  ) : c.featured ? (
                    <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5">
                      <p className="text-xs text-primary font-medium">★ Featured Contract</p>
                    </div>
                  ) : null}

                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.display_name}</h3>
                        <p className="text-xs text-muted-foreground">{c.algorithm} · Mining {c.coin}</p>
                      </div>
                      <Badge className="bg-muted text-muted-foreground shrink-0">{c.is_lifetime ? "∞" : `${c.duration}d`}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Hashrate</p>
                          <p className="font-mono font-bold text-foreground">{c.hashrate} {c.hashrate_unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-mono text-foreground">{c.is_lifetime ? "Lifetime" : `${c.duration} days`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Maintenance</p>
                          <p className="font-mono text-foreground">${c.maintenance_fee}/TH/d</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Available</p>
                        <p className={`font-mono text-sm ${c.remaining_capacity > 0 ? "text-success" : "text-destructive"}`}>
                          {c.remaining_capacity > 0 ? `${c.remaining_capacity} slots` : "Sold Out"}
                        </p>
                      </div>
                    </div>

                    {!btc.loading && (
                      <div className="mb-4 p-2.5 bg-success/5 border border-success/20 rounded text-xs">
                        <p className="text-muted-foreground mb-1">Est. Daily Earnings (live rates)</p>
                        <p className="font-mono font-bold text-success">{dailyBtcEst.toFixed(6)} BTC ≈ ${dailyUsdEst.toFixed(2)}</p>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Price</p>
                        {c.discount_price && <p className="text-xs line-through text-muted-foreground">${c.discount_price.toLocaleString()}</p>}
                        <p className="text-xl font-bold font-mono text-primary">${displayPrice.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/marketplace/${c.slug}`}>Details</Link>
                        </Button>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                          <Link to="/register">Purchase</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-muted/30 border border-border rounded text-xs text-muted-foreground">
            <strong className="text-foreground">Risk Notice:</strong> Mining output is not guaranteed. Earnings depend on network difficulty, cryptocurrency prices, and operational factors. Past performance is not indicative of future results.
          </div>
        </div>
      </section>

      {/* ── Educational Content ───────────────────────────────────────────── */}
      {eduBlocks.length > 0 && (
        <section className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
            <div className="flex items-center gap-2 mb-8">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Mining Education Center</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {eduBlocks.map(block => (
                <div key={block.key} className="border border-border rounded p-6 bg-background">
                  <h3 className="font-semibold text-foreground mb-4">{block.title ?? block.key}</h3>
                  <SimpleMarkdown text={block.body} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace FAQ ───────────────────────────────────────────────── */}
      {mpFaq.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground text-balance">Hashrate Marketplace FAQ</h2>
              <p className="text-muted-foreground mt-2">Everything you need to know about buying Bitcoin mining contracts.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {mpFaq.map(f => (
                <AccordionItem key={f.id} value={f.id} className="border border-border rounded px-4">
                  <AccordionTrigger className="text-sm font-medium text-foreground py-4 text-left hover:no-underline">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 text-pretty">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ── Internal SEO Links ────────────────────────────────────────────── */}
      {mpLinks.length > 0 && (
        <section className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <h2 className="text-lg font-semibold text-foreground mb-6">Related Resources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {mpLinks.map(l => (
                <Link
                  key={l.id}
                  to={l.target_url}
                  className="flex items-start gap-3 p-4 border border-border rounded bg-background hover:border-primary/40 transition-colors group"
                >
                  <ExternalLink className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:text-primary/80" />
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-primary/80">{l.anchor_text}</p>
                    {l.description && <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{l.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
          <Hash className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
            Start Earning Bitcoin Mining Rewards Today
          </h2>
          <p className="text-muted-foreground mb-8 text-pretty">
            Join 26,800+ miners using BTCMiner.online infrastructure. Purchase hashrate and earn from real mining operations — no hardware required.
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">Create Free Account <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/calculator">Calculate Earnings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Sticky mobile CTA ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border p-4">
        <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
          <Link to="#contracts">Browse Contracts <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  </>
  );
}
