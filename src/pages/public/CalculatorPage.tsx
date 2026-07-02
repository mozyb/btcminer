import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PublicLayout from "@/components/layouts/PublicLayout";
import CalculatorEngine from "@/components/calculator/CalculatorEngine";
import { useBtcStats } from "@/hooks/useBtcStats";
import { supabase } from "@/db/supabase";
import { getPublicContractTemplates, type ContractTemplate } from "@/lib/api";
import PageMeta from "@/components/common/PageMeta";

import {
  ChevronRight, ArrowRight, TrendingUp, Zap, BarChart3,
  DollarSign, Shield, BookOpen, ExternalLink, Cpu, Hash,
} from "lucide-react";

interface CalcContent  { key: string; title: string | null; body: string; }
interface CalcFaq      { id: string; question: string; answer: string; }
interface CalcHardware { id: string; model: string; manufacturer: string | null; hashrate_ths: number; power_watts: number; efficiency_jth: number | null; est_daily_usd: number | null; efficiency_rating: string | null; }
interface CalcLink     { id: string; anchor_text: string; target_url: string; description: string | null; }

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4">{line.slice(3)}</h3>;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        if (parts.length > 1) return <p key={i} className="text-pretty">{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{p}</strong> : p)}</p>;
        if (line.startsWith("- ")) return <p key={i} className="flex gap-2"><span className="text-primary shrink-0">·</span><span className="text-pretty">{line.slice(2)}</span></p>;
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i} className="text-pretty">{line}</p>;
      })}
    </div>
  );
}

const FACTOR_ICONS: Record<string, React.ElementType> = {
  factors_hashrate:    Zap,
  factors_difficulty:  BarChart3,
  factors_price:       DollarSign,
  factors_maintenance: Shield,
  factors_rewards:     Hash,
};

