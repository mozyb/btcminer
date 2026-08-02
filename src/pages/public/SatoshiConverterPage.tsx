import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowRightLeft, RotateCcw, ArrowRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";
import PublicLayout from "@/components/layouts/PublicLayout";

function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

const SAT_PER_BTC = 100_000_000;
const CACHE_KEY = "btc_price_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface LiveData { price: number; updatedAt: Date; source: string; fromCache: boolean }

const tableRows = [1, 10, 100, 500, 1000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 10_000_000, 100_000_000];
const rowUses: Record<number, string> = {
  1: "Dust threshold",
  10: "Micro-tip",
  100: "Lightning micro-payment",
  500: "Small gaming reward",
  1000: "Typical Lightning tip",
  10000: "Coffee tip",
  50000: "Snack payment",
  100000: "Small transaction",
  500000: "Lunch payment",
  1000000: "Millions of SAT",
  10000000: "0.1 BTC",
  100000000: "1 BTC",
};

const faqList = [
  { q: "How many Satoshis are in $1?", a: "It depends on the current Bitcoin price. At $65,000 per BTC, $1 equals about 1,538 SAT. Use the live converter for the exact value." },
  { q: "Can one Satoshi become expensive?", a: "If Bitcoin's price rises significantly, a single Satoshi could be worth more in dollar terms. Bitcoin's divisibility into Satoshis means it can remain usable even if BTC reaches very high prices." },
  { q: "What affects the price of a Satoshi?", a: "The Satoshi price is simply the Bitcoin price divided by 100,000,000. Anything that moves BTC price also moves the value of each SAT." },
  { q: "Can I buy Satoshis directly?", a: "Yes. Most exchanges allow you to buy any amount of Bitcoin, including small fractions denominated in Satoshis. You are still buying BTC." },
  { q: "Are Satoshis and Bitcoin different?", a: "No. Satoshis are a subunit of Bitcoin. Just as cents are part of a dollar, Satoshis are part of one Bitcoin." },
  { q: "How are Satoshis used?", a: "Satoshis are used for pricing small transactions, Lightning Network payments, mining rewards, wallet balances, and micro-payments." },
  { q: "What is the Lightning Network?", a: "The Lightning Network is a second-layer protocol for Bitcoin. It enables fast, low-cost payments denominated in Satoshis." },
  { q: "How do miners earn Satoshis?", a: "Miners earn block rewards and transaction fees in Bitcoin. Pool payouts are often measured in Satoshis per day or per share." },
  { q: "Which wallets show balances in Satoshis?", a: "Many Lightning wallets and Bitcoin wallets allow you to display balances in Satoshis. You can usually switch between BTC, mBTC, and SAT." },
  { q: "Is a Satoshi a good investment?", a: "Investing in Satoshis is the same as investing in Bitcoin. The decision depends on your risk tolerance, research, and financial goals." },
  { q: "How many Satoshis are in one Bitcoin?", a: "There are exactly 100,000,000 Satoshis in one Bitcoin." },
  { q: "Can I convert Satoshi to USD instantly?", a: "Yes. Use the converter above. It pulls the live Bitcoin price from CoinGecko and calculates the USD value in real time." },
  { q: "Does this converter use live data?", a: "Yes. The converter fetches the current BTC/USD price from CoinGecko. It also caches the price for a short time to reduce API calls and improve performance." },
];

