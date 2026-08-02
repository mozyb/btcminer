import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import {
  knowledgeArticles,
  type ContentBlock,
} from "@/lib/mockData";
import { useMiningStats, estimateDailyBtc } from "@/hooks/useMiningStats";
import {
  Clock, ChevronRight, ArrowRight, CheckCircle, Shield,
  BarChart3, Zap, BookOpen, ArrowLeft, List, Database,
  ExternalLink, RefreshCw, Bitcoin,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  USStateProfitabilityMap,
  USStateProfitabilityTable,
  USProfitabilityCalculator,
  USMiningComparisonTable,
  USMiningExamples,
} from "@/components/mining-us";

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     "bg-success/10 text-success border-success/20",
  Intermediate: "bg-warning/10 text-warning border-warning/20",
  Advanced:     "bg-destructive/10 text-destructive border-destructive/20",
};

function formatCurrency(n: number) {
  if (!n || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number, digits = 2) {
  if (!n || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

// ── Live network data panel (refreshes every 5 minutes) ───────────────────────
function LiveDataPanel() {
  const { stats, refresh } = useMiningStats();
  const hashpriceBtc = stats.networkDifficulty > 0
    ? estimateDailyBtc(1, stats.networkDifficulty, stats.blockReward)
    : 0;
  const hashpriceUsd = hashpriceBtc * stats.btcPrice;
  const dailyBtc100Th = estimateDailyBtc(100, stats.networkDifficulty, stats.blockReward);

  return (
    <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 my-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Bitcoin className="w-5 h-5 text-primary" />Live Network Data
        </h3>
        <Button variant="ghost" size="sm" className="gap-1 text-xs h-8" onClick={() => void refresh()}>
          <RefreshCw className="w-3 h-3" />Refresh
        </Button>
      </div>
      {stats.loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">BTC Price</p>
            <p className="font-semibold text-foreground">{formatCurrency(stats.btcPrice)}</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Network Difficulty</p>
            <p className="font-semibold text-foreground">{formatNumber(stats.networkDifficulty, 2)} T</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Network Hashrate</p>
            <p className="font-semibold text-foreground">{formatNumber(stats.networkHashrate, 2)} EH/s</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Block Reward</p>
            <p className="font-semibold text-foreground">{stats.blockReward} BTC</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hashprice</p>
            <p className="font-semibold text-foreground">{formatCurrency(hashpriceUsd)}/TH/day</p>
          </div>
          <div className="bg-card rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Est. 100 TH/day</p>
            <p className="font-semibold text-foreground">{dailyBtc100Th.toFixed(7)} BTC</p>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        Last updated: {stats.lastUpdated ? stats.lastUpdated.toLocaleString() : "Loading..."}.
        Values are estimates based on live network conditions and change as difficulty and price change.
      </p>
    </div>
  );
}

// ── Historical difficulty chart (illustrative data) ───────────────────────────
function DifficultyChart() {
  const [range, setRange] = useState<"30d" | "90d" | "1y" | "all">("1y");
  const data30d = useMemo(() => [
    { date: "2026-05-15", difficulty: 79.5 }, { date: "2026-05-20", difficulty: 80.2 },
    { date: "2026-05-25", difficulty: 81.0 }, { date: "2026-05-30", difficulty: 80.8 },
    { date: "2026-06-04", difficulty: 82.4 }, { date: "2026-06-09", difficulty: 83.1 },
    { date: "2026-06-14", difficulty: 83.8 },
  ], []);
  const data90d = useMemo(() => [
    { date: "2026-03-15", difficulty: 72.1 }, { date: "2026-04-01", difficulty: 74.5 },
    { date: "2026-04-15", difficulty: 76.3 }, { date: "2026-05-01", difficulty: 78.2 },
    { date: "2026-05-15", difficulty: 79.5 }, { date: "2026-06-01", difficulty: 81.9 },
    { date: "2026-06-14", difficulty: 83.8 },
  ], []);
  const data1y = useMemo(() => [
    { date: "2025-06", difficulty: 83.7 }, { date: "2025-08", difficulty: 79.0 },
    { date: "2025-10", difficulty: 74.5 }, { date: "2025-12", difficulty: 78.2 },
    { date: "2026-02", difficulty: 85.1 }, { date: "2026-04", difficulty: 80.5 },
    { date: "2026-06", difficulty: 83.8 },
  ], []);
  const dataAll = useMemo(() => [
    { date: "2009", difficulty: 1.0 }, { date: "2012", difficulty: 3.4 },
    { date: "2014", difficulty: 40.0 }, { date: "2016", difficulty: 158.0 },
    { date: "2018", difficulty: 3_000.0 }, { date: "2020", difficulty: 19_000.0 },
    { date: "2022", difficulty: 27_000.0 }, { date: "2024", difficulty: 83_000.0 },
    { date: "2026", difficulty: 83_800.0 },
  ], []);
  const data = { "30d": data30d, "90d": data90d, "1y": data1y, all: dataAll }[range];
  return (
    <div className="border border-border rounded-xl p-5 my-6 bg-card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-bold text-foreground">Bitcoin Difficulty History</h3>
        <div className="flex flex-wrap gap-1">
          {(["30d", "90d", "1y", "all"] as const).map(r => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setRange(r)}
            >
              {r === "1y" ? "1 Year" : r === "all" ? "All Time" : r.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={60} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value.toLocaleString()} T`, "Difficulty"]}
            />
            <Line type="monotone" dataKey="difficulty" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Illustrative historical difficulty values in trillions (T). Use live data sources for exact figures.</p>
    </div>
  );
}

// ── Reading progress bar ──────────────────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.min((scrolled / total) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-muted/50">
      <div
        className="h-full bg-primary transition-all duration-100 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── Content block renderer ────────────────────────────────────────────────────
function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 id={block.id} className="text-lg md:text-xl font-bold text-foreground mt-8 mb-3">{block.text}</h2>;
    case "h3":
      return <h3 className="text-base md:text-lg font-semibold text-foreground mt-6 mb-2">{block.text}</h3>;
    case "p":
      return <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">{block.text}</p>;
    case "ul":
      return (
        <ul className="space-y-2 mb-4 pl-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
              <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-1" />
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="space-y-2 mb-4 pl-1">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 mb-4">
          <p className="text-sm text-foreground text-pretty">{block.text}</p>
        </div>
      );
    case "table":
      return (
        <div className="w-full overflow-x-auto mb-4">
          <table className="w-full min-w-max text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                {block.headers?.map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows?.map((row, i) => (
                <tr key={i} className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}>
                  {row.map((cell, j) => (
                    <td key={j} className="py-2 px-3 text-muted-foreground font-mono text-xs whitespace-nowrap">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "image":
      return (
        <figure className="mb-6">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-muted">
            <img
              src={block.src}
              alt={block.alt ?? block.caption ?? ""}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-xs text-muted-foreground text-pretty">{block.caption}</figcaption>
          )}
        </figure>
      );
    case "cta":
      return (
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 my-6">
          {block.title && <h3 className="font-bold text-foreground mb-2 text-balance">{block.title}</h3>}
          {block.description && <p className="text-sm text-muted-foreground mb-4 text-pretty">{block.description}</p>}
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
            <Link to={block.buttonTo ?? "/pricing"}><ArrowRight className="w-4 h-4" />{block.buttonText ?? "Learn more"}</Link>
          </Button>
        </div>
      );
    case "related_links":
      return (
        <div className="border border-border rounded-xl p-5 my-6 bg-card">
          {block.title && <h3 className="font-semibold text-foreground mb-3 text-sm">{block.title}</h3>}
          <div className="flex flex-wrap gap-2">
            {block.links?.map((link, idx) => (
              <Button key={idx} variant="outline" size="sm" className="gap-2 text-xs" asChild>
                <Link to={link.to}>{link.label}<ExternalLink className="w-3 h-3" /></Link>
              </Button>
              ))}
          </div>
        </div>
      );
    case "live_data":
      return <LiveDataPanel />;
    case "chart":
      if (block.chartType === "difficulty") return <DifficultyChart />;
      return null;
    case "separator":
      return <hr className="my-8 border-border" />;
    case "state_map":
      return <USStateProfitabilityMap />;
    case "state_table":
      return <USStateProfitabilityTable />;
    case "profitability_calculator":
      return <USProfitabilityCalculator />;
    case "comparison_table":
      return <USMiningComparisonTable />;
    case "examples":
      return <USMiningExamples />;
    default:
      return null;
  }
}

// ── Mid-article CTA ───────────────────────────────────────────────────────────
function MidArticleCTA() {
  return (
    <div className="border border-primary/20 bg-primary/5 rounded-xl p-6 my-8 text-center">
      <h3 className="font-bold text-foreground mb-2 text-balance">Ready to Start Mining?</h3>
      <p className="text-sm text-muted-foreground mb-4 text-pretty">
        Explore BTCMiner mining contracts and calculate potential mining rewards using live Bitcoin network data.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
          <Link to="/register"><Zap className="w-4 h-4" />Start Mining</Link>
        </Button>
        <Button variant="outline" className="gap-2" asChild>
          <Link to="/calculator"><BarChart3 className="w-4 h-4" />Open Calculator</Link>
        </Button>
      </div>
    </div>
  );
}

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [tocOpen, setTocOpen] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  const article = knowledgeArticles.find(a => a.slug === slug);
  const related = article
    ? knowledgeArticles.filter(a => article.relatedSlugs.includes(a.slug)).slice(0, 3)
    : [];

  // Extract h2 headings for Table of Contents
  const toc = article?.content.filter(b => b.type === "h2").map(b => b.text ?? "") ?? [];

  // Structured data
  const articleSchema = article ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription,
    "image": article.image,
    "author": { "@type": "Person", "name": article.author.name, "jobTitle": article.author.title },
    "publisher": { "@type": "Organization", "name": "BTCMiner.online", "url": "https://btcminer.online" },
    "datePublished": article.publishDate,
    "dateModified": article.updatedDate,
    "mainEntityOfPage": `https://btcminer.online/blog/${article.slug}`,
    "keywords": article.tags.join(", "),
  } : null;

  const faqSchema = article?.faq.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faq.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  } : null;

  const breadcrumbSchema = article ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",              "item": "https://btcminer.online/" },
      { "@type": "ListItem", "position": 2, "name": "Knowledge Center",  "item": "https://btcminer.online/blog" },
      { "@type": "ListItem", "position": 3, "name": article.category,   "item": `https://btcminer.online/blog?category=${encodeURIComponent(article.category)}` },
      { "@type": "ListItem", "position": 4, "name": article.title,      "item": `https://btcminer.online/blog/${article.slug}` },
    ],
  } : null;

  if (!article) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or has been moved.</p>
          <Button asChild><Link to="/blog">Back to Knowledge Center</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const midpoint = Math.floor(article.content.length / 2);

  return (
    <PublicLayout>
      <PageMeta
        title={article.metaTitle}
        description={article.metaDescription}
        keywords={article.tags.join(", ")}
        canonical={`/blog/${article.slug}`}
        ogType="article"
      />
      <ReadingProgressBar />
      {articleSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />}
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />}

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-foreground transition-colors">Knowledge Center</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-muted-foreground">{article.category}</span>
          <ChevronRight className="w-3 h-3 hidden md:block" />
          <span className="hidden md:block text-foreground truncate max-w-xs">{article.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* ── Main Article ───────────────────────────────────────────────── */}
          <article ref={articleRef} className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{article.category}</Badge>
                <Badge className={`text-xs ${LEVEL_COLORS[article.level]}`}>{article.level}</Badge>
                {article.trending && <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">🔥 Trending</Badge>}
                <Badge className="bg-success/10 text-success border-success/20 text-xs flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />Fact Checked
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">{article.title}</h1>
              <p className="text-base text-muted-foreground mb-5 text-pretty">{article.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap border-t border-border pt-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min read</span>
                <span>Published {article.publishDate}</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" />Updated {article.updatedDate}</span>
              </div>
            </div>

            {/* Hero image */}
            <div className="aspect-[16/7] overflow-hidden rounded-xl mb-8">
              <img
                src={article.image}
                alt={article.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Mobile TOC toggle */}
            <button
              onClick={() => setTocOpen(o => !o)}
              className="lg:hidden w-full flex items-center justify-between border border-border rounded-lg p-3 mb-5 text-sm font-medium text-foreground"
            >
              <span className="flex items-center gap-2"><List className="w-4 h-4 text-primary" />Table of Contents</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${tocOpen ? "rotate-90" : ""}`} />
            </button>
            {tocOpen && toc.length > 0 && (
              <nav className="lg:hidden border border-border rounded-lg p-4 mb-6">
                <ol className="space-y-2">
                  {toc.map((heading, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground">
                      <span className="text-primary font-mono text-xs mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}.</span>
                      <span className="text-pretty">{heading}</span>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Article body */}
            <div className="prose-like">
              {article.content.map((block, i) => (
                <React.Fragment key={i}>
                  <RenderBlock block={block} />
                  {i === midpoint && <MidArticleCTA />}
                </React.Fragment>
              ))}
            </div>

            {/* FAQ section */}
            {article.faq.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-bold text-foreground mb-5">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {article.faq.map((f, i) => (
                    <div key={i} className="border border-border rounded-lg p-4">
                      <h3 className="font-semibold text-foreground text-sm mb-2">{f.q}</h3>
                      <p className="text-sm text-muted-foreground text-pretty">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data sources */}
            {article.dataSources.length > 0 && (
              <div className="mt-8 border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-primary" />Data Sources & References
                </h3>
                <ul className="space-y-1">
                  {article.dataSources.map((src, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />{src}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Author box */}
            <div className="mt-8 border border-border rounded-xl p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{article.author.name}</p>
                <p className="text-xs text-primary mb-2">{article.author.title}</p>
                <p className="text-xs text-muted-foreground text-pretty">{article.author.bio}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-success" />Last updated: {article.updatedDate}
                </p>
              </div>
            </div>

            {/* End of article CTA */}
            <div className="mt-8 border border-primary/20 bg-primary/5 rounded-xl p-6">
              <h2 className="text-xl font-bold text-foreground mb-2 text-balance">Start Mining Bitcoin Today</h2>
              <p className="text-sm text-muted-foreground mb-5 text-pretty">
                Access mining contracts backed by enterprise-grade infrastructure and transparent hashrate pricing.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                  <Link to="/pricing"><Zap className="w-4 h-4" />View Mining Plans</Link>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <Link to="/calculator"><BarChart3 className="w-4 h-4" />Calculate Profitability</Link>
                </Button>
              </div>
            </div>

            {/* Back link */}
            <div className="mt-6">
              <Button variant="ghost" className="text-muted-foreground gap-2" asChild>
                <Link to="/blog"><ArrowLeft className="w-4 h-4" />Back to Knowledge Center</Link>
              </Button>
            </div>
          </article>

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-5 w-64 shrink-0">
            {/* Sticky TOC */}
            {toc.length > 0 && (
              <div className="sticky top-20 border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <List className="w-3.5 h-3.5" />Table of Contents
                </h3>
                <ol className="space-y-2">
                  {toc.map((heading, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer group">
                      <span className="text-primary font-mono text-[10px] mt-0.5 shrink-0 group-hover:text-primary">
                        {String(i + 1).padStart(2, "0")}.
                      </span>
                      <span className="text-pretty leading-snug">{heading}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Article info</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{article.readTime} min read</p>
                    <p className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-success" />Fact checked</p>
                    <p className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3 text-primary" />Updated {article.updatedDate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map(tag => (
                    <Badge key={tag} className="bg-muted text-muted-foreground text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Related Articles ──────────────────────────────────────────────── */}
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-foreground mb-5">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`}>
                  <Card className="bg-card border-border overflow-hidden h-full hover:border-primary/30 transition-colors group">
                    <div className="aspect-[16/8] overflow-hidden">
                      <img src={r.image} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] mb-2">{r.category}</Badge>
                      <h3 className="font-bold text-sm text-foreground text-balance mb-1">{r.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{r.readTime} min</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Mobile CTA ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border px-4 py-3">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11" asChild>
          <Link to="/register"><Zap className="w-4 h-4" />🚀 Start Mining</Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  );
}