export default function CalculatorPage() {
  const btc = useBtcStats();
  const [content,  setContent]  = useState<CalcContent[]>([]);
  const [faq,      setFaq]      = useState<CalcFaq[]>([]);
  const [hardware, setHardware] = useState<CalcHardware[]>([]);
  const [links,    setLinks]    = useState<CalcLink[]>([]);
  const [netDaily, setNetDaily] = useState(0);
  const [hashrate, setHashrate] = useState(500);
  const [dbContracts, setDbContracts] = useState<ContractTemplate[]>([]);

  useEffect(() => {
    supabase.from("calculator_content").select("key,title,body").eq("visible", true).order("sort_order").then(({ data }) => setContent(data ?? []));
    supabase.from("calculator_faq").select("id,question,answer").eq("visible", true).order("sort_order").then(({ data }) => setFaq(data ?? []));
    supabase.from("calculator_hardware").select("*").eq("visible", true).order("sort_order").then(({ data }) => setHardware(data ?? []));
    supabase.from("calculator_links").select("*").eq("visible", true).order("sort_order").then(({ data }) => setLinks(data ?? []));
    getPublicContractTemplates().then(setDbContracts).catch(() => {});
  }, []);

  const introBlock   = content.find(c => c.key === "intro");
  const guideBlock   = content.find(c => c.key === "guide");
  const factorBlocks = content.filter(c => c.key.startsWith("factors_"));
  const btcPrice     = btc.btcPrice || 97000;

  // Recommended contracts from DB based on hashrate entered
  const recommended = dbContracts
    .filter(c => {
      const normalised = c.hashrate_unit === "PH/s" ? c.hashrate * 1000
                       : c.hashrate_unit === "GH/s" ? c.hashrate / 1000
                       : c.hashrate;
      return normalised <= hashrate * 2 && normalised >= hashrate * 0.3;
    })
    .slice(0, 3);

  // Structured data
  const faqSchema = faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(f => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",                item: "https://btcminer.online/" },
      { "@type": "ListItem", position: 2, name: "Mining Calculator",   item: "https://btcminer.online/calculator" },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Bitcoin Mining Calculator — Estimate Mining Profitability | BTCMiner.online",
    description: "Free Bitcoin mining profitability calculator. Enter your hashrate and estimate daily, monthly, and total BTC earnings using live network data.",
    url: "https://btcminer.online/calculator",
    breadcrumb: breadcrumbSchema,
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BTCMiner.online",
    url: "https://btcminer.online",
    description: "Enterprise Bitcoin cloud mining platform.",
  };

  return (
    <>
      <PageMeta
      title="Bitcoin Mining Profitability Calculator | BTCMiner.online"
      description="Use our free Bitcoin mining calculator to estimate daily, weekly, and monthly BTC earnings. Enter your hashrate, electricity cost and difficulty to calculate profits."
      canonical="/calculator"
      />
      <PublicLayout>
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={webPageSchema} />
      <JsonLd data={orgSchema} />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Mining Calculator</span>
        </div>
      </div>

      {/* Hero + Calculator */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Bitcoin Mining Calculator</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-2">
            Bitcoin Mining Profitability Calculator
          </h1>
          <p className="text-muted-foreground mb-2 max-w-2xl text-pretty">
            Estimate your SHA-256 mining earnings using live Bitcoin network data. Enter your hashrate, duration, and maintenance fee to calculate daily and total BTC rewards.
          </p>
          <div className="flex flex-wrap gap-6 mt-4 text-xs">
            {btc.loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-28 bg-muted" />) : [
              { label: "BTC Price",        val: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` },
              { label: "Network Hashrate", val: `${btc.networkHashrate} EH/s` },
              { label: "Difficulty",       val: `${btc.networkDifficulty}T` },
            ].map(s => (
              <span key={s.label}>
                <span className="text-muted-foreground">{s.label}: </span>
                <span className="font-mono font-bold text-primary">{s.val}</span>
                <span className="ml-1 text-success text-[10px]">● LIVE</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <CalculatorEngine
          onResultChange={(daily, hr) => { setNetDaily(daily); setHashrate(hr); }}
        />
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> This calculator provides estimates based on current network conditions. Actual mining output varies with difficulty changes, pool luck, hardware availability, and BTC price fluctuations. This is not financial advice.
        </div>
      </div>

      {/* Recommended contracts */}
      {recommended.length > 0 && (
        <section className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
            <h2 className="text-lg font-semibold text-foreground mb-5">Recommended Contracts for {hashrate} TH/s</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {recommended.map((c: ContractTemplate) => {
                const normalised = c.hashrate_unit === "PH/s" ? c.hashrate * 1000 : c.hashrate_unit === "GH/s" ? c.hashrate / 1000 : c.hashrate;
                const networkTH  = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 850e6;
                const daily      = (normalised / networkTH) * 144 * (btc.blockReward || 3.125) * btcPrice;
                const price      = c.promotional_price ?? c.discount_price ?? c.price;
                return (
                  <Card key={c.id} className="bg-card border-border h-full flex flex-col hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex flex-col flex-1">
                      <p className="font-semibold text-foreground mb-1">{c.display_name ?? c.name}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {c.hashrate} {c.hashrate_unit} · {c.is_lifetime ? "Lifetime" : `${c.duration} days`}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">Est. Daily</p>
                      <p className="font-mono font-bold text-success mb-4">${daily.toFixed(2)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="font-bold font-mono text-primary">${price.toLocaleString()}</p>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                          <Link to={`/marketplace/${c.slug}`}>View <ArrowRight className="w-3 h-3 ml-1" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Live Insights */}
      <section className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Live Mining Insights</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {btc.loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 bg-muted rounded" />) : [
              { label: "BTC Price",          val: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, icon: DollarSign },
              { label: "Network Hashrate",   val: `${btc.networkHashrate} EH/s`,     icon: Zap },
              { label: "Mining Difficulty",  val: `${btc.networkDifficulty}T`,        icon: BarChart3 },
              { label: "Block Reward",       val: `${btc.blockReward} BTC`,           icon: Hash },
              { label: "Est. Daily (500 TH/s)", val: `$${((500 / (btc.networkHashrate * 1e6 || 850e6)) * 144 * (btc.blockReward || 3.125) * btcPrice).toFixed(2)}`, icon: TrendingUp },
              { label: "Market Trend",       val: btc.btcPrice > 50000 ? "Bullish ↑" : "Neutral →", icon: TrendingUp },
            ].map(s => (
              <div key={s.label} className="border border-border rounded p-4 bg-card text-center">
                <div className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center mx-auto mb-2">
                  <s.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="font-mono font-bold text-primary text-sm">{s.val}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro SEO Content */}
      {introBlock && (
        <section className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-balance">{introBlock.title}</h2>
                <SimpleMarkdown text={introBlock.body} />
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-4">Quick Links</p>
                {links.slice(0, 5).map(l => (
                  <Link key={l.id} to={l.target_url} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />{l.anchor_text}
                  </Link>
                ))}
                <div className="mt-6 pt-4 border-t border-border">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                    <Link to="/marketplace">Browse Contracts <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Profitability Factors */}
      {factorBlocks.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">Factors Affecting Mining Profitability</h2>
            <p className="text-muted-foreground mb-10 text-pretty">Understanding what drives Bitcoin mining income helps you make better purchasing decisions.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {factorBlocks.map(f => {
                const Icon = FACTOR_ICONS[f.key] ?? Zap;
                return (
                  <div key={f.key} className="border border-border rounded p-6 bg-card hover:border-primary/30 transition-colors">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-3">{f.title ?? f.key}</h3>
                    <SimpleMarkdown text={f.body} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Start Mining CTA */}
      <section className="border-t border-border bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 text-center">
          <h2 className="text-xl font-bold text-foreground mb-3 text-balance">Ready to Start Mining Bitcoin?</h2>
          <p className="text-muted-foreground mb-6 text-pretty">Purchase hashrate contracts from our marketplace and start earning daily BTC rewards within minutes.</p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/marketplace">Browse Mining Contracts <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">View Mining Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Profitability Guide */}
      {guideBlock && (
        <section className="border-t border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-balance">{guideBlock.title}</h2>
            <SimpleMarkdown text={guideBlock.body} />
            <div className="mt-8">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                <Link to="/register">Start Mining Now <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Hardware Comparison */}
      {hardware.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
            <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">ASIC Mining Hardware Comparison</h2>
            <p className="text-muted-foreground mb-8 text-pretty">Performance comparison of leading SHA-256 ASIC miners used in our data centers.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm bg-card border border-border rounded">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["ASIC Model", "Manufacturer", "Hashrate", "Power", "Efficiency", "Est. Daily*", "Rating"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hardware.map(hw => (
                    <tr key={hw.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{hw.model}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hw.manufacturer ?? "—"}</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{hw.hashrate_ths} TH/s</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{hw.power_watts}W</td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{hw.efficiency_jth ?? "—"} J/TH</td>
                      <td className="py-3 px-4 font-mono text-success whitespace-nowrap">${hw.est_daily_usd?.toFixed(2) ?? "—"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${hw.efficiency_rating === "Excellent" ? "bg-success/10 text-success" : hw.efficiency_rating === "Very Good" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {hw.efficiency_rating ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">* Estimated daily USD earnings based on current BTC price and network difficulty. Actual earnings vary.</p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="border-t border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-14">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground text-balance">Mining Calculator FAQ</h2>
              <p className="text-muted-foreground mt-2">Common questions about Bitcoin mining profitability calculations.</p>
            </div>
            <Accordion type="single" collapsible className="space-y-2">
              {faq.map(f => (
                <AccordionItem key={f.id} value={f.id} className="border border-border rounded px-4">
                  <AccordionTrigger className="text-sm font-medium text-foreground py-4 text-left hover:no-underline">{f.question}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 text-pretty">{f.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Internal links */}
      {links.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Mining Resources</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {links.map(l => (
                <Link key={l.id} to={l.target_url}
                  className="flex items-start gap-3 p-4 border border-border rounded bg-card hover:border-primary/40 transition-colors group">
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

      {/* Final CTA */}
      <section className="border-t border-border bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
          <Cpu className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
            Start Earning Bitcoin Mining Rewards
          </h2>
          <p className="text-muted-foreground mb-8 text-pretty">
            Your mining calculator results show the potential. Turn those numbers into real daily BTC earnings — no hardware required.
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">Create Free Account <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/marketplace">Browse Hashrate Contracts</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border p-4">
        <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
          <Link to="/register">Start Mining <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  </>
  );
}