export default function SatoshiConverterPage() {
  const [sat, setSat] = useState<string>("");
  const [usd, setUsd] = useState<string>("");
  const [btc, setBtc] = useState<string>("");
  const [live, setLive] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const activeRef = useRef<"sat" | "usd" | "btc" | null>(null);

  const formatSat = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const formatUsd = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  const formatBtc = (n: number) => n.toFixed(8);
  const formatCurrency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const satToBtc = (s: number) => s / SAT_PER_BTC;
  const btcToSat = (b: number) => b * SAT_PER_BTC;
  const satToUsd = (s: number, price: number) => satToBtc(s) * price;
  const usdToSat = (u: number, price: number) => (u / price) * SAT_PER_BTC;
  const usdToBtc = (u: number, price: number) => u / price;
  const btcToUsd = (b: number, price: number) => b * price;

  function parseInput(value: string) {
    const cleaned = value.replace(/,/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  function updateFromSat(value: string, price: number) {
    const n = parseInput(value);
    if (n === null) { setUsd(""); setBtc(""); return; }
    setUsd(formatUsd(satToUsd(n, price)));
    setBtc(formatBtc(satToBtc(n)));
  }

  function updateFromUsd(value: string, price: number) {
    const n = parseInput(value);
    if (n === null) { setSat(""); setBtc(""); return; }
    setSat(formatSat(usdToSat(n, price)));
    setBtc(formatBtc(usdToBtc(n, price)));
  }

  function updateFromBtc(value: string, price: number) {
    const n = parseInput(value);
    if (n === null) { setSat(""); setUsd(""); return; }
    setSat(formatSat(btcToSat(n)));
    setUsd(formatUsd(btcToUsd(n, price)));
  }

  function recalc(price: number) {
    if (activeRef.current === "sat" && sat) updateFromSat(sat, price);
    else if (activeRef.current === "usd" && usd) updateFromUsd(usd, price);
    else if (activeRef.current === "btc" && btc) updateFromBtc(btc, price);
    else if (sat) updateFromSat(sat, price);
    else if (usd) updateFromUsd(usd, price);
    else if (btc) updateFromBtc(btc, price);
  }

  async function fetchPrice() {
    setLoading(true);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setLive({ price: parsed.price, updatedAt: new Date(parsed.timestamp), source: "CoinGecko", fromCache: true });
          recalc(parsed.price);
        }
      } catch { /* ignore */ }
    }
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const price = data?.bitcoin?.usd;
      if (!price) throw new Error("Invalid price data");
      localStorage.setItem(CACHE_KEY, JSON.stringify({ price, timestamp: Date.now() }));
      setLive({ price, updatedAt: new Date(), source: "CoinGecko", fromCache: false });
      recalc(price);
    } catch {
      if (!live) {
        const fallback = 65000;
        setLive({ price: fallback, updatedAt: new Date(), source: "Fallback", fromCache: false });
        recalc(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrice();
    const id = setInterval(fetchPrice, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSat = (value: string) => {
    activeRef.current = "sat";
    setSat(value);
    if (!live) return;
    updateFromSat(value, live.price);
  };

  const handleUsd = (value: string) => {
    activeRef.current = "usd";
    setUsd(value);
    if (!live) return;
    updateFromUsd(value, live.price);
  };

  const handleBtc = (value: string) => {
    activeRef.current = "btc";
    setBtc(value);
    if (!live) return;
    updateFromBtc(value, live.price);
  };

  const handleCopy = async () => {
    if (!usd) return;
    try {
      await navigator.clipboard.writeText(`$${usd}`);
      toast.success("USD value copied to clipboard");
    } catch {
      toast.error("Copy failed. Please select and copy manually.");
    }
  };

  const handleSwap = () => {
    const satVal = sat;
    const usdVal = usd;
    if (usdVal) {
      activeRef.current = "sat";
      setSat(formatSat(parseInput(usdVal) ? usdToSat(parseInput(usdVal)!, live?.price ?? 65000) : 0));
      setUsd(satVal ? formatUsd(satToUsd(parseInput(satVal) ?? 0, live?.price ?? 65000)) : "");
      if (sat) setBtc(formatBtc(satToBtc(parseInput(sat) ?? 0)));
    } else {
      setSat(""); setUsd(""); setBtc("");
    }
  };

  const handleReset = () => {
    setSat(""); setUsd(""); setBtc(""); activeRef.current = null;
    toast.success("Calculator reset");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Satoshi to USD Converter | BTCMiner.online",
          text: "Convert Satoshi to USD instantly with live BTC price.",
          url: "https://btcminer.online/satoshi-to-usd-converter",
        });
      } else {
        await navigator.clipboard.writeText("https://btcminer.online/satoshi-to-usd-converter");
        toast.success("Link copied to clipboard");
      }
    } catch {
      toast.error("Share failed");
    }
  };

  const price = live?.price ?? 65000;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://btcminer.online/" },
      { "@type": "ListItem", position: 2, name: "Tools", item: "https://btcminer.online/calculator" },
      { "@type": "ListItem", position: 3, name: "Satoshi to USD Converter", item: "https://btcminer.online/satoshi-to-usd-converter" },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Satoshi to USD Converter | Live BTC Price",
    description: "Convert Satoshi to USD instantly with live Bitcoin price. Free Satoshi calculator, BTC unit converter, and Lightning-friendly SAT conversion tool.",
    url: "https://btcminer.online/satoshi-to-usd-converter",
    breadcrumb: breadcrumbSchema,
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Satoshi to USD Converter",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: "https://btcminer.online/satoshi-to-usd-converter",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqList.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <PublicLayout>
      <PageMeta
        title="Satoshi to USD Converter | Live BTC Price"
        description="Convert Satoshi to USD instantly with live Bitcoin price. Free Satoshi calculator, BTC unit converter, and Lightning-friendly SAT conversion tool."
        canonical="/satoshi-to-usd-converter"
        keywords="satoshi to usd, satoshi converter, bitcoin converter, satoshi calculator, BTC to USD"
        ogImage="https://btcminer.online/images/satoshi-converter-og.jpg"
      />
      <JsonLd data={webPageSchema} />
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ArrowRight className="w-3 h-3" />
            <Link to="/calculator" className="hover:text-foreground transition-colors">Tools</Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-foreground font-medium">Satoshi to USD Converter</span>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">Free Live Tool</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground text-balance mb-4">
              Satoshi to USD Converter
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-pretty">
              Convert Satoshi to dollars instantly with live Bitcoin pricing. Perfect for Lightning payments, wallet balances, and micro-transactions.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {loading || !live ? "Loading BTC price…" : formatCurrency(live.price) + " per BTC"}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-10 md:space-y-16">
          {/* Calculator */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl md:text-2xl font-bold">Live Satoshi Converter</CardTitle>
              <CardDescription>Enter any value. Satoshi, USD, and BTC update together automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="sat-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Satoshi</label>
                  <div className="relative">
                    <Input
                      id="sat-input"
                      inputMode="decimal"
                      value={sat}
                      onChange={(e) => handleSat(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      className="h-12 text-lg font-semibold pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">SAT</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="usd-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">USD</label>
                  <div className="relative">
                    <Input
                      id="usd-input"
                      inputMode="decimal"
                      value={usd}
                      onChange={(e) => handleUsd(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0.00"
                      className="h-12 text-lg font-semibold pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">USD</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="btc-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bitcoin</label>
                <div className="relative">
                  <Input
                    id="btc-input"
                    inputMode="decimal"
                    value={btc}
                    onChange={(e) => handleBtc(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00000000"
                    className="h-12 text-lg font-semibold pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">BTC</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" onClick={handleCopy} disabled={!usd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Copy className="w-4 h-4 mr-2" /> Copy USD
                </Button>
                <Button type="button" variant="outline" onClick={handleSwap}>
                  <ArrowRightLeft className="w-4 h-4 mr-2" /> Swap
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Reset
                </Button>
                <Button type="button" variant="outline" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
                <span>Source: {live?.source ?? "—"}</span>
                <span>Last updated: {live?.updatedAt.toLocaleTimeString() ?? "—"}</span>
                <span>{live?.fromCache ? "Using cached price" : "Live price"}</span>
              </div>
            </CardContent>
          </Card>

          {/* What is a Satoshi */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">What is a Satoshi?</h2>
            <p className="text-muted-foreground text-pretty mb-4">
              A Satoshi is the smallest unit of Bitcoin. One Bitcoin equals 100,000,000 Satoshis, named after Bitcoin&apos;s pseudonymous creator, Satoshi Nakamoto.
            </p>
            <p className="text-muted-foreground text-pretty mb-6">
              Satoshis make Bitcoin divisible. Because one BTC can be worth tens of thousands of dollars, everyday transactions are easier to price in SATs. The Lightning Network also denominates payments in Satoshis, enabling tiny, fast transfers with minimal fees.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "100,000,000 SAT = 1 BTC",
                "Satoshis enable micro-payments",
                "Lightning Network uses SATs",
                "SATs are not a separate token",
                "BTC and SAT are the same asset",
                "SATS make Bitcoin usable",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Practical Uses */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Practical Uses for Satoshis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Micro-payments and tips",
                "Lightning Network transactions",
                "Dollar-cost averaging tracking",
                "Mining pool payouts",
                "Wallet balance display",
                "Gaming rewards",
                "Merchant payments",
                "International transfers",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/calculator">Calculate Mining Profit</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/marketplace">Explore Hashrate Marketplace</Link>
              </Button>
            </div>
          </section>

          {/* Conversion Table */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Satoshi Conversion Table</h2>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Satoshi</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">BTC</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Approximate USD</th>
                      <th className="text-left px-4 py-3 font-semibold text-foreground">Typical Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map(row => {
                      const btcVal = satToBtc(row);
                      const usdVal = satToUsd(row, price);
                      return (
                        <tr key={row} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3 font-mono text-muted-foreground">{formatSat(row)}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{formatBtc(btcVal)}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{formatCurrency(usdVal)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{rowUses[row]}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">USD values update automatically with the live BTC price.</p>
          </section>

          {/* Live Examples */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Live Examples</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Coffee purchase", sat: 5_000_000 },
                { label: "Lightning tip", sat: 1_000 },
                { label: "Mining payout", sat: 50_000_000 },
                { label: "Exchange withdrawal", sat: 10_000_000 },
                { label: "DCA purchase", sat: 25_000_000 },
                { label: "Micro-payment", sat: 100 },
              ].map(ex => (
                <Card key={ex.label} className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="font-semibold text-foreground mb-1">{ex.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatSat(ex.sat)} SAT ≈{" "}
                      <span className="text-emerald-500 font-semibold">{formatCurrency(satToUsd(ex.sat, price))}</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Related Tools */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">More BTCMiner Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Bitcoin Mining Calculator", href: "/calculator", desc: "Estimate daily Bitcoin mining earnings, ROI, and break-even by hashrate and electricity cost." },
                { label: "BTC to USD Converter", href: "/satoshi-to-usd-converter", desc: "Convert BTC or Satoshi to USD instantly with live Bitcoin price." },
                { label: "Mining Profit Calculator", href: "/calculator", desc: "Calculate mining profit and break-even for any ASIC or cloud contract." },
                { label: "Hashrate Calculator", href: "/calculator", desc: "Estimate earnings by hashrate, power cost, and BTC price." },
                { label: "Hashrate Marketplace", href: "/marketplace", desc: "Compare live hashrate contracts and pricing across our marketplace." },
                { label: "Mining Contracts", href: "/pricing", desc: "Explore transparent cloud mining contracts and plans." },
                { label: "Bitcoin Mining Explained", href: "/blog/what-is-bitcoin-mining-guide", desc: "Learn how Bitcoin mining works and what makes it profitable." },
                { label: "What Is Hashrate?", href: "/blog/what-is-hashrate", desc: "Understand hashrate, its units, and why it matters." },
                { label: "Bitcoin Mining Difficulty", href: "/blog/bitcoin-mining-difficulty-explained", desc: "Read how mining difficulty adjusts and affects rewards." },
                { label: "Cloud Mining Guide", href: "/blog/cloud-mining-vs-asic-mining", desc: "Learn how cloud mining works and how it compares to home mining." },
                { label: "Bitcoin Mining Blog", href: "/blog", desc: "Read guides on hashrate, difficulty, profitability, and market trends." },
                { label: "Mining Hardware", href: "/hardware", desc: "Compare ASIC miners, efficiency, and profitability by machine." },
              ].map(tool => (
                <Card key={tool.href} className="bg-card border-border hover:border-primary/50 transition-colors h-full flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-foreground mb-1">{tool.label}</h3>
                    <p className="text-sm text-muted-foreground mb-3 flex-1">{tool.desc}</p>
                    <Link to={tool.href} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      Open tool <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqList.map((item, idx) => (
                <div key={idx} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.q}</h3>
                  <p className="text-muted-foreground text-pretty">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Continue Learning */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Bitcoin Mining Explained", href: "/blog/what-is-bitcoin-mining-guide" },
                { label: "What is Hashrate?", href: "/blog/what-is-hashrate" },
                { label: "Bitcoin Mining Difficulty Explained", href: "/blog/bitcoin-mining-difficulty-explained" },
                { label: "Bitcoin Mining Profit Calculator", href: "/calculator" },
                { label: "BTC to USD Converter", href: "/satoshi-to-usd-converter" },
                { label: "Cloud Mining Guide", href: "/blog/cloud-mining-vs-asic-mining" },
                { label: "Mining Contracts", href: "/pricing" },
                { label: "Hashrate Marketplace", href: "/marketplace" },
              ].map(link => (
                <Link key={link.href} to={link.href} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/50 hover:text-primary transition-colors">
                  <span className="text-sm text-muted-foreground">{link.label}</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>

          {/* Data & Methodology */}
          <section>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Data & Methodology</h2>
            <p className="text-muted-foreground text-pretty mb-4">
              Conversion rate is calculated by dividing the live BTC/USD price by 100,000,000. USD values are rounded to the nearest cent for readability. The live price is sourced from CoinGecko.
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-6">
              <span className="px-3 py-1.5 rounded-full bg-muted/30 border border-border">Last updated: {live?.updatedAt.toLocaleTimeString() ?? "—"}</span>
              <span className="px-3 py-1.5 rounded-full bg-muted/30 border border-border">Price source: {live?.source ?? "—"}</span>
              <span className="px-3 py-1.5 rounded-full bg-muted/30 border border-border">Calculation: BTC/USD ÷ 100,000,000</span>
              <span className="px-3 py-1.5 rounded-full bg-muted/30 border border-border">Editorial review: June 2026</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/calculator">Calculate Your Mining Profit</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">Explore Mining Plans</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/marketplace">Browse Hashrate Marketplace</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/blog/what-is-bitcoin-mining-guide">Learn About Bitcoin Mining</Link>
              </Button>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-muted/30 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Disclaimer</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              This converter provides estimates for informational purposes only. Bitcoin prices are volatile. Actual exchange rates, fees, and mining rewards may differ. Always verify values with your exchange or wallet before transacting.
            </p>
          </section>
        </main>
      </div>
    </PublicLayout>
  );
}
