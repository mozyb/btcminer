import React, { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PublicLayout from "@/components/layouts/PublicLayout";
import { miningContracts } from "@/lib/mockData";
import { useBtcStats } from "@/hooks/useBtcStats";
import {
  ChevronRight, Zap, Clock, Shield, TrendingUp, Server,
  Cpu, DollarSign, ArrowRight, CheckCircle, Hash,
} from "lucide-react";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function ContractDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate   = useNavigate();
  const btc        = useBtcStats();

  const contract = miningContracts.find(c => c.slug === slug);
  const related  = miningContracts.filter(c => c.slug !== slug && c.algorithm === contract?.algorithm).slice(0, 3);

  useEffect(() => {
    if (!contract) navigate("/marketplace", { replace: true });
  }, [contract, navigate]);

  if (!contract) return null;

  const networkTH    = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 850e6;
  const hashrateInTH = contract.hashrateUnit === "PH/s" ? contract.hashrate * 1000
                     : contract.hashrateUnit === "GH/s" ? contract.hashrate / 1000
                     : contract.hashrateUnit === "MH/s" ? contract.hashrate / 1e6
                     : contract.hashrate;
  const grossDailyBTC = (hashrateInTH / networkTH) * 144 * (btc.blockReward || 3.125);
  const maintDailyBTC = (contract.maintenanceFee * hashrateInTH) / (btc.btcPrice || 63000);
  const netDailyBTC   = Math.max(0, grossDailyBTC - maintDailyBTC);
  const netDailyUSD   = netDailyBTC * (btc.btcPrice || 63000);
  const netTotalBTC   = netDailyBTC * contract.duration;
  const netTotalUSD   = netTotalBTC * (btc.btcPrice || 63000);
  const roi           = contract.totalPrice > 0 ? ((netTotalUSD / contract.totalPrice) * 100).toFixed(1) : "0";
  const breakevenDays = netDailyUSD > 0 ? Math.ceil(contract.totalPrice / netDailyUSD) : 0;

  // Structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${contract.name} Bitcoin Mining Contract`,
    description: `Purchase ${contract.hashrate} ${contract.hashrateUnit} of ${contract.algorithm} mining hashrate for ${contract.duration} days. Earn daily Bitcoin mining rewards from our enterprise data centers.`,
    brand: { "@type": "Brand", name: "BTCMiner.online" },
    offers: {
      "@type": "Offer",
      price: contract.totalPrice,
      priceCurrency: "USD",
      availability: contract.availability > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://btcminer.online/marketplace/${contract.slug}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",        item: "https://btcminer.online/" },
      { "@type": "ListItem", position: 2, name: "Marketplace", item: "https://btcminer.online/marketplace" },
      { "@type": "ListItem", position: 3, name: contract.name, item: `https://btcminer.online/marketplace/${contract.slug}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the ${contract.name} mining contract?`,
        acceptedAnswer: { "@type": "Answer", text: `The ${contract.name} provides ${contract.hashrate} ${contract.hashrateUnit} of ${contract.algorithm} mining power for ${contract.duration} days, running on ${contract.hardware} hardware in our enterprise data centers.` },
      },
      {
        "@type": "Question",
        name: "How much can I earn daily?",
        acceptedAnswer: { "@type": "Answer", text: `Based on current network conditions, estimated net daily earnings are approximately ${netDailyBTC.toFixed(6)} BTC (~$${netDailyUSD.toFixed(2)} USD). Actual earnings vary with network difficulty and BTC price.` },
      },
      {
        "@type": "Question",
        name: "What hardware runs this contract?",
        acceptedAnswer: { "@type": "Answer", text: `This contract runs on ${contract.hardware} ASICs deployed in our enterprise mining facilities.` },
      },
    ],
  };

  const algoDescriptions: Record<string, string> = {
    "SHA-256": "SHA-256 (Secure Hash Algorithm 256-bit) is the proof-of-work algorithm that secures the Bitcoin blockchain. Mining hardware performs billions of SHA-256 computations per second, competing to find a valid block hash below the current network target. Modern SHA-256 ASICs deliver 270–300 TH/s per unit.",
    "Scrypt":  "Scrypt is the memory-hard proof-of-work algorithm used by Litecoin and Dogecoin. It was designed to be ASIC-resistant but specialized Scrypt ASICs now dominate the network.",
    "Kadena":  "Kadena (KHeavyHash) is used by the Kaspa network. It is an ASIC-friendly algorithm optimized for high-throughput mining on specialized hardware.",
  };

  const contractFaq = [
    { q: `What is the ${contract.name} contract?`, a: `The ${contract.name} provides ${contract.hashrate} ${contract.hashrateUnit} of ${contract.algorithm} mining power for ${contract.duration} days on ${contract.hardware} hardware in our data centers.` },
    { q: "When does mining start?", a: "Mining begins within minutes of purchase confirmation. Your hashrate is immediately allocated to our active mining pools." },
    { q: "What are the maintenance fees?", a: `The daily maintenance fee is $${contract.maintenanceFee} per TH/s per day. This covers electricity, cooling, and hardware operations. Fees are deducted from gross mining rewards before crediting your wallet.` },
    { q: "Can I sell or transfer this contract?", a: "Contracts are non-transferable and cannot be sold on the secondary market. You may purchase additional contracts at any time." },
    { q: "What happens at contract expiry?", a: `After ${contract.duration} days, the hashrate allocation is deactivated. All rewards remain in your wallet and can be withdrawn at any time.` },
  ];

  const badgeMap: Record<string, { label: string; class: string }> = {
    most_popular: { label: "Most Popular", class: "bg-primary text-primary-foreground" },
    best_value:   { label: "Best Value",   class: "bg-success text-white" },
    featured:     { label: "Featured",     class: "bg-amber-500 text-white" },
  };
  const badgeInfo = contract.badge ? badgeMap[contract.badge] : null;

  return (
    <PublicLayout>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{contract.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">{contract.algorithm}</Badge>
            {badgeInfo && <Badge className={badgeInfo.class}>{badgeInfo.label}</Badge>}
            {contract.availability > 0
              ? <Badge className="bg-success/10 text-success border-success/20">{contract.availability} slots available</Badge>
              : <Badge className="bg-destructive/10 text-destructive border-destructive/20">Sold Out</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance mb-3">
            {contract.name} — {contract.hashrate} {contract.hashrateUnit} Bitcoin Mining Contract
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl text-pretty">
            Purchase {contract.hashrate} {contract.hashrateUnit} of {contract.algorithm} mining hashrate for {contract.duration} days.
            Earn daily Bitcoin rewards from our enterprise data centers powered by {contract.hardware} hardware.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap,       label: "Hashrate",     val: `${contract.hashrate} ${contract.hashrateUnit}` },
                { icon: Clock,     label: "Duration",     val: `${contract.duration} Days` },
                { icon: Server,    label: "Hardware",     val: contract.hardware },
                { icon: Shield,    label: "Algorithm",    val: contract.algorithm },
              ].map(s => (
                <div key={s.label} className="border border-border rounded p-4 bg-card">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center mb-2">
                    <s.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className="font-semibold text-foreground text-sm">{s.val}</p>
                </div>
              ))}
            </div>

            {/* Earnings table */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Reward Examples
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Period", "Est. BTC", "Est. USD", "Scenario"].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { period: "Daily",   btc: netDailyBTC,  usd: netDailyUSD,  note: "Current rates" },
                        { period: "Monthly", btc: netDailyBTC * 30, usd: netDailyUSD * 30, note: "30-day projection" },
                        { period: `${contract.duration}-Day Total`, btc: netTotalBTC, usd: netTotalUSD, note: "Full contract" },
                      ].map(r => (
                        <tr key={r.period} className="border-b border-border last:border-0">
                          <td className="py-2.5 px-3 font-medium text-foreground whitespace-nowrap">{r.period}</td>
                          <td className="py-2.5 px-3 font-mono text-success whitespace-nowrap">{r.btc.toFixed(6)} BTC</td>
                          <td className="py-2.5 px-3 font-mono text-foreground whitespace-nowrap">${r.usd.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap text-xs">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">* Estimates based on live network data. Actual rewards vary with difficulty and BTC price.</p>
              </CardContent>
            </Card>

            {/* ROI */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" /> ROI Examples
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { label: "Contract Cost",   val: `$${contract.totalPrice.toLocaleString()}`, sub: "One-time purchase" },
                    { label: "Projected ROI",   val: `${roi}%`, sub: `Over ${contract.duration} days` },
                    { label: "Break-even",       val: breakevenDays > 0 ? `~${breakevenDays} days` : "N/A", sub: "At current rates" },
                  ].map(r => (
                    <div key={r.label} className="bg-muted/30 border border-border rounded p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                      <p className="text-xl font-bold font-mono text-primary">{r.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{r.sub}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">ROI and break-even calculations are illustrative based on current network difficulty and BTC price. Mining involves risk.</p>
              </CardContent>
            </Card>

            {/* Algorithm explanation */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-primary" /> {contract.algorithm} Mining Algorithm
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                  {algoDescriptions[contract.algorithm] ?? `${contract.algorithm} is the proof-of-work algorithm used to mine ${contract.coin}.`}
                </p>
              </CardContent>
            </Card>

            {/* Hardware details */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" /> Hardware Used
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{contract.hardware}</p>
                    <p className="text-sm text-muted-foreground">Enterprise-grade {contract.algorithm} ASIC miner</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-pretty">
                  Your hashrate allocation runs on {contract.hardware} units deployed in our co-located data centers.
                  All hardware is maintained 24/7 by our on-site operations team with redundant power and cooling systems.
                </p>
              </CardContent>
            </Card>

            {/* FAQ */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Contract FAQ</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {contractFaq.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded px-4">
                    <AccordionTrigger className="text-sm font-medium text-foreground py-3 text-left hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-3 text-pretty">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Right: purchase card (sticky) */}
          <div>
            <div className="sticky top-24">
              <Card className="bg-card border-primary/30">
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground mb-1">Total Price</p>
                  <p className="text-3xl font-bold font-mono text-primary mb-1">${contract.totalPrice.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mb-5">${contract.pricePerTH}/TH/s</p>

                  {!btc.loading && (
                    <div className="mb-5 p-3 bg-success/5 border border-success/20 rounded text-xs">
                      <p className="text-muted-foreground mb-1">Est. Daily Earnings</p>
                      <p className="font-mono font-bold text-success text-base">{netDailyBTC.toFixed(6)} BTC</p>
                      <p className="font-mono text-muted-foreground">${netDailyUSD.toFixed(2)} / day</p>
                    </div>
                  )}

                  <div className="space-y-2 mb-5 text-sm">
                    {[
                      `${contract.hashrate} ${contract.hashrateUnit} hashrate`,
                      `${contract.duration}-day contract`,
                      `$${contract.maintenanceFee}/TH/day maintenance`,
                      "Daily reward payouts",
                      "Real ASIC hardware",
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                    asChild
                  >
                    <Link to="/register">
                      Purchase Contract <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Sign up free · No hardware required
                  </p>
                </CardContent>
              </Card>

              {/* Internal links */}
              <div className="mt-6 border border-border rounded p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">Learn More</p>
                {[
                  { label: "Mining Profit Calculator", href: "/calculator" },
                  { label: "Mining Farms",             href: "/farms" },
                  { label: "Hardware Fleet",           href: "/hardware" },
                ].map(l => (
                  <Link key={l.href} to={l.href} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related contracts */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-foreground mb-6">Related {contract.algorithm} Contracts</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map(r => {
                const rHashrateTH = r.hashrateUnit === "PH/s" ? r.hashrate * 1000
                                  : r.hashrateUnit === "GH/s" ? r.hashrate / 1000
                                  : r.hashrateUnit === "MH/s" ? r.hashrate / 1e6
                                  : r.hashrate;
                const rDaily     = (rHashrateTH / networkTH) * 144 * (btc.blockReward || 3.125);
                const rDailyUSD  = rDaily * (btc.btcPrice || 63000);
                return (
                  <Card key={r.id} className="bg-card border-border h-full flex flex-col hover:border-primary/40 transition-colors">
                    <CardContent className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{r.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{r.hashrate} {r.hashrateUnit} · {r.duration} days</p>
                      <div className="text-xs text-muted-foreground mb-1">Est. Daily</div>
                      <p className="font-mono font-bold text-success mb-4">${rDailyUSD.toFixed(2)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="font-bold font-mono text-primary">${r.totalPrice.toLocaleString()}</p>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/marketplace/${r.slug}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Risk notice */}
        <div className="mt-10 p-4 bg-muted/30 border border-border rounded text-xs text-muted-foreground">
          <strong className="text-foreground">Risk Notice:</strong> Mining output is not guaranteed. Earnings depend on network difficulty, cryptocurrency prices, and operational factors. Past performance is not indicative of future results. Read our{" "}
          <Link to="/risk" className="text-primary hover:underline">Risk Disclosure</Link> before purchasing.
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-border p-4">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">{contract.name}</p>
            <p className="font-bold font-mono text-primary">${contract.totalPrice.toLocaleString()}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0" asChild>
            <Link to="/register">Purchase <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </PublicLayout>
  );
}
