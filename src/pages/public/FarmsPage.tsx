import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import { supabase } from "@/db/supabase";
import { useBtcStats } from "@/hooks/useBtcStats";
import PageMeta from "@/components/common/PageMeta";

import {
  MapPin, Zap, Thermometer, Server, CheckCircle, Shield, Lock,
  Activity, Wind, Droplets, Leaf, Users, Star, ChevronRight,
  TrendingUp, BarChart3, ShoppingBag, HardDrive, Cpu, Globe,
  AlertTriangle, Flame,
} from "lucide-react";

interface MiningFarm {
  id: string;
  name: string;
  country: string;
  flag: string;
  capacity: number;
  capacity_unit: string;
  power_source: string;
  cooling: string;
  active_miners: number;
  online_miners: number;
  uptime: number;
  total_btc_mined: number;
  latitude: number;
  longitude: number;
  image_url: string | null;
  is_active: boolean;
}

// ── Farm image map ────────────────────────────────────────────────────────────
const FARM_IMAGES: Record<string, string> = {
  f1: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_cdf089b4-33b2-4d62-ab8b-26a9bddca817.jpg",
  f2: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b99d7d63-40c9-4086-bfc6-4e6f267571ce.jpg",
  f3: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_45c08974-d3ce-4f9e-af99-462a40cca272.jpg",
  f4: "https://miaoda-site-img.s3cdn.medo.dev/images/KLing_425aab06-6c16-4198-92b8-92c6bfba98a4.jpg",
};

// ── Extra facility metadata ───────────────────────────────────────────────────
const FARM_META: Record<string, { operationalSince: string; temperature: string; securityLevel: string; hashrate: string }> = {
  f1: { operationalSince: "2019", temperature: "2–8°C", securityLevel: "Tier III+", hashrate: "8.1 EH/s" },
  f2: { operationalSince: "2020", temperature: "18–26°C", securityLevel: "Tier IV", hashrate: "12.4 EH/s" },
  f3: { operationalSince: "2021", temperature: "10–20°C", securityLevel: "Tier III", hashrate: "3.2 EH/s" },
  f4: { operationalSince: "2022", temperature: "4–12°C", securityLevel: "Tier III+", hashrate: "1.8 EH/s" },
};

// ── Infrastructure metrics ────────────────────────────────────────────────────
const INFRA_METRICS = [
  { label: "Total Power Capacity", value: 555, suffix: " MW",   prefix: "", decimals: 0 },
  { label: "Total Hashrate",        value: 25,  suffix: "+ EH/s",prefix: "", decimals: 0 },
  { label: "Active ASIC Miners",    value: 21630, suffix: "",   prefix: "", decimals: 0 },
  { label: "Average Uptime",        value: 99.3, suffix: "%",   prefix: "", decimals: 1 },
  { label: "BTC Mined",             value: 46514, suffix: " BTC",prefix: "", decimals: 0 },
];

// ── Comparison rows ───────────────────────────────────────────────────────────
const COMPARISON = [
  { feature: "Renewable Energy",    btcminer: true,  typical: "Partial" },
  { feature: "Live Monitoring",     btcminer: true,  typical: "Limited" },
  { feature: "Farm Transparency",   btcminer: true,  typical: "Rare" },
  { feature: "Real-time Stats",     btcminer: true,  typical: "No" },
  { feature: "Automatic Payouts",   btcminer: true,  typical: "Varies" },
  { feature: "Multiple Locations",  btcminer: true,  typical: "Limited" },
];

