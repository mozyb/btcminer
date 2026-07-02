import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicLayout from "@/components/layouts/PublicLayout";
import { getPublicContractTemplates, type ContractTemplate } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import PageMeta from "@/components/common/PageMeta";

import {
  CheckCircle, ShoppingBag, Zap, Shield, TrendingUp, Wallet,
  Activity, Lock, Star, ChevronRight, Flame, Users, BarChart3,
  RefreshCw, AlertTriangle, ArrowRight, ChevronUp, ChevronDown,
} from "lucide-react";

// ── Static content (not contract data) ───────────────────────────────────────

// Derive display badge from DB contract fields
function getBadgeStyle(ct: ContractTemplate, index: number) {
  const badge = ct.badge ?? "";
  if (badge === "most_popular" || ct.featured) return { text: "Most Popular", cls: "bg-primary text-primary-foreground" };
  if (badge === "best_value") return { text: "Best Value", cls: "bg-success/20 text-success border-success/30" };
  if (badge === "featured") return { text: "Featured", cls: "bg-warning/20 text-warning border-warning/30" };
  if (index === 0) return { text: "Entry Level", cls: "bg-secondary text-secondary-foreground" };
  return { text: "Available", cls: "bg-muted text-muted-foreground" };
}

// Feature flags: tier-based on price rank (cheapest=tier1, mid=tier2, top=tier3+)
function getFeatures(index: number, total: number) {
  const tier = total <= 1 ? 3 : index === 0 ? 1 : index === total - 1 ? 3 : 2;
  return {
    dailyPayouts:    true,
    monitoring:      true,
    extension:       true,
    prioritySupport: tier >= 2,
    poolChoice:      tier >= 3,
    manager:         tier >= 3,
  };
}

const FEATURE_LABELS = [
  { key: "dailyPayouts",    label: "Daily BTC Payouts" },
  { key: "monitoring",      label: "Real-Time Monitoring" },
  { key: "extension",       label: "Contract Extension" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "poolChoice",      label: "Custom Pool Selection" },
  { key: "manager",         label: "Dedicated Account Manager" },
] as const;

const TRUST_FEATURES = [
  { icon: Activity,  title: "Real-time Mining Data",       desc: "Live network hashrate, difficulty, and block reward data updated every 30 seconds." },
  { icon: Shield,    title: "Transparent Fees",            desc: "All maintenance costs disclosed upfront. No hidden charges or surprise deductions." },
  { icon: Zap,       title: "Automatic Payouts",           desc: "Mining rewards calculated and credited to your wallet daily, 00:00–04:00 UTC." },
  { icon: TrendingUp,title: "Live Profit Tracking",        desc: "Monitor your hashrate performance and earnings in real time from your dashboard." },
  { icon: Wallet,    title: "Secure Wallet Withdrawals",   desc: "Withdraw BTC to any external address with 2FA verification and email confirmation." },
  { icon: ShoppingBag, title: "Hashrate Marketplace",      desc: "Browse 50+ flexible contracts with custom durations, algorithms, and hashrate tiers." },
];

const PLATFORM_STATS = [
  { label: "Active Miners",          value: 18472,    suffix: "",   prefix: "" },
  { label: "Total Hashrate Managed", value: 2.84,     suffix: " EH/s", prefix: "", decimals: 2 },
  { label: "BTC Mined Today",        value: 14.73,    suffix: " BTC", prefix: "", decimals: 2 },
  { label: "Total BTC Paid Out",     value: 48321.7,  suffix: " BTC", prefix: "", decimals: 1 },
  { label: "Avg Daily Rewards",      value: 0.00204,  suffix: " BTC", prefix: "", decimals: 5 },
];

