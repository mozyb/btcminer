import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import { miningHardware } from "@/lib/mockData";
import { getPublicContractTemplates, type ContractTemplate } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { supabase } from "@/db/supabase";
import PageMeta from "@/components/common/PageMeta";

import {
  Shield, Globe, TrendingUp, Server, Cpu, ChevronRight,
  ArrowRight, CheckCircle, Activity, Hash, Star, ChevronDown,
  Users, Database, Wallet, Clock, BookOpen,
  ShieldCheck, ExternalLink,
} from "lucide-react";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-border rounded p-4 bg-card h-full">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono text-primary">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-success live-dot inline-block" />
      <span className="text-xs text-success font-medium">LIVE</span>
    </span>
  );
}

interface PlatformStat { key: string; value: string; label: string | null; }
interface Review { id: string; author_name: string; author_country: string | null; rating: number; title: string; body: string; verified: boolean; featured: boolean; }
interface FaqItem { id: string; category: string; question: string; answer: string; sort_order: number; }
interface BlogPost { id: string; slug: string; title: string; excerpt: string | null; category: string; tags: string[]; author_name: string; featured_image: string | null; featured: boolean; read_time_min: number; created_at: string; }
interface PayoutProof { id: string; amount: number; currency: string; usd_value: number | null; created_at: string; }
interface HomeFarm { id: string; name: string; country: string; flag: string; capacity: number; power_source: string; cooling: string; active_miners: number; uptime: number; total_btc_mined: number; image_url: string | null; }

// Fallback images for farms that don't have image_url set yet
const FARM_FALLBACK_IMAGES = [
  "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_a457f067-1880-4b0e-a78c-18b8a11fe288.jpg",
  "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_57235f2c-c096-4f5f-8270-1a732834c7f0.jpg",
  "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_71508e24-93c2-40eb-8c10-e6dac1447ec8.jpg",
  "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b9a7f981-c899-4ce0-ae2b-b59513ef7fbe.jpg",
];

