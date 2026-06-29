import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import CalculatorEngine from "@/components/calculator/CalculatorEngine";
import { useBtcStats } from "@/hooks/useBtcStats";
import { ChevronRight, ArrowRight } from "lucide-react";

interface VariantConfig {
  slug: string;
  title: string;
  h1: string;
  badge: string;
  description: string;
  canonical: string;
  eduHeading: string;
  eduBody: string;
}

const VARIANTS: Record<string, VariantConfig> = {
  "bitcoin-mining-calculator": {
    slug:        "bitcoin-mining-calculator",
    title:       "Bitcoin Mining Calculator — Estimate BTC Earnings",
    h1:          "Bitcoin Mining Calculator",
    badge:       "Bitcoin Mining Calculator",
    description: "Use our free Bitcoin mining calculator to estimate daily, monthly, and total BTC earnings based on your hashrate. Live network data, real calculations.",
    canonical:   "https://btcminer.online/bitcoin-mining-calculator",
    eduHeading:  "How the Bitcoin Mining Calculator Works",
    eduBody:     "Enter your TH/s hashrate to see how much Bitcoin you can mine daily. The calculator applies the real Bitcoin mining formula using live network difficulty, current block reward (3.125 BTC), and the latest BTC price to estimate your proportional share of the daily block reward pool.",
  },
  "asic-mining-calculator": {
    slug:        "asic-mining-calculator",
    title:       "ASIC Mining Calculator — Bitcoin Profitability Calculator",
    h1:          "ASIC Mining Profitability Calculator",
    badge:       "ASIC Mining Calculator",
    description: "Calculate ASIC Bitcoin mining profitability. Enter your ASIC hashrate (TH/s), duration, and maintenance cost to estimate net daily and monthly BTC earnings.",
    canonical:   "https://btcminer.online/asic-mining-calculator",
    eduHeading:  "ASIC Mining Profitability Explained",
    eduBody:     "Application-Specific Integrated Circuits (ASICs) are purpose-built chips designed exclusively for Bitcoin's SHA-256 proof-of-work algorithm. Modern ASIC miners like the Antminer S21 XP deliver 270 TH/s at 20.8 J/TH efficiency. Enter your ASIC's hashrate spec to calculate expected daily earnings after maintenance costs.",
  },
  "sha256-mining-calculator": {
    slug:        "sha256-mining-calculator",
    title:       "SHA-256 Mining Calculator — Bitcoin Earnings Estimator",
    h1:          "SHA-256 Mining Calculator",
    badge:       "SHA-256 Mining Calculator",
    description: "SHA-256 Bitcoin mining calculator. Estimate your daily BTC rewards from SHA-256 proof-of-work mining using live difficulty and block reward data.",
    canonical:   "https://btcminer.online/sha256-mining-calculator",
    eduHeading:  "SHA-256 Mining and Bitcoin",
    eduBody:     "SHA-256 (Secure Hash Algorithm 256-bit) is the cryptographic proof-of-work algorithm that powers the Bitcoin blockchain. All Bitcoin mining hardware performs SHA-256 computations to compete for block rewards. This calculator uses real-time SHA-256 network data to estimate your proportional share of daily block rewards.",
  },
  "mining-profit-calculator": {
    slug:        "mining-profit-calculator",
    title:       "Mining Profit Calculator — Bitcoin Mining Revenue",
    h1:          "Mining Profit Calculator",
    badge:       "Mining Profit Calculator",
    description: "Calculate your Bitcoin mining profit. Enter hashrate, duration, and maintenance fee to estimate gross revenue, operating costs, and net mining profit.",
    canonical:   "https://btcminer.online/mining-profit-calculator",
    eduHeading:  "Calculating Net Mining Profit",
    eduBody:     "Net mining profit is calculated by subtracting daily maintenance fees from gross mining output. Gross output depends on your TH/s share of the total Bitcoin network hashrate multiplied by the daily block reward. The calculator shows both gross and net figures so you can accurately assess profitability after operating costs.",
  },
  "cloud-mining-calculator": {
    slug:        "cloud-mining-calculator",
    title:       "Cloud Mining Calculator — Cloud Hashrate Earnings Estimator",
    h1:          "Cloud Mining Calculator",
    badge:       "Cloud Mining Calculator",
    description: "Estimate your cloud mining earnings. Calculate how much Bitcoin you can earn from cloud mining contracts using live BTC network data and real profitability formulas.",
    canonical:   "https://btcminer.online/cloud-mining-calculator",
    eduHeading:  "How Cloud Mining Earnings Are Calculated",
    eduBody:     "Cloud mining contracts give you access to physical ASIC hashrate without owning hardware. Your daily earnings are calculated exactly the same way as hardware mining: (Your TH/s ÷ Network TH/s) × 144 blocks × Block Reward − Maintenance Fee. The only difference is that BTCMiner.online's operations team manages all infrastructure on your behalf.",
  },
};

export default function CalculatorVariantPage({ variant }: { variant: string }) {
  const config = VARIANTS[variant];
  const btc    = useBtcStats();

  if (!config) return null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",               item: "https://btcminer.online/" },
      { "@type": "ListItem", position: 2, name: "Mining Calculator",  item: "https://btcminer.online/calculator" },
      { "@type": "ListItem", position: 3, name: config.h1,            item: config.canonical },
    ],
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <link rel="canonical" href={config.canonical} />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/calculator" className="hover:text-foreground transition-colors">Calculator</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{config.h1}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">{config.badge}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-2">{config.h1}</h1>
          <p className="text-muted-foreground max-w-2xl text-pretty mb-4">{config.description}</p>
          <div className="flex flex-wrap gap-6 text-xs">
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

      {/* Calculator */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        <CalculatorEngine ctaLabel={`Start Mining`} />
        <div className="mt-6 p-4 bg-muted/30 border border-border rounded text-xs text-muted-foreground">
          <strong className="text-foreground">Disclaimer:</strong> Calculator results are estimates based on current network conditions. Actual mining output varies. Not financial advice.
        </div>
      </div>

      {/* Tailored edu content */}
      <section className="border-t border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-xl font-bold text-foreground mb-4 text-balance">{config.eduHeading}</h2>
          <p className="text-muted-foreground leading-relaxed text-pretty">{config.eduBody}</p>
          <div className="mt-8 flex flex-col md:flex-row gap-3">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/marketplace">Browse Mining Contracts <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/calculator">Full Calculator Guide</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Variant nav */}
      <section className="border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
          <p className="text-sm font-semibold text-foreground mb-4">More Calculator Tools</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(VARIANTS).filter(v => v.slug !== variant).map(v => (
              <Link key={v.slug} to={`/${v.slug}`}
                className="text-xs px-3 py-1.5 border border-border rounded hover:border-primary/50 hover:text-primary transition-colors text-muted-foreground">
                {v.badge}
              </Link>
            ))}
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
  );
}

export { VARIANTS };