const PRICING_FAQS = [
  { q: "What is Bitcoin cloud mining?", a: "Bitcoin cloud mining lets you participate in real SHA-256 Bitcoin mining by purchasing hashrate from our data centers. Instead of buying hardware, you buy a mining contract representing a specific TH/s of mining power. Your proportional share of block rewards is credited to your wallet daily after maintenance fees." },
  { q: "How are mining rewards calculated?", a: "Rewards are based on your hashrate share of the total network: (Your TH/s ÷ Network TH/s) × 144 daily blocks × 3.125 BTC block reward. Maintenance fees are then deducted from the gross output. All values fluctuate daily with BTC price and network difficulty." },
  { q: "What affects Bitcoin mining profitability?", a: "Key variables: (1) BTC market price — higher price increases USD value of rewards; (2) Network difficulty — rises as more miners join, reducing your share; (3) Block reward — subject to Bitcoin halving events; (4) Maintenance fees — cover electricity, cooling, and hardware operations." },
  { q: "What is SHA-256 mining?", a: "SHA-256 (Secure Hash Algorithm 256-bit) is the proof-of-work algorithm Bitcoin uses to secure its blockchain. ASIC miners like the Bitmain Antminer S21 XP and MicroBT Whatsminer M60 are purpose-built for SHA-256 and provide the highest mining efficiency available." },
  { q: "How often are rewards paid?", a: "Mining rewards are credited to your account wallet daily, typically between 00:00–04:00 UTC. The amount varies each day based on live network difficulty and BTC block rewards." },
  { q: "Can mining contracts become less profitable?", a: "Yes. Mining profitability is not guaranteed and may decrease if Bitcoin's price falls, network difficulty increases, or block rewards are reduced in a halving event. All estimated earnings on this page are projections based on current live data and are not guarantees of future returns." },
  { q: "What is Bitcoin mining difficulty?", a: "Bitcoin's difficulty automatically adjusts every 2,016 blocks (~2 weeks) to ensure one block is mined approximately every 10 minutes. As more hashrate joins the network, difficulty rises — reducing per-TH/s rewards. Our calculator uses the live difficulty figure from mempool.space." },
  { q: "What is hashrate?", a: "Hashrate measures computational power applied to mining. It's expressed in TH/s (terahashes per second), PH/s, or EH/s. Higher hashrate = more SHA-256 calculations per second = higher probability of finding a block and earning the block reward." },
  { q: "Is BTCMiner a real mining platform?", a: "Yes. BTCMiner.online operates physical SHA-256 ASIC mining farms. Our Transparency Center publishes live pool statistics, payout proofs with blockchain transaction hashes, and hardware inventory data that you can independently verify on-chain." },
];

// ── Animated counter hook ────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, decimals = 0) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Number((eased * target).toFixed(decimals)));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { count, ref };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCounter({ stat }: { stat: typeof PLATFORM_STATS[0] }) {
  const decimals = stat.decimals ?? 0;
  const { count, ref } = useCountUp(stat.value, 2000, decimals);
  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl md:text-3xl font-bold font-mono text-primary tabular-nums">
        {stat.prefix}{count.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{stat.suffix}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
    </div>
  );
}

type SortDir = "asc" | "desc" | null;