// ── Security features ─────────────────────────────────────────────────────────
const SECURITY = [
  { icon: Activity, title: "24/7 Monitoring",         desc: "Round-the-clock NOC with automated alerting and incident response." },
  { icon: Shield,   title: "Physical Security",        desc: "Biometric access control, CCTV, perimeter fencing, and on-site guards." },
  { icon: Globe,    title: "Network Protection",       desc: "Isolated OT networks, VPN-only remote access, and hardware firewalls." },
  { icon: Zap,      title: "DDoS Protection",          desc: "Multi-layer volumetric and application DDoS mitigation via Cloudflare." },
  { icon: Lock,     title: "Cold Wallet Reserves",     desc: "95%+ of platform BTC held in multi-party air-gapped cold storage." },
  { icon: HardDrive,title: "Multi-Signature Controls", desc: "4-of-7 multisig required for all hot-wallet transactions above threshold." },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Alex M.", country: "🇩🇪 Germany",  rating: 5, text: "The uptime on my contracts has been rock solid for 8 months. Daily payouts hit like clockwork. Transparency Center gives me peace of mind." },
  { name: "Sarah K.", country: "🇬🇧 UK",      rating: 5, text: "I compared several cloud mining platforms. BTCMiner is the only one that publishes verifiable pool data and on-chain payouts. That's what won me over." },
  { name: "David R.", country: "🇺🇸 USA",     rating: 5, text: "The profitability calculator is honest — it shows estimates with difficulty risk. Started with Starter plan, upgraded to Enterprise. Solid operation." },
];

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, decimals = 0) {
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

function MetricCounter({ m }: { m: typeof INFRA_METRICS[0] }) {
  const { count, ref } = useCountUp(m.value, 2200, m.decimals);
  return (
    <div ref={ref} className="text-center p-4">
      <p className="text-2xl md:text-3xl font-bold font-mono text-primary tabular-nums">
        {m.prefix}{count.toLocaleString("en-US", { minimumFractionDigits: m.decimals, maximumFractionDigits: m.decimals })}{m.suffix}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
    </div>
  );
}

// ── Interactive World Map ─────────────────────────────────────────────────────
function lonLatToPercent(lon: number, lat: number) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

export default function FarmsPage() {
  const btc = useBtcStats();
  const [activePin, setActivePin] = useState<string | null>(null);
  const [miningFarms, setMiningFarms] = useState<MiningFarm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("mining_farms")
      .select("*")
      .eq("is_active", true)
      .order("created_at")
      .then(({ data }) => {
        setMiningFarms((data ?? []) as MiningFarm[]);
        setFarmsLoading(false);
      });
  }, []);

  const totalBtcMined = miningFarms.reduce((s, f) => s + (Number(f.total_btc_mined) || 0), 0);
  const totalMiners   = miningFarms.reduce((s, f) => s + (Number(f.active_miners) || 0), 0);

  // Estimate daily production from live data
  const networkTH = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 1;
  const totalTH   = 25000; // 25 EH/s → TH/s
  const dailyBtc  = (totalTH / networkTH) * 144 * btc.blockReward;

  // Structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",                              "item": "https://btcminer.online/" },
      { "@type": "ListItem", "position": 2, "name": "Global Bitcoin Mining Infrastructure", "item": "https://btcminer.online/farms" },
    ],
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BTCMiner.online",
    "url": "https://btcminer.online",
    "description": "Enterprise-grade Bitcoin mining operations across Iceland, Texas, Kazakhstan, and Norway.",
    "hasOfferCatalog": { "@type": "OfferCatalog", "name": "Bitcoin Mining Contracts" },
  };

  const localBusinessSchemas = miningFarms.map(f => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": f.name,
    "address": { "@type": "PostalAddress", "addressCountry": f.country },
    "geo": { "@type": "GeoCoordinates", "latitude": f.latitude, "longitude": f.longitude },
    "description": `${f.capacity} MW SHA-256 Bitcoin mining facility powered by ${f.power_source}`,
  }));

  return (
    <>
      <PageMeta
      title="Our Bitcoin Mining Farms | Real ASIC Hardware | BTCMiner.online"
      description="Explore BTCMiner.online real Bitcoin mining farms. Our ASIC infrastructure spans multiple continents, delivering 99.9% uptime and maximum hashrate efficiency."
      canonical="/farms"
      />
      <PublicLayout>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      {localBusinessSchemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* ── Floating Stats Bar ──────────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground py-2 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 md:gap-12 whitespace-nowrap text-xs font-medium">
          <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" />21,370 miners online now</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />555 MW active capacity</span>
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />99.3% infrastructure uptime</span>
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Mining Infrastructure</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Mining Farms</Badge>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 text-balance">
                Global Bitcoin Mining Infrastructure
              </h1>
              <p className="text-muted-foreground max-w-2xl text-pretty">
                Enterprise-grade Bitcoin mining operations distributed across multiple energy-efficient facilities worldwide. Our mining farms utilize renewable energy, industrial cooling systems, and real-time monitoring to deliver reliable SHA-256 mining performance.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/pricing"><Server className="w-4 h-4" />View Contracts</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Animated Metrics ─────────────────────────────────────────────────── */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
            {INFRA_METRICS.map(m => <MetricCounter key={m.label} m={m} />)}
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Updated every 5 minutes · Daily production est: {btc.loading ? "…" : `${dailyBtc.toFixed(2)} BTC`} (live)
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">

        {/* ── Interactive Global Map ────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Global Mining Locations</h2>
          <p className="text-sm text-muted-foreground mb-5">Click any location pin to view facility details.</p>

          <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/40" style={{ aspectRatio: "16/7" }}>
            {/* World map SVG */}
            <svg viewBox="0 0 1000 438" className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              {/* Grid lines */}
              {[...Array(10)].map((_, i) => (
                <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="438" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              ))}
              {[...Array(6)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 73} x2="1000" y2={i * 73} stroke="currentColor" strokeWidth="0.5" className="text-border" />
              ))}
              {/* Equator */}
              <line x1="0" y1="219" x2="1000" y2="219" stroke="currentColor" strokeWidth="1" className="text-primary" strokeDasharray="4 4" />
              {/* Simplified continental outlines */}
              {/* North America */}
              <path d="M170,60 L220,55 L260,70 L280,100 L270,130 L290,140 L310,170 L300,200 L280,220 L260,240 L240,250 L220,230 L200,210 L190,190 L160,170 L140,140 L130,110 L150,80 Z" fill="currentColor" className="text-muted-foreground/30" />
              {/* South America */}
              <path d="M240,260 L280,250 L300,270 L310,300 L305,330 L295,360 L275,380 L255,370 L240,350 L230,320 L225,290 Z" fill="currentColor" className="text-muted-foreground/30" />
              {/* Europe */}
              <path d="M460,60 L510,55 L540,65 L550,85 L530,100 L510,110 L490,105 L470,95 L455,80 Z" fill="currentColor" className="text-muted-foreground/30" />
              {/* Africa */}
              <path d="M470,130 L520,120 L550,130 L560,160 L555,200 L545,240 L525,270 L500,280 L475,265 L460,230 L455,190 L460,160 Z" fill="currentColor" className="text-muted-foreground/30" />
              {/* Asia */}
              <path d="M555,50 L700,45 L800,60 L820,90 L800,120 L770,140 L740,150 L700,145 L670,130 L640,115 L610,110 L580,100 L560,85 Z" fill="currentColor" className="text-muted-foreground/30" />
              {/* Australia */}
              <path d="M720,260 L780,255 L810,270 L820,300 L800,320 L760,325 L730,310 L715,290 Z" fill="currentColor" className="text-muted-foreground/30" />
            </svg>

            {/* Location pins */}
            {miningFarms.map(farm => {
              const pos = lonLatToPercent(farm.longitude, farm.latitude);
              const isActive = activePin === farm.id;
              return (
                <button
                  key={farm.id}
                  onClick={() => setActivePin(isActive ? null : farm.id)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                >
                  <div className={`relative flex items-center justify-center transition-all duration-200 ${isActive ? "scale-125" : "hover:scale-110"}`}>
                    <span className="absolute w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                    <span className="relative w-5 h-5 rounded-full bg-primary border-2 border-primary-foreground shadow-lg flex items-center justify-center">
                      <MapPin className="w-2.5 h-2.5 text-primary-foreground" />
                    </span>
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-foreground whitespace-nowrap bg-card/90 px-1 rounded">{farm.flag}</span>
                </button>
              );
            })}

            {/* Label overlay */}
            <div className="absolute bottom-3 left-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" />4 Active Facilities · Tap pin for details
            </div>
          </div>

          {/* Pin detail panel */}
          {activePin && (() => {
            const farm = miningFarms.find(f => f.id === activePin)!;
            const meta = FARM_META[farm.id] ?? { hashrate: "—", temperature: "—", securityLevel: "—", operationalSince: "—" };
            return (
              <div className="mt-4 border border-primary/30 bg-primary/5 rounded-lg p-4 flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-3xl">{farm.flag}</span>
                  <div>
                    <p className="font-bold text-foreground">{farm.name}</p>
                    <Badge className="bg-success/10 text-success border-success/20 text-[10px] mt-0.5">Online · {farm.uptime}% Uptime</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 text-xs">
                  {[
                    { l: "Capacity",      v: `${farm.capacity} MW` },
                    { l: "Hashrate",      v: meta.hashrate },
                    { l: "Active Miners", v: farm.active_miners.toLocaleString() },
                    { l: "BTC Mined",     v: `${Number(farm.total_btc_mined).toLocaleString()} BTC` },
                    { l: "Energy Source", v: farm.power_source },
                    { l: "Cooling",       v: farm.cooling },
                    { l: "Temperature",   v: meta.temperature },
                    { l: "Security Level",v: meta.securityLevel },
                  ].map(item => (
                    <div key={item.l} className="bg-card rounded px-2.5 py-2 border border-border">
                      <p className="text-muted-foreground mb-0.5">{item.l}</p>
                      <p className="font-semibold text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Premium Facility Cards ────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Mining Facility Profiles</h2>
          <p className="text-sm text-muted-foreground mb-6">Industrial-scale SHA-256 mining operations powering {totalMiners.toLocaleString()} ASIC miners worldwide.</p>

          <div className="grid md:grid-cols-2 gap-6">
            {farmsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full bg-muted rounded-lg" />)
            ) : miningFarms.map(farm => {
              const meta = FARM_META[farm.id] ?? { hashrate: "—", temperature: "—", securityLevel: "—", operationalSince: "—" };
              const offline = farm.active_miners - farm.online_miners;
              const uptimePct = farm.active_miners > 0 ? (farm.online_miners / farm.active_miners) * 100 : 100;
              return (
                <Card key={farm.id} className="bg-card border-border overflow-hidden h-full flex flex-col">
                  {/* Photo */}
                  <div className="aspect-[16/7] overflow-hidden relative">
                    <img
                      src={farm.image_url ?? FARM_IMAGES[farm.id] ?? ""}
                      alt={`${farm.name} Bitcoin mining facility`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{farm.flag}</span>
                        <div>
                          <h3 className="font-bold text-white text-sm md:text-base text-balance">{farm.name}</h3>
                          <p className="text-white/70 text-xs flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{farm.country}</p>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground text-[10px] shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-success-foreground mr-1 inline-block" />Online
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[
                        { icon: Zap,         label: "Power Source",     value: farm.power_source },
                        { icon: Thermometer, label: "Cooling",           value: farm.cooling },
                        { icon: Server,      label: "Capacity",          value: `${farm.capacity} MW` },
                        { icon: Cpu,         label: "Hashrate",          value: meta.hashrate },
                        { icon: Activity,    label: "Uptime",            value: `${farm.uptime}%` },
                        { icon: Thermometer, label: "Temperature",       value: meta.temperature },
                        { icon: Shield,      label: "Security",          value: meta.securityLevel },
                        { icon: BarChart3,   label: "Operational Since", value: meta.operationalSince },
                      ].map(s => (
                        <div key={s.label} className="flex items-start gap-2 bg-muted/30 rounded p-2">
                          <s.icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            <p className="text-xs font-semibold text-foreground truncate">{s.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 mt-auto">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Hardware Uptime</span>
                        <span className="font-mono text-success">{uptimePct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                        <div className="bg-success h-1.5 rounded-full" style={{ width: `${uptimePct}%` }} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-mono font-bold text-foreground">{farm.active_miners.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Online</p>
                          <p className="font-mono font-bold text-success">{farm.online_miners.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">BTC Mined</p>
                          <p className="font-mono font-bold text-primary">{Number(farm.total_btc_mined).toLocaleString()}</p>
                        </div>
                      </div>
                      {offline > 0 && (
                        <p className="text-[10px] text-warning mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{offline} units in scheduled maintenance
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Mining Process (Infographic) ─────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">How Our Mining Infrastructure Works</h2>
          <p className="text-sm text-muted-foreground mb-8">From power generation to Bitcoin reward distribution — a transparent end-to-end process.</p>
          <div className="grid md:grid-cols-4 gap-4 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-primary/20 -z-0" />
            {[
              { icon: Zap,        step: 1, title: "Power Generation",   desc: "Renewable and low-cost energy sourced from geothermal, hydro, and wind facilities for maximum efficiency." },
              { icon: Cpu,        step: 2, title: "Mining Operations",  desc: "Industrial ASIC fleets (Antminer S21 XP, Whatsminer M60) perform continuous SHA-256 proof-of-work calculations." },
              { icon: Activity,   step: 3, title: "Pool Integration",   desc: "Mining rewards are distributed through verified mining pools proportional to contributed hashrate." },
              { icon: TrendingUp, step: 4, title: "Reward Distribution",desc: "Mining proceeds are allocated daily to contract holders according to hashrate ownership." },
            ].map(s => (
              <div key={s.step} className="relative z-10 flex flex-col items-center text-center p-5 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-3 shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary mb-1">Step {s.step}</span>
                <h3 className="font-bold text-sm text-foreground mb-2 text-balance">{s.title}</h3>
                <p className="text-xs text-muted-foreground text-pretty">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Infrastructure Comparison ─────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">BTCMiner vs. Typical Providers</h2>
          <p className="text-sm text-muted-foreground mb-6">We believe mining infrastructure should be transparent, sustainable, and verifiable.</p>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium w-52 whitespace-nowrap">Feature</th>
                  <th className="py-3 px-6 text-center whitespace-nowrap bg-primary/5">
                    <span className="font-bold text-primary">BTCMiner.online</span>
                  </th>
                  <th className="py-3 px-6 text-center whitespace-nowrap">
                    <span className="text-muted-foreground font-medium">Typical Provider</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.feature} className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{row.feature}</td>
                    <td className="py-3 px-6 text-center bg-primary/5 whitespace-nowrap">
                      <CheckCircle className="w-5 h-5 text-success mx-auto" />
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.typical === "No" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                        {row.typical}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Transparency Center ────────────────────────────────────────────── */}
        <div className="mb-14 border border-primary/20 bg-primary/5 rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Transparency &amp; Verification</h2>
              <p className="text-sm text-muted-foreground mb-4 text-pretty">
                We publish verifiable data for every aspect of our mining operation. All payout transactions include on-chain Bitcoin transaction hashes you can independently verify.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "Real-time uptime metrics",
                  "Mining pool statistics",
                  "Infrastructure reports",
                  "Hashrate audit logs",
                  "Payout transaction proofs",
                  "Network statistics",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 w-full md:w-auto" asChild>
                <Link to="/transparency"><BarChart3 className="w-4 h-4" />View Transparency Center</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Enterprise Security ────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Enterprise Security</h2>
          <p className="text-sm text-muted-foreground mb-6">Military-grade physical and digital security protocols protect every facility and user asset.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SECURITY.map(s => (
              <div key={s.title} className="border border-border rounded-lg p-4 flex gap-3 h-full">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-foreground mb-1 text-balance">{s.title}</h3>
                  <p className="text-xs text-muted-foreground text-pretty">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sustainability Section ─────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Sustainable Bitcoin Mining</h2>
          <p className="text-sm text-muted-foreground mb-6">We are committed to operating with minimal environmental impact through responsible energy sourcing.</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Energy mix */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-success" />Energy Mix
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Hydro Power",        pct: 52, icon: Droplets, color: "bg-primary" },
                    { label: "Geothermal",          pct: 28, icon: Zap,      color: "bg-warning" },
                    { label: "Wind Energy",         pct: 14, icon: Wind,     color: "bg-success" },
                    { label: "Grid (Low Carbon)",   pct: 6,  icon: Leaf,     color: "bg-muted-foreground" },
                  ].map(e => (
                    <div key={e.label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><e.icon className="w-3 h-3" />{e.label}</span>
                        <span className="font-mono font-bold text-foreground">{e.pct}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className={`${e.color} h-1.5 rounded-full`} style={{ width: `${e.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-success font-semibold mt-4 flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5" />94% renewable energy — industry-leading sustainability
                </p>
              </CardContent>
            </Card>

            {/* Sustainability initiatives */}
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />Sustainability Initiatives
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Leaf,     title: "Carbon Reduction Program",   desc: "Net-zero target by 2027 with verified carbon offset purchases." },
                    { icon: Droplets, title: "Fjord Water Cooling (Norway)",desc: "Natural seawater cooling eliminates traditional HVAC in Norwegian facility." },
                    { icon: Wind,     title: "Wind Power PPA (Texas)",      desc: "Power purchase agreements with Texas wind farms, 280 MW capacity." },
                    { icon: Zap,      title: "Heat Recycling (Iceland)",    desc: "Waste heat from ASIC operations redirected to local greenhouses." },
                  ].map(s => (
                    <div key={s.title} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                        <s.icon className="w-3.5 h-3.5 text-success" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Social Proof ──────────────────────────────────────────────────── */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-foreground mb-2 text-center text-balance">Trusted by Thousands of Miners</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">Real miners. Real rewards. Verified on-chain.</p>
          {/* Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Active Users",        value: 18472,  suffix: "+",  decimals: 0 },
              { label: "Total Withdrawals",   value: 48321,  suffix: "+ BTC", decimals: 0 },
              { label: "Average Uptime",      value: 99.3,   suffix: "%",  decimals: 1 },
              { label: "Satisfaction Rate",   value: 98.7,   suffix: "%",  decimals: 1 },
            ].map(s => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const { count, ref } = useCountUp(s.value, 2000, s.decimals);
              return (
                <div ref={ref} key={s.label} className="text-center border border-border rounded-lg p-4">
                  <p className="text-2xl font-bold font-mono text-primary tabular-nums">
                    {count.toLocaleString("en-US", { minimumFractionDigits: s.decimals, maximumFractionDigits: s.decimals })}{s.suffix}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(t => (
              <Card key={t.name} className="bg-card border-border h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-pretty flex-1 mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.country} · Verified Miner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Internal Links / Bottom CTA ───────────────────────────────────── */}
        <div className="mb-14 grid md:grid-cols-4 gap-4">
          {[
            { icon: Server,      label: "Mining Plans",        href: "/pricing",      desc: "Choose a hashrate contract" },
            { icon: ShoppingBag, label: "Marketplace",          href: "/marketplace",  desc: "Browse 50+ contracts" },
            { icon: BarChart3,   label: "Profitability Calc",   href: "/calculator",   desc: "Estimate your returns" },
            { icon: Activity,    label: "FAQ",                  href: "/faq",          desc: "Common questions answered" },
          ].map(link => (
            <Link key={link.href} to={link.href}
              className="border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <link.icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div className="text-center py-10 border border-primary/20 bg-primary/5 rounded-xl">
          <h2 className="text-2xl font-bold text-foreground mb-3 text-balance">
            Ready to Mine Bitcoin from Our Facilities?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-pretty">
            Our {miningFarms.length} facilities manage {totalMiners.toLocaleString()} ASIC miners producing Bitcoin around the clock. Purchase a hashrate contract and start earning today.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11 px-6" asChild>
              <Link to="/register"><Zap className="w-4 h-4" />Start Mining Today</Link>
            </Button>
            <Button variant="outline" className="h-11 px-6 gap-2" asChild>
              <Link to="/pricing"><Server className="w-4 h-4" />View Mining Contracts</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border px-4 py-3 flex gap-3">
        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11" asChild>
          <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
        </Button>
        <Button variant="outline" className="flex-1 h-11 gap-2" asChild>
          <Link to="/pricing"><Server className="w-4 h-4" />View Plans</Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  </>
  );
}