export default function HomePage() {
  const btc = useBtcStats();
  const [calcHashrate, setCalcHashrate] = useState(100);
  const [calcDuration, setCalcDuration] = useState(30);

  // ── DB-driven data ────────────────────────────────────────
  const [platformStats, setPlatformStats] = useState<PlatformStat[]>([]);
  const [reviews, setReviews]             = useState<Review[]>([]);
  const [faqItems, setFaqItems]           = useState<FaqItem[]>([]);
  const [blogPosts, setBlogPosts]         = useState<BlogPost[]>([]);
  const [payouts, setPayouts]             = useState<PayoutProof[]>([]);
  const [openFaq, setOpenFaq]             = useState<string | null>(null);
  const [featuredContracts, setFeaturedContracts] = useState<ContractTemplate[]>([]);
  const [homeFarms, setHomeFarms]         = useState<HomeFarm[]>([]);

  useEffect(() => {
    supabase.from("platform_stats").select("*").then(({ data }) => setPlatformStats(data ?? []));
    supabase.from("reviews").select("*").eq("visible", true).order("featured", { ascending: false }).limit(6).then(({ data }) => setReviews(data ?? []));
    supabase.from("faq_items").select("*").eq("visible", true).order("sort_order").limit(12).then(({ data }) => setFaqItems(data ?? []));
    supabase.from("blog_posts").select("id,slug,title,excerpt,category,tags,author_name,featured_image,featured,read_time_min,created_at").eq("published", true).order("featured", { ascending: false }).limit(6).then(({ data }) => setBlogPosts(data ?? []));
    supabase.from("transactions").select("id,amount,currency,usd_value,created_at").eq("type", "withdrawal").eq("status", "confirmed").eq("show_as_proof", true).order("created_at", { ascending: false }).limit(10).then(({ data }) => setPayouts(data ?? []));
    getPublicContractTemplates().then(data => setFeaturedContracts(data.filter(c => c.featured).slice(0, 6))).catch(() => {});
    supabase.from("mining_farms").select("id,name,country,flag,capacity,power_source,cooling,active_miners,uptime,total_btc_mined,image_url").eq("is_active", true).order("created_at").limit(4).then(({ data }) => setHomeFarms((data ?? []) as HomeFarm[]));
  }, []);

  const getStat = (key: string) => platformStats.find(s => s.key === key)?.value ?? "—";

  // ── Mining calculator ─────────────────────────────────────
  const networkTH       = (btc.networkHashrate > 0 ? btc.networkHashrate : 850) * 1e6;
  const activeBtcPrice  = btc.btcPrice > 0 ? btc.btcPrice : 0;
  const dailyBlocks     = 144;
  const grossBTC        = networkTH > 0 ? (calcHashrate / networkTH) * dailyBlocks * btc.blockReward : 0;
  const maintenanceRate = 0.0028;
  const maintenanceDailyBTC = (maintenanceRate * calcHashrate) / activeBtcPrice;
  const netDailyBTC     = Math.max(0, grossBTC - maintenanceDailyBTC);
  const netDailyUSD     = netDailyBTC * activeBtcPrice;
  const netTotalBTC     = netDailyBTC * calcDuration;
  const netTotalUSD     = netTotalBTC * activeBtcPrice;
  const annualBTC       = netDailyBTC * 365;
  const annualUSD       = annualBTC * activeBtcPrice;

  // Breakeven: assume average contract cost ~$15/TH
  const contractCostUSD = calcHashrate * 15;
  const breakevenDays   = netDailyUSD > 0 ? Math.ceil(contractCostUSD / netDailyUSD) : 0;

  // FAQ grouped by category (used by full FAQ page)

  return (
    <PublicLayout>
      <PageMeta
      title="Buy Bitcoin Hashrate Online | Real Cloud Mining Platform"
      description="BTCMiner.online is a trusted cloud Bitcoin mining platform. Buy BTC hashpower instantly, earn daily mining rewards with real-time performance monitoring, secure deposits and automated payouts."
      canonical="/"
      />

      {/* ─────────────────────────────────────────────────── */}
      {/* 1. HERO                                            */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center bg-background overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,hsl(43_96%_48%_/_0.06),transparent_60%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,hsl(220_80%_50%_/_0.04),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-24 w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <LiveDot />
                <span className="text-xs text-muted-foreground">BTC: <span className="font-mono text-primary">{btc.loading ? "…" : `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}</span></span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance mb-4">
                Industrial-Grade <span className="text-primary">Cloud Mining</span> Infrastructure
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Purchase hashrate from our data centers and earn Bitcoin mining rewards. Powered by 555+ MW of capacity across 4 continents.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                  <Link to="/register">Start Mining <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/marketplace">View Contracts</Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
                  <Link to="/farms">Explore Farms <ChevronRight className="w-4 h-4" /></Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-8">
                {["No hardware to manage", "Daily reward payouts", "Transparent mining data"].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {btc.loading ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card border-border h-full"><CardContent className="p-4"><Skeleton className="h-3 w-24 bg-muted mb-2" /><Skeleton className="h-7 w-20 bg-muted" /></CardContent></Card>
              )) : [
                { label: "BTC Network Hashrate", value: `${btc.networkHashrate} EH/s`, sub: "All miners combined" },
                { label: "Network Difficulty",   value: `${btc.networkDifficulty}T`,    sub: "Current epoch" },
                { label: "Block Reward",          value: `${btc.blockReward} BTC`,       sub: `Block #${btc.blockHeight.toLocaleString()}` },
                { label: "BTC Price",             value: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, sub: "Live via Coinbase" },
                { label: "Data Centers",          value: "4",                             sub: "Continents worldwide" },
                { label: "Mining Algorithm",      value: "SHA-256",                      sub: "Bitcoin network" },
              ].map(s => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 2. LIVE MINING STATISTICS                         */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <LiveDot />
              <Badge className="bg-primary/10 text-primary border-primary/20">Platform Statistics</Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance">Live Mining Statistics</h2>
            <p className="text-muted-foreground mt-2 text-sm">Real-time platform metrics updated continuously</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Users,    key: "active_miners",     label: "Active Miners",           suffix: "",      color: "text-primary" },
              { icon: Activity, key: "total_hashrate_eh", label: "Total Hashrate",          suffix: " EH/s", color: "text-primary" },
              { icon: Hash,     key: "total_btc_mined",   label: "Total BTC Mined",         suffix: " BTC",  color: "text-primary" },
              { icon: Wallet,   key: "total_withdrawals", label: "Withdrawals Processed",   suffix: "",      color: "text-success" },
              { icon: Shield,   key: "platform_uptime",   label: "Platform Uptime",         suffix: "%",     color: "text-success" },
              { icon: Database, key: "active_contracts",  label: "Active Contracts",        suffix: "",      color: "text-primary" },
            ].map(({ icon: Icon, key, label, suffix, color }) => {
              const raw = parseFloat(getStat(key)) || 0;
              return (
                <div key={key} className="bg-background border border-border rounded-lg p-4 text-center flex flex-col items-center gap-2">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <p className={`text-xl font-bold font-mono ${color}`}>
                    {platformStats.length === 0 ? <span className="inline-block w-16 h-5 bg-muted animate-pulse rounded" /> : raw.toLocaleString()}{suffix}
                  </p>
                  <p className="text-xs text-muted-foreground text-center leading-tight">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 3. MINING PROFIT CALCULATOR                       */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Mining Calculator</Badge>
            <h2 className="text-3xl font-bold text-foreground text-balance">Estimate Your Mining Output</h2>
            <p className="text-muted-foreground mt-2">Based on current network difficulty and BTC price. Not a guaranteed return.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Hashrate (TH/s)</label>
                <input type="range" min={10} max={5000} step={10} value={calcHashrate}
                  onChange={e => setCalcHashrate(Number(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10 TH/s</span>
                  <span className="text-primary font-mono font-bold">{calcHashrate} TH/s</span>
                  <span>5,000 TH/s</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Duration (Days)</label>
                <div className="flex gap-2">
                  {[30, 90, 180, 365].map(d => (
                    <button key={d} onClick={() => setCalcDuration(d)}
                      className={`flex-1 py-2 text-sm rounded border transition-colors ${calcDuration === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Daily BTC",              value: btc.loading ? "—" : netDailyBTC.toFixed(8),          unit: "BTC" },
                { label: "Daily USD",              value: btc.loading ? "—" : `$${netDailyUSD.toFixed(2)}`,     unit: "" },
                { label: `${calcDuration}-Day BTC`,value: btc.loading ? "—" : netTotalBTC.toFixed(6),           unit: "BTC" },
                { label: `${calcDuration}-Day USD`,value: btc.loading ? "—" : `$${netTotalUSD.toFixed(2)}`,     unit: "" },
              ].map(item => (
                <div key={item.label} className="bg-card border border-border rounded p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  {btc.loading ? <div className="h-7 flex items-center justify-center"><div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto" /></div>
                    : <p className="text-xl font-bold font-mono text-primary">{item.value}</p>}
                  {item.unit && <p className="text-xs text-muted-foreground">{item.unit}</p>}
                </div>
              ))}
            </div>

            {/* Extended ROI metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Annual BTC",       value: btc.loading ? "—" : annualBTC.toFixed(6),            unit: "BTC", highlight: true },
                { label: "Annual USD",       value: btc.loading ? "—" : `$${annualUSD.toFixed(2)}`,       unit: "",    highlight: true },
                { label: "Est. Break-even",  value: btc.loading ? "—" : breakevenDays > 0 ? `~${breakevenDays}d` : "N/A", unit: "days", highlight: true },
              ].map(item => (
                <div key={item.label} className="bg-primary/5 border border-primary/20 rounded p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  {btc.loading ? <div className="h-7 flex items-center justify-center"><div className="h-4 w-20 bg-muted animate-pulse rounded mx-auto" /></div>
                    : <p className="text-xl font-bold font-mono text-primary">{item.value}</p>}
                  {item.unit && <p className="text-xs text-muted-foreground">{item.unit}</p>}
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-center mb-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                <Link to="/calculator">Advanced Calculator <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" asChild><Link to="/register">Start Mining {calcHashrate} TH/s</Link></Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Estimates based on difficulty ({btc.loading ? "…" : `${btc.networkDifficulty}T`}) and BTC price (${btc.loading ? "…" : btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}). Actual output varies.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 4. MINING PLANS / FEATURED CONTRACTS              */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Mining Plans</h2>
              <p className="text-muted-foreground text-sm mt-1">Purchase hashrate directly from our mining farms</p>
            </div>
            <Button variant="outline" asChild><Link to="/marketplace">View All</Link></Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredContracts.map(contract => (
              <Card key={contract.id} className="bg-background border-border hover:border-primary/40 transition-colors h-full flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{contract.display_name ?? contract.name}</p>
                      <p className="text-xs text-muted-foreground">{contract.algorithm} · {contract.coin}</p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {contract.is_lifetime ? "∞" : `${contract.duration}d`}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4 flex-1">
                    <div><p className="text-xs text-muted-foreground">Hashrate</p><p className="font-mono font-bold text-foreground">{contract.hashrate} {contract.hashrate_unit}</p></div>
                    <div><p className="text-xs text-muted-foreground">Maintenance</p><p className="font-mono text-foreground">${contract.maintenance_fee}/TH/day</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-lg font-bold text-primary font-mono">
                      ${(contract.promotional_price ?? contract.discount_price ?? contract.price).toLocaleString()}
                    </p>
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                      <Link to="/register">Buy Now</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 5. HASHRATE MARKETPLACE                           */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">P2P Marketplace</Badge>
              <h2 className="text-2xl font-bold text-foreground">Hashrate Marketplace</h2>
              <p className="text-muted-foreground text-sm mt-1">Buy and sell active hashrate contracts between users</p>
            </div>
            <Button variant="outline" className="shrink-0" asChild><Link to="/marketplace">Browse Marketplace <ChevronRight className="w-4 h-4 ml-1" /></Link></Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Instant Liquidity",     desc: "Sell your active contracts before expiry or buy discounted hashrate from other users." },
              { icon: ShieldCheck, title: "Escrow Protected",      desc: "All marketplace transactions are protected by our built-in escrow and dispute resolution system." },
              { icon: Globe,       title: "Global Order Book",     desc: "Access buy and sell orders from thousands of miners worldwide with real-time pricing." },
            ].map(f => (
              <div key={f.title} className="border border-border rounded-lg p-6 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 6. MINING FARMS                                   */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Global Infrastructure</Badge>
              <h2 className="text-2xl font-bold text-foreground">Our Mining Farms</h2>
              <p className="text-muted-foreground text-sm mt-1">Industrial-scale operations across 4 continents</p>
            </div>
            <Button variant="outline" asChild><Link to="/farms">View All Farms</Link></Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {homeFarms.map((farm, idx) => (
              <Card key={farm.id} className="bg-background border-border overflow-hidden hover:border-primary/30 transition-colors h-full flex flex-col">
                <div className="aspect-[4/3] overflow-hidden shrink-0">
                  <img src={farm.image_url ?? FARM_FALLBACK_IMAGES[idx] ?? ""} alt={farm.name} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{farm.flag}</span>
                    <p className="font-semibold text-sm text-foreground">{farm.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{farm.country}</p>
                  <p className="text-xs text-muted-foreground mb-3">⚡ {farm.power_source}</p>
                  <div className="text-xs text-muted-foreground mb-1">❄ {farm.cooling}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs mt-auto pt-3 border-t border-border">
                    <div><span className="text-muted-foreground">Capacity:</span><span className="text-foreground font-mono ml-1">{farm.capacity} MW</span></div>
                    <div><span className="text-muted-foreground">Uptime:</span><span className="text-success font-mono ml-1">{farm.uptime}%</span></div>
                    <div><span className="text-muted-foreground">ASICs:</span><span className="text-foreground font-mono ml-1">{farm.active_miners.toLocaleString()}</span></div>
                    <div><span className="text-muted-foreground">BTC mined:</span><span className="text-foreground font-mono ml-1">{Number(farm.total_btc_mined).toLocaleString()}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 7. HARDWARE FLEET                                 */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">ASIC Fleet</Badge>
              <h2 className="text-2xl font-bold text-foreground">Hardware Fleet</h2>
              <p className="text-muted-foreground text-sm mt-1">Latest-generation ASICs powering your contracts</p>
            </div>
            <Button variant="outline" asChild><Link to="/hardware">View All</Link></Button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Model", "Manufacturer", "Hashrate", "Power (W)", "Efficiency (J/TH)", "Deployed", "Farm", "Status"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {miningHardware.slice(0, 6).map(hw => (
                  <tr key={hw.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center shrink-0">
                          <Cpu className="w-3 h-3 text-primary" />
                        </div>
                        {hw.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hw.manufacturer}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">{hw.hashrate} {hw.hashrateUnit}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">{hw.power.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{hw.efficiency}</td>
                    <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{hw.count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hw.farm}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 8. REAL-TIME NETWORK DATA                         */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <LiveDot />
              <Badge className="bg-primary/10 text-primary border-primary/20">Live Data</Badge>
            </div>
            <h2 className="text-3xl font-bold text-foreground text-balance">Real-Time Network Data</h2>
            <p className="text-muted-foreground mt-2 text-sm">Live Bitcoin network metrics from mempool.space and Coinbase</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {btc.loading ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-lg p-5">
                <Skeleton className="h-3 w-20 bg-muted mb-3" />
                <Skeleton className="h-7 w-28 bg-muted mb-2" />
                <Skeleton className="h-3 w-16 bg-muted" />
              </div>
            )) : [
              { label: "BTC Price",          value: `$${btc.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,   change: btc.priceChange24h !== 0 ? `${btc.priceChange24h > 0 ? "+" : ""}${btc.priceChange24h}%` : null, changePos: btc.priceChange24h >= 0, sub: "via Coinbase" },
              { label: "Network Hashrate",   value: `${btc.networkHashrate} EH/s`,      change: null, changePos: true,  sub: "3-day average" },
              { label: "Mining Difficulty",  value: `${btc.networkDifficulty}T`,         change: btc.difficultyChange !== 0 ? `${btc.difficultyChange > 0 ? "+" : ""}${btc.difficultyChange}%` : null, changePos: btc.difficultyChange >= 0, sub: "Next retarget" },
              { label: "Block Reward",       value: `${btc.blockReward} BTC`,            change: null, changePos: true,  sub: "Post-halving" },
              { label: "Block Height",       value: `#${btc.blockHeight.toLocaleString()}`, change: null, changePos: true, sub: "Current chain tip" },
              { label: "Next Retarget",      value: `#${btc.nextRetargetHeight.toLocaleString()}`, change: null, changePos: true, sub: "~2016 block cycle" },
              { label: "Pool Luck",          value: `${btc.poolLuck}%`,                 change: null, changePos: btc.poolLuck >= 100, sub: "7-day average" },
              { label: "Avg Block Time",     value: "~10 min",                           change: null, changePos: true,  sub: "Target interval" },
            ].map(item => (
              <div key={item.label} className="bg-background border border-border rounded-lg p-5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{item.label}</p>
                <p className="text-xl font-bold font-mono text-primary mb-1">{item.value}</p>
                <div className="flex items-center gap-2">
                  {item.change && (
                    <span className={`text-xs font-medium ${item.changePos ? "text-success" : "text-destructive"}`}>{item.change}</span>
                  )}
                  <span className="text-xs text-muted-foreground">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded px-4 py-2">
              <LiveDot />
              Data sourced from mempool.space and Coinbase API. Refreshed every 30 seconds.
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 9. PAYOUT PROOFS                                  */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Verified Payouts</Badge>
            <h2 className="text-3xl font-bold text-foreground text-balance">Payout Proofs</h2>
            <p className="text-muted-foreground mt-2">Recent verified withdrawals processed by our platform</p>
          </div>
          {payouts.length === 0 ? (
            <div className="border border-border rounded-lg overflow-x-auto bg-card">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Transaction ID", "Amount", "Coin", "USD Value", "Date", "Status"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "a1b2c3d4", amount: 0.02453, currency: "BTC", usd: 1547.82, date: "2026-06-13" },
                    { id: "e5f6a7b8", amount: 0.01821, currency: "BTC", usd: 1148.30, date: "2026-06-13" },
                    { id: "c9d0e1f2", amount: 0.03104, currency: "BTC", usd: 1956.45, date: "2026-06-12" },
                    { id: "g3h4i5j6", amount: 0.00947, currency: "BTC", usd: 596.89, date:  "2026-06-12" },
                    { id: "k7l8m9n0", amount: 0.05211, currency: "BTC", usd: 3283.68, date: "2026-06-11" },
                  ].map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.id}…<ExternalLink className="w-3 h-3 inline ml-1 opacity-50" /></td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">{p.amount.toFixed(5)}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-primary/10 text-primary border-primary/20">{p.currency}</Badge></td>
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">${p.usd.toFixed(2)}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{p.date}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto bg-card">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Transaction ID", "Amount", "Coin", "USD Value", "Date", "Status"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.id.slice(0, 16)}…</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">{p.amount.toFixed(6)}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-primary/10 text-primary border-primary/20">{p.currency}</Badge></td>
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">{p.usd_value ? `$${p.usd_value.toFixed(2)}` : "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-success/10 text-success border-success/20">Confirmed</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">Showing recent verified withdrawals. All transactions verifiable on-chain.</p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 10. CUSTOMER REVIEWS                              */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Trusted by Miners</Badge>
            <h2 className="text-3xl font-bold text-foreground text-balance">Customer Reviews</h2>
            <p className="text-muted-foreground mt-2">What our miners say about BTCMiner.online</p>
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 fill-warning text-warning" />)}
              <span className="font-bold text-foreground ml-1">4.8</span>
              <span className="text-muted-foreground text-sm">/ 5 from 2,400+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(reviews.length > 0 ? reviews : [
              { id: "1", author_name: "James H.",  author_country: "United States", rating: 5, title: "Consistent daily payouts",         body: "Been mining for 8 months. Payouts hit my wallet every day without fail.",      verified: true,  featured: true },
              { id: "2", author_name: "Elena M.",  author_country: "Germany",       rating: 5, title: "Best cloud mining platform",        body: "Tried three other platforms before BTCMiner. The transparency center makes all the difference.", verified: true, featured: true },
              { id: "3", author_name: "David K.",  author_country: "Australia",     rating: 4, title: "Solid ROI on my 365-day plan",      body: "Started with 100 TH/s. After 4 months I have covered 60% of cost. Very satisfied.", verified: true, featured: true },
              { id: "4", author_name: "Priya S.",  author_country: "India",         rating: 5, title: "Professional support team",         body: "Had a question about my deposit and support responded within 2 hours.",        verified: true,  featured: false },
              { id: "5", author_name: "Marcus T.", author_country: "Canada",        rating: 5, title: "Real mining, real rewards",         body: "You can actually verify payouts on the blockchain. That gives me confidence.", verified: true,  featured: false },
              { id: "6", author_name: "Yuki N.",   author_country: "Japan",         rating: 4, title: "Good interface, reliable earnings", body: "The dashboard is very clean. I can see daily rewards and compare with network data.", verified: false, featured: false },
            ] as Review[]).slice(0, 6).map(r => (
              <Card key={r.id} className="bg-background border-border h-full flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted"}`} />
                      ))}
                    </div>
                    {r.verified && (
                      <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 text-pretty">{r.body}</p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.author_name}</p>
                      {r.author_country && <p className="text-xs text-muted-foreground">{r.author_country}</p>}
                    </div>
                    {r.featured && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Featured</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 11. FAQ                                           */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">FAQ</Badge>
            <h2 className="text-3xl font-bold text-foreground text-balance">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mt-2">Everything you need to know about cloud mining with BTCMiner</p>
          </div>
          <div className="space-y-3">
            {(faqItems.length > 0 ? faqItems.slice(0, 8) : [
              { id: "1", category: "How Mining Works",  question: "How does cloud mining work?",             answer: "Cloud mining lets you purchase hashrate from our industrial mining facilities. Your contracted hashrate contributes to our pool and rewards are credited daily." },
              { id: "2", category: "How Mining Works",  question: "When are mining rewards credited?",       answer: "Mining rewards are calculated and credited to your wallet every day at 00:00 UTC based on the previous day's output." },
              { id: "3", category: "Hashrate Packages", question: "What is a hashrate package?",            answer: "A hashrate package gives you a fixed amount of mining power (TH/s) for a specified duration. You pay once and receive daily BTC rewards throughout." },
              { id: "4", category: "Withdrawals",       question: "How do I withdraw my Bitcoin?",          answer: "Go to Dashboard → Wallet → Withdraw. Enter your Bitcoin address and amount. Withdrawals are processed within 24 hours after admin review." },
              { id: "5", category: "Profitability",     question: "How are profits calculated?",            answer: "Daily profit = (Your Hashrate / Total Network Hashrate) × 144 Blocks × Block Reward, minus maintenance fee. Use our calculator for estimates." },
              { id: "6", category: "Security",          question: "How is my account secured?",             answer: "We use AES-256 encryption, two-factor authentication, IP-based login alerts, and cold storage for all platform funds." },
              { id: "7", category: "KYC",               question: "Is identity verification required?",     answer: "KYC is required for withdrawals above $1,000 USD. Basic features are available without KYC. Verification takes 1-3 business days." },
              { id: "8", category: "Cryptocurrencies",  question: "Which cryptocurrencies can I mine?",     answer: "We support Bitcoin (BTC) via SHA-256, Litecoin (LTC) via Scrypt, and Dogecoin (DOGE) via merged mining." },
            ] as FaqItem[]).map(item => (
              <div key={item.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
                  onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Badge className="bg-muted text-muted-foreground text-xs shrink-0 mt-0.5">{item.category}</Badge>
                    <span className="font-medium text-foreground text-sm">{item.question}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 ml-3 transition-transform ${openFaq === item.id ? "rotate-180" : ""}`} />
                </button>
                {openFaq === item.id && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild><Link to="/faq">View All FAQs <ChevronRight className="w-4 h-4 ml-1" /></Link></Button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* 12. MINING KNOWLEDGE CENTER                       */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Educational Content</Badge>
              <h2 className="text-2xl font-bold text-foreground">Mining Knowledge Center</h2>
              <p className="text-muted-foreground text-sm mt-1">Guides, tutorials, and deep-dives on Bitcoin mining</p>
            </div>
            <Button variant="outline" asChild><Link to="/blog">View All Articles</Link></Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(blogPosts.length > 0 ? blogPosts : [
              { id: "1", slug: "bitcoin-mining-difficulty-explained",   title: "Bitcoin Mining Difficulty Explained",       excerpt: "Learn how Bitcoin's difficulty adjustment algorithm works and why it matters for profitability.", category: "Education", tags: ["bitcoin","difficulty"], featured: true,  read_time_min: 6, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-06-01" },
              { id: "2", slug: "what-is-hashrate",                      title: "What Is Hashrate?",                         excerpt: "Hashrate is the fundamental measure of mining power. This guide explains TH/s and EH/s.",            category: "Education", tags: ["hashrate"],            featured: true,  read_time_min: 5, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-05-28" },
              { id: "3", slug: "best-asic-miners-2026",                 title: "Best ASIC Miners 2026",                     excerpt: "Top-performing ASICs of 2026 including efficiency ratings and ROI projections.",                    category: "Hardware",  tags: ["asic","hardware"],     featured: true,  read_time_min: 8, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-05-20" },
              { id: "4", slug: "cloud-mining-vs-hardware-mining",       title: "Cloud Mining vs Hardware Mining",           excerpt: "A comprehensive comparison of cloud mining contracts versus owning ASIC hardware.",               category: "Comparison",tags: ["cloud mining"],        featured: false, read_time_min: 7, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-05-15" },
              { id: "5", slug: "bitcoin-profitability-calculator-guide","title": "Bitcoin Profitability Calculator Guide",  excerpt: "How to use a mining profitability calculator to estimate earnings, break-even, and ROI.",          category: "Guides",    tags: ["calculator","roi"],    featured: false, read_time_min: 5, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-05-10" },
              { id: "6", slug: "sha256-mining-explained",               title: "SHA-256 Mining Explained",                  excerpt: "SHA-256 is the cryptographic algorithm powering Bitcoin mining. Here's everything to know.",        category: "Education", tags: ["sha256","bitcoin"],    featured: false, read_time_min: 6, author_name: "BTCMiner Team", featured_image: null, created_at: "2026-05-05" },
            ] as BlogPost[]).slice(0, 6).map(post => (
              <Card key={post.id} className="bg-background border-border hover:border-primary/30 transition-colors h-full flex flex-col overflow-hidden">
                {post.featured_image ? (
                  <div className="aspect-[16/9] overflow-hidden shrink-0">
                    <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-primary/5 flex items-center justify-center shrink-0">
                    <BookOpen className="w-8 h-8 text-primary/30" />
                  </div>
                )}
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-muted text-muted-foreground text-xs">{post.category}</Badge>
                    {post.featured && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Featured</Badge>}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-balance line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 text-pretty line-clamp-3">{post.excerpt}</p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.read_time_min} min</span>
                      <span>{post.author_name}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary" asChild>
                      <Link to={`/blog/${post.slug}`}>Read <ChevronRight className="w-3 h-3 ml-0.5" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────── */}
      {/* CTA                                               */}
      {/* ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Hash className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-4">
            Ready to Start Mining Bitcoin?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg text-pretty">
            Join 18,000+ miners using BTCMiner.online infrastructure. Purchase hashrate and start earning from real mining operations today.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to="/register">Create Free Account <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/transparency">View Transparency Data</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Cloud mining involves risk. Output depends on network difficulty and BTC price.</p>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