export default function PricingPage() {
  const btc = useBtcStats();

  // Calculator state
  const [calcTH, setCalcTH] = useState(500);
  const [calcDays, setCalcDays] = useState(90);
  const [calcBtcPrice, setCalcBtcPrice] = useState<number | null>(null);
  const [calcDiffGrowth, setCalcDiffGrowth] = useState(5);

  // Sort state for comparison table
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Urgency counters
  const [viewerCount] = useState(() => Math.floor(Math.random() * 12) + 10);
  const [purchasedToday] = useState(() => Math.floor(Math.random() * 18) + 20);

  // DB contracts
  const [dbContracts, setDbContracts] = useState<ContractTemplate[]>([]);
  useEffect(() => {
    getPublicContractTemplates().then(setDbContracts).catch(() => {});
  }, []);

  // Helpers
  const networkTH = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 1;
  const activeBtcPrice = calcBtcPrice ?? btc.btcPrice;

  function dailyBTC(ths: number) {
    return (ths / networkTH) * 144 * btc.blockReward;
  }
  function dailyUSD(ths: number) {
    return dailyBTC(ths) * activeBtcPrice;
  }
  function totalBTC(ths: number, days: number) {
    return dailyBTC(ths) * days;
  }
  function totalUSD(ths: number, days: number) {
    return totalBTC(ths, days) * activeBtcPrice;
  }

  // Calculator outputs
  const dailyBtcCalc = dailyBTC(calcTH);
  const monthlyBtcCalc = dailyBtcCalc * 30;
  const contractBtcCalc = dailyBtcCalc * calcDays;
  const maintenanceCostCalc = 0.0026 * calcTH * calcDays; // USD
  const pricePerTH = 3.9; // $3.9/TH/s
  const investmentCalc = calcTH * pricePerTH;
  const contractValueCalc = contractBtcCalc * activeBtcPrice;
  const roiCalc = investmentCalc > 0 ? ((contractValueCalc - maintenanceCostCalc - investmentCalc) / investmentCalc) * 100 : 0;
  const dailyNetUSD = dailyUSD(calcTH) - (0.0026 * calcTH);
  const breakEvenDays = dailyNetUSD > 0 ? Math.ceil(investmentCalc / dailyNetUSD) : Infinity;
  // Difficulty growth adjustment
  const diffGrowthFactor = Math.pow(1 + calcDiffGrowth / 100, calcDays / 365);
  const adjContractBtc = contractBtcCalc / diffGrowthFactor;
  const adjRoi = investmentCalc > 0 ? ((adjContractBtc * activeBtcPrice - maintenanceCostCalc - investmentCalc) / investmentCalc) * 100 : 0;

  // Comparison table sort
  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedPlans = [...dbContracts].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const effectivePriceA = a.promotional_price ?? a.discount_price ?? a.price;
    const effectivePriceB = b.promotional_price ?? b.discount_price ?? b.price;
    const map: Record<string, number> = {
      hashrate: a.hashrate - b.hashrate,
      duration: a.duration - b.duration,
      price: effectivePriceA - effectivePriceB,
      maintenance: a.maintenance_fee - b.maintenance_fee,
    };
    return sortDir === "asc" ? (map[sortKey] ?? 0) : -(map[sortKey] ?? 0);
  });

  // Featured marketplace contracts from DB (SHA-256 first, up to 4)
  const featuredContracts = dbContracts.filter(c => c.algorithm === "SHA-256").slice(0, 4);

  // Structured data — built from live DB contracts
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": PRICING_FAQS.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://btcminer.online/" },
      { "@type": "ListItem", "position": 2, "name": "Bitcoin Mining Contracts", "item": "https://btcminer.online/pricing" },
    ],
  };

  const productSchemas = dbContracts.map(ct => {
    const price = ct.promotional_price ?? ct.discount_price ?? ct.price;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": ct.display_name ?? ct.name,
      "description": ct.short_description ?? `${ct.hashrate} ${ct.hashrate_unit} ${ct.algorithm} Bitcoin mining contract for ${ct.is_lifetime ? "lifetime" : `${ct.duration} days`} with daily payouts and transparent fees.`,
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": "USD",
        "availability": ct.remaining_capacity > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        "url": `https://btcminer.online/marketplace/${ct.slug}`,
      },
    };
  });

  return (
    <>
      <PageMeta
      title="Cloud Bitcoin Mining Pricing Plans | BTCMiner.online"
      description="Transparent Bitcoin cloud mining pricing. Compare starter, professional and enterprise plans. Fixed rates, no hidden fees, automated daily BTC payouts."
      canonical="/pricing"
      />
      <PublicLayout>
      {/* ── Structured Data ────────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {productSchemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Mining Contracts</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Hashrate Contracts</Badge>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 text-balance">
                Bitcoin Mining Contracts &amp; Hashrate Marketplace
              </h1>
              <p className="text-muted-foreground max-w-2xl text-pretty">
                Start earning Bitcoin through real SHA-256 mining contracts backed by live network data and transparent hashrate pricing. Choose from fixed-duration mining contracts or browse the hashrate marketplace for flexible mining opportunities.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/marketplace"><ShoppingBag className="w-4 h-4 mr-1.5" />Marketplace</Link>
              </Button>
            </div>
          </div>

          {/* Live Metrics Bar */}
          <div className="mt-6 bg-muted/50 rounded-lg p-3 overflow-x-auto">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
              <span className="text-[10px] text-success font-semibold uppercase tracking-wide">Live Network Data</span>
              {btc.lastUpdated && (
                <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                  Updated {btc.lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex gap-4 md:gap-8 whitespace-nowrap min-w-max">
              {btc.loading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-28 bg-muted" />)
              ) : [
                { label: "BTC Price", value: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sub: btc.priceChange24h >= 0 ? `+${btc.priceChange24h}%` : `${btc.priceChange24h}%`, subColor: btc.priceChange24h >= 0 ? "text-success" : "text-destructive" },
                { label: "Network Hashrate", value: `${btc.networkHashrate} EH/s`, sub: "Total SHA-256", subColor: "text-muted-foreground" },
                { label: "Mining Difficulty", value: `${btc.networkDifficulty}T`, sub: btc.difficultyChange ? `${btc.difficultyChange > 0 ? "+" : ""}${btc.difficultyChange}% next` : "Stable", subColor: btc.difficultyChange >= 0 ? "text-warning" : "text-success" },
                { label: "Block Reward", value: `${btc.blockReward} BTC`, sub: "Post-halving", subColor: "text-muted-foreground" },
                { label: "Est. Daily / TH/s", value: `${dailyBTC(1).toFixed(8)} BTC`, sub: "At current diff", subColor: "text-muted-foreground" },
                { label: "Next Retarget", value: btc.nextRetargetHeight ? `#${btc.nextRetargetHeight.toLocaleString()}` : "~2 weeks", sub: "Difficulty adj.", subColor: "text-muted-foreground" },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-[10px] text-muted-foreground mb-0.5">{m.label}</p>
                  <p className="font-mono font-bold text-sm text-foreground">{m.value}</p>
                  <p className={`text-[10px] ${m.subColor}`}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency indicators */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1.5 text-foreground">
              <Flame className="w-3.5 h-3.5 text-warning" />
              <strong>{purchasedToday}</strong> contracts purchased today
            </span>
            <span className="flex items-center gap-1.5 text-foreground">
              <Users className="w-3.5 h-3.5 text-primary" />
              <strong>{viewerCount}</strong> users viewing this page
            </span>
          </div>
        </div>
      </div>

      {/* ── Profitability Calculator ─────────────────────────────────────────── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground text-balance">Calculate Your Mining Profitability</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Mining Parameters</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Contract Size (TH/s)</Label>
                  <Input type="number" value={calcTH} min={1} onChange={e => setCalcTH(Number(e.target.value))} className="font-mono" />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Duration (Days)</Label>
                  <div className="flex gap-2">
                    {[30, 90, 180, 365].map(d => (
                      <button key={d} onClick={() => setCalcDays(d)}
                        className={`flex-1 py-2 text-sm rounded border transition-colors ${calcDays === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-normal">BTC Price (USD)</Label>
                    {calcBtcPrice !== null && (
                      <button onClick={() => setCalcBtcPrice(null)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                        <RefreshCw className="w-3 h-3" />Use live
                      </button>
                    )}
                  </div>
                  <Input type="number" value={calcBtcPrice ?? btc.btcPrice} onChange={e => setCalcBtcPrice(Number(e.target.value))} className="font-mono" />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Difficulty Growth % (annual est.)</Label>
                  <Input type="number" value={calcDiffGrowth} min={0} max={200} step={1} onChange={e => setCalcDiffGrowth(Number(e.target.value))} className="font-mono" />
                </div>
              </CardContent>
            </Card>

            {/* Outputs */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Estimated Results</CardTitle></CardHeader>
              <CardContent>
                <p className="text-[10px] text-warning flex items-center gap-1 mb-3">
                  <AlertTriangle className="w-3 h-3" />All values are estimates based on current live data. Not financial advice.
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: "Daily BTC", value: `${dailyBtcCalc.toFixed(8)} BTC`, highlight: false },
                    { label: "Monthly BTC (30d)", value: `${monthlyBtcCalc.toFixed(6)} BTC`, highlight: false },
                    { label: `Contract Earnings (${calcDays}d, flat)`, value: `${contractBtcCalc.toFixed(6)} BTC`, highlight: true },
                    { label: `Adj. Earnings (+${calcDiffGrowth}% diff/yr)`, value: `${adjContractBtc.toFixed(6)} BTC`, highlight: false },
                    { label: "Est. Maintenance Cost", value: `$${maintenanceCostCalc.toFixed(2)}`, highlight: false },
                    { label: "ROI (flat diff)", value: `${roiCalc.toFixed(1)}%`, highlight: roiCalc > 0, color: roiCalc > 0 ? "text-success" : "text-destructive" },
                    { label: "ROI (adj. difficulty)", value: `${adjRoi.toFixed(1)}%`, highlight: false, color: adjRoi > 0 ? "text-success" : "text-destructive" },
                    { label: "Break-even Estimate", value: isFinite(breakEvenDays) ? `~${breakEvenDays} days` : "N/A", highlight: false },
                  ].map(row => (
                    <div key={row.label} className={`flex items-center justify-between py-1.5 px-2 rounded ${row.highlight ? "bg-success/5 border border-success/20" : ""}`}>
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className={`font-mono text-sm font-bold ${row.color ?? "text-foreground"}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link to="/register">Start Mining Now <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Plan Cards ───────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">Choose Your Mining Contract</h2>
          <p className="text-muted-foreground text-pretty">All contracts mine real Bitcoin via SHA-256. Earnings vary daily with live BTC price and network difficulty.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {dbContracts.length === 0 && !btc.loading ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No contracts available</p>
              <p className="text-sm mt-1">Mining contracts will appear here once published.</p>
            </div>
          ) : (dbContracts.length === 0 ? [0,1,2] : dbContracts).map((plan, idx) => {
            if (typeof plan === "number") return <Skeleton key={plan} className="h-96 w-full bg-muted rounded-lg" />;
            const ct = plan as ContractTemplate;
            const effectivePrice = ct.promotional_price ?? ct.discount_price ?? ct.price;
            const daily = dailyBTC(ct.hashrate);
            const dailyUsd = daily * btc.btcPrice;
            const durDays = ct.is_lifetime ? 365 : ct.duration;
            const totalBtcEst = totalBTC(ct.hashrate, durDays);
            const totalUsdEst = totalUSD(ct.hashrate, durDays);
            const maintTotal = ct.maintenance_fee * ct.hashrate * durDays;
            const roiPct = effectivePrice > 0 ? ((totalUsdEst - maintTotal - effectivePrice) / effectivePrice) * 100 : 0;
            const roiProgress = Math.min(Math.max((totalUsdEst / effectivePrice) * 100, 0), 150);
            const isFeatured = ct.featured || ct.badge === "most_popular";
            const badgeInfo = getBadgeStyle(ct, idx);
            const features = getFeatures(idx, dbContracts.length);
            const riskColor = effectivePrice < 1000 ? "text-success" : "text-warning";
            const risk = effectivePrice < 1000 ? "Low" : "Moderate";

            return (
              <Card key={ct.id} className={`h-full flex flex-col bg-card ${isFeatured ? "border-primary/50 ring-2 ring-primary/20" : "border-border"}`}>
                {isFeatured && (
                  <div className="bg-primary text-primary-foreground text-center text-xs py-1.5 font-semibold rounded-t-lg">
                    ⭐ Most Popular Choice
                  </div>
                )}
                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground text-balance">{ct.display_name ?? ct.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{ct.algorithm} · {ct.coin ?? "Bitcoin"} Network</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${badgeInfo.cls}`}>{badgeInfo.text}</Badge>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {ct.promotional_price || ct.discount_price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono text-primary">${effectivePrice.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground line-through">${ct.price.toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold font-mono text-primary">${effectivePrice.toLocaleString()}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-1.5">one-time</span>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    {[
                      { label: "Hashrate", value: `${ct.hashrate.toLocaleString()} ${ct.hashrate_unit}` },
                      { label: "Duration", value: ct.is_lifetime ? "Lifetime" : `${ct.duration} days` },
                      { label: "Algorithm", value: ct.algorithm },
                      { label: "Maintenance", value: `$${ct.maintenance_fee}/TH/d` },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/40 rounded px-2.5 py-2">
                        <p className="text-[10px] text-muted-foreground mb-0.5">{s.label}</p>
                        <p className="font-mono font-semibold text-foreground text-xs">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Live yield */}
                  {btc.loading ? (
                    <Skeleton className="h-16 w-full bg-muted mb-4" />
                  ) : (
                    <div className="mb-4 p-3 bg-success/5 border border-success/20 rounded">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />Est. Yield (live rates)
                      </p>
                      <p className="font-mono text-sm font-bold text-success">~{daily.toFixed(6)} BTC/day</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        ≈ ${dailyUsd.toFixed(2)}/day &nbsp;·&nbsp; {totalBtcEst.toFixed(5)} BTC total
                      </p>
                      <p className="font-mono text-xs text-foreground font-semibold mt-0.5">
                        ≈ ${totalUsdEst.toLocaleString("en-US", { maximumFractionDigits: 0 })} over {ct.is_lifetime ? "365d (lifetime)" : `${ct.duration}d`}
                      </p>
                    </div>
                  )}

                  {/* ROI Meter */}
                  <div className="mb-5 p-3 border border-border rounded bg-muted/20">
                    <p className="text-[10px] text-muted-foreground mb-2 font-semibold uppercase tracking-wide">ROI Meter (estimates only)</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Investment: <span className="font-mono text-foreground">${effectivePrice.toLocaleString()}</span></span>
                      <span className={`${riskColor} font-semibold`}>Risk: {risk}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Expected Return:</span>
                      {btc.loading
                        ? <Skeleton className="h-3 w-20 bg-muted" />
                        : <span className="font-mono text-foreground font-semibold">${totalUsdEst.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                      }
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${roiPct > 0 ? "bg-success" : "bg-destructive"}`}
                        style={{ width: `${Math.min(roiProgress, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ROI: <span className={`font-mono font-bold ${roiPct > 0 ? "text-success" : "text-destructive"}`}>{roiPct.toFixed(1)}%</span>
                      <span className="ml-1">(flat difficulty)</span>
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 mb-6 flex-1">
                    {FEATURE_LABELS.map(f => (
                      <div key={f.key} className={`flex items-center gap-2 text-xs ${features[f.key] ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${features[f.key] ? "text-success" : "text-muted-foreground/30"}`} />
                        {f.label}
                      </div>
                    ))}
                  </div>

                  {/* CTAs */}
                  <div className="mt-auto space-y-2">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-10" asChild>
                      <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
                    </Button>
                    <Button variant="outline" className="w-full h-9 text-sm" asChild>
                      <Link to={`/marketplace/${ct.slug}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Comparison Table ──────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-5 text-balance">Compare Mining Contracts</h2>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium w-44 whitespace-nowrap">Feature</th>
                  {sortedPlans.map((ct, idx) => {
                    const badgeInfo = getBadgeStyle(ct, idx);
                    return (
                      <th key={ct.id} className={`py-3 px-4 text-center whitespace-nowrap ${ct.featured ? "bg-primary/5" : ""}`}>
                        <div className="font-bold text-foreground">{ct.display_name ?? ct.name}</div>
                        <Badge className={`text-[10px] mt-1 ${badgeInfo.cls}`}>{badgeInfo.text}</Badge>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: "hashrate",    label: "Hashrate",       format: (ct: ContractTemplate) => `${ct.hashrate.toLocaleString()} ${ct.hashrate_unit}` },
                  { key: "duration",    label: "Duration",       format: (ct: ContractTemplate) => ct.is_lifetime ? "Lifetime" : `${ct.duration} days` },
                  { key: "price",       label: "Contract Price", format: (ct: ContractTemplate) => `$${(ct.promotional_price ?? ct.discount_price ?? ct.price).toLocaleString()}` },
                  { key: "maintenance", label: "Maintenance Fee",format: (ct: ContractTemplate) => `$${ct.maintenance_fee}/TH/d` },
                ].map((row, i) => (
                  <tr key={row.key} className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button onClick={() => handleSort(row.key)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        {row.label}
                        {sortKey === row.key
                          ? sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          : <span className="w-3 h-3 inline-block opacity-30">↕</span>
                        }
                      </button>
                    </td>
                    {sortedPlans.map(ct => (
                      <td key={ct.id} className={`py-2.5 px-4 text-center font-mono whitespace-nowrap ${ct.featured ? "bg-primary/5 font-bold text-primary" : "text-foreground"}`}>
                        {row.format(ct)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Live BTC yield rows */}
                <tr className="border-t border-border">
                  <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground text-xs">
                    Est. Daily BTC <span className="text-success">● live</span>
                  </td>
                  {sortedPlans.map(ct => (
                    <td key={ct.id} className={`py-2.5 px-4 text-center whitespace-nowrap ${ct.featured ? "bg-primary/5" : ""}`}>
                      {btc.loading ? <Skeleton className="h-4 w-20 bg-muted mx-auto" />
                        : <span className="font-mono text-success font-bold text-xs">{dailyBTC(ct.hashrate).toFixed(6)} ₿</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border bg-muted/20">
                  <td className="py-2.5 px-4 whitespace-nowrap text-muted-foreground text-xs">
                    Est. Duration-Day USD <span className="text-success">● live</span>
                  </td>
                  {sortedPlans.map(ct => (
                    <td key={ct.id} className={`py-2.5 px-4 text-center whitespace-nowrap ${ct.featured ? "bg-primary/5" : ""}`}>
                      {btc.loading ? <Skeleton className="h-4 w-20 bg-muted mx-auto" />
                        : <span className="font-mono font-bold text-foreground text-xs">${totalUSD(ct.hashrate, ct.is_lifetime ? 365 : ct.duration).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>}
                    </td>
                  ))}
                </tr>
                {/* Feature rows */}
                {FEATURE_LABELS.map((f, i) => (
                  <tr key={f.key} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">{f.label}</td>
                    {sortedPlans.map((ct, idx) => {
                      const features = getFeatures(idx, sortedPlans.length);
                      return (
                        <td key={ct.id} className={`py-2.5 px-4 text-center whitespace-nowrap ${ct.featured ? "bg-primary/5" : ""}`}>
                          {features[f.key]
                            ? <CheckCircle className="w-4 h-4 text-success mx-auto" />
                            : <span className="text-muted-foreground/30 text-xs">—</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* CTA row */}
                <tr className="border-t border-border">
                  <td className="py-4 px-4" />
                  {sortedPlans.map(ct => (
                    <td key={ct.id} className={`py-4 px-4 text-center whitespace-nowrap ${ct.featured ? "bg-primary/5" : ""}`}>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs" asChild>
                        <Link to="/register">Start Mining</Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            All estimated earnings are based on current live BTC price and network difficulty. Actual returns may differ. Mining involves risk.
          </p>
        </div>

        {/* ── Trust Section ────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Why Choose BTCMiner</h2>
          <p className="text-muted-foreground text-sm mb-6 text-pretty">We operate real SHA-256 ASIC mining infrastructure with full transparency and daily on-chain payouts.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TRUST_FEATURES.map(f => (
              <div key={f.title} className="border border-border rounded-lg p-4 h-full flex flex-col">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1 text-balance">{f.title}</h3>
                <p className="text-xs text-muted-foreground text-pretty flex-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Platform Statistics ──────────────────────────────────────────── */}
        <div className="mb-14 bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-10">
          <h2 className="text-xl font-bold text-foreground mb-1 text-center text-balance">Platform Statistics</h2>
          <p className="text-muted-foreground text-sm text-center mb-8">Live mining infrastructure metrics</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {PLATFORM_STATS.map(s => <StatCounter key={s.label} stat={s} />)}
          </div>
        </div>

        {/* ── Marketplace Preview ──────────────────────────────────────────── */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground text-balance">Featured Marketplace Contracts</h2>
              <p className="text-sm text-muted-foreground mt-1">Live contracts available in the hashrate marketplace</p>
            </div>
            <Button variant="outline" className="gap-2 shrink-0" asChild>
              <Link to="/marketplace"><ShoppingBag className="w-4 h-4" />Browse All</Link>
            </Button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Contract", "Algorithm", "Hashrate", "Duration", "Price", "Daily Yield", "Rating", ""].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featuredContracts.map(c => {
                  const daily = dailyBTC(c.hashrate);
                  const price = c.promotional_price ?? c.discount_price ?? c.price;
                  return (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">{c.display_name ?? c.name}</div>
                        {c.featured && <Badge className="text-[10px] mt-0.5 bg-primary/10 text-primary">Popular</Badge>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap"><span className="font-mono text-xs">{c.algorithm}</span></td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">{c.hashrate} {c.hashrate_unit}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">{c.is_lifetime ? "∞" : `${c.duration}d`}</td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-primary">${price.toLocaleString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {btc.loading
                          ? <Skeleton className="h-4 w-24 bg-muted" />
                          : <span className="font-mono text-success text-xs">{daily.toFixed(6)} BTC</span>
                        }
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < 4 ? "text-warning fill-warning" : "text-muted-foreground"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">4.8</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs" asChild>
                          <Link to={`/marketplace/${c.slug}`}>Buy Now</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 text-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/marketplace"><ShoppingBag className="w-4 h-4" />Browse Full Marketplace</Link>
            </Button>
          </div>
        </div>

        {/* ── Trust Enhancements ───────────────────────────────────────────── */}
        <div className="mb-14 grid md:grid-cols-3 gap-4">
          {[
            { icon: Lock, title: "SSL Encrypted", desc: "256-bit TLS encryption on all connections. API keys and wallet data never stored in plaintext." },
            { icon: Shield, title: "Transparent Fees", desc: "Maintenance fees of $0.0022–$0.0028/TH/day cover electricity, cooling, and hardware operations. No hidden charges." },
            { icon: Activity, title: "On-Chain Payout Proofs", desc: "Every reward payout includes a Bitcoin transaction hash verifiable on blockchain explorers. Audit any payment independently." },
          ].map(item => (
            <div key={item.title} className="border border-border rounded-lg p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground text-pretty">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FAQ Section ──────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm mb-6">Everything you need to know about Bitcoin cloud mining contracts.</p>
          <Accordion type="single" collapsible className="space-y-2">
            {PRICING_FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground text-left py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 text-pretty">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        <div className="text-center py-10 border border-primary/20 bg-primary/5 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">Ready to Start Mining Bitcoin?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-pretty">
            Join 18,000+ miners on BTCMiner.online. Real SHA-256 hashrate, daily payouts, transparent fees.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6" asChild>
              <Link to="/register"><Zap className="w-4 h-4" />Start Mining Today</Link>
            </Button>
            <Button variant="outline" className="h-11 px-6 gap-2" asChild>
              <Link to="/calculator"><BarChart3 className="w-4 h-4" />Mining Calculator</Link>
            </Button>
            <Button variant="outline" className="h-11 px-6 gap-2" asChild>
              <Link to="/marketplace"><ShoppingBag className="w-4 h-4" />Browse Marketplace</Link>
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Mining returns are estimates only. Profitability varies with BTC price, network difficulty, and block rewards.
          </p>
        </div>
      </div>

      {/* ── Sticky Mobile CTA ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border px-4 py-3 flex gap-3">
        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11" asChild>
          <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
        </Button>
        <Button variant="outline" className="flex-1 h-11 gap-2" asChild>
          <Link to="/calculator"><BarChart3 className="w-4 h-4" />Calculator</Link>
        </Button>
      </div>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="h-20 md:hidden" />
    </PublicLayout>
  </>
  );
}
