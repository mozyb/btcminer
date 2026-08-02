import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PublicLayout from "@/components/layouts/PublicLayout";
import { knowledgeArticles, knowledgeCategories } from "@/lib/mockData";
import { useBtcStats } from "@/hooks/useBtcStats";
import PageMeta from "@/components/common/PageMeta";

import {
  Clock, Search, ChevronRight, BookOpen, Cpu, TrendingUp,
  BarChart3, Cloud, Globe, Star, Zap, ArrowRight, Users,
  CheckCircle, Activity, Gauge, Layers, RefreshCw,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  BookOpen, Cpu, TrendingUp, BarChart3, Cloud, Globe,
};

const FILTERS = ["All", "Most Recent", "Most Popular", "Trending", "Beginner", "Advanced"] as const;
type Filter = typeof FILTERS[number];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-success/10 text-success border-success/20",
  Intermediate: "bg-warning/10 text-warning border-warning/20",
  Advanced: "bg-destructive/10 text-destructive border-destructive/20",
};

// ── Live Stats Bar ────────────────────────────────────────────────────────────
function LiveStatsBar() {
  const btc = useBtcStats();
  const priceUp = btc.priceChange24h >= 0;
  const diffUp  = btc.difficultyChange >= 0;

  const fmt = (n: number, decimals = 0) =>
    n.toLocaleString("en-US", { maximumFractionDigits: decimals });

  const stats = [
    {
      icon: Activity,
      label: "BTC Price",
      value: btc.loading ? null : `$${fmt(btc.btcPrice)}`,
      sub: btc.loading ? null : `${priceUp ? "+" : ""}${btc.priceChange24h.toFixed(2)}%`,
      subColor: priceUp ? "text-success" : "text-destructive",
    },
    {
      icon: Zap,
      label: "Network Hashrate",
      value: btc.loading ? null : `${fmt(btc.networkHashrate, 1)} EH/s`,
      sub: "SHA-256",
      subColor: "text-muted-foreground",
    },
    {
      icon: Gauge,
      label: "Mining Difficulty",
      value: btc.loading ? null : `${fmt(btc.networkDifficulty, 1)} T`,
      sub: btc.loading || btc.difficultyChange === 0
        ? "Next adjustment"
        : `Next: ${diffUp ? "+" : ""}${btc.difficultyChange.toFixed(2)}%`,
      subColor: btc.difficultyChange === 0
        ? "text-muted-foreground"
        : diffUp ? "text-warning" : "text-success",
    },
    {
      icon: Layers,
      label: "Block Height",
      value: btc.loading ? null : `#${fmt(btc.blockHeight)}`,
      sub: `Reward: ${btc.blockReward} BTC`,
      subColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="border-b border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 mb-2 md:mb-0 md:hidden">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            Live Network Data
          </span>
          {btc.lastUpdated && (
            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5" />
              {btc.lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-0 md:divide-x md:divide-border">
          {/* Live badge — desktop only */}
          <div className="hidden md:flex items-center gap-2 pr-4 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
              Live Network
            </span>
          </div>

          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2 md:px-4 min-w-0">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">{s.label}</p>
                {s.value === null ? (
                  <Skeleton className="h-4 w-20 bg-muted mt-0.5" />
                ) : (
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">{s.value}</span>
                    {s.sub && (
                      <span className={`text-[10px] font-medium whitespace-nowrap ${s.subColor}`}>{s.sub}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Last updated — desktop */}
          {btc.lastUpdated && (
            <div className="hidden md:flex items-center gap-1.5 pl-4 ml-auto shrink-0 text-[10px] text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              <span>Updated {btc.lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const featuredArticle = knowledgeArticles.find(a => a.featured && a.popular);

  const filtered = useMemo(() => {
    let list = [...knowledgeArticles];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") {
      const cat = knowledgeCategories.find(c => c.id === activeCategory);
      if (cat) list = list.filter(a => cat.articles.includes(a.slug));
    }
    if (activeFilter === "Most Popular") list = list.filter(a => a.popular);
    if (activeFilter === "Trending") list = list.filter(a => a.trending);
    if (activeFilter === "Beginner") list = list.filter(a => a.level === "Beginner");
    if (activeFilter === "Advanced") list = list.filter(a => a.level === "Advanced");
    if (activeFilter === "Most Recent") list = [...list].sort((a, b) => b.updatedDate.localeCompare(a.updatedDate));
    return list;
  }, [query, activeCategory, activeFilter]);

  // Structured data
  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BTCMiner.online Knowledge Center",
    "url": "https://btcminer.online/blog",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://btcminer.online/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <PageMeta
      title="Bitcoin Mining Blog | News, Guides & Insights | BTCMiner.online"
      description="Stay up to date with Bitcoin mining news, tutorials, profitability guides, and insights. Expert articles on hashrate, difficulty, halving, and cloud mining."
      canonical="/blog"
      />
      <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchSchema) }} />

      {/* ── Hero Section ──────────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Knowledge Center</span>
          </nav>
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
            📚 Bitcoin Mining Knowledge Center
          </Badge>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 max-w-3xl text-balance">
            Learn Bitcoin Mining From Industry Experts
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-8 text-pretty">
            Master Bitcoin mining, ASIC hardware, profitability, hashrates, mining difficulty, and cloud mining through comprehensive educational guides. Access expert-written articles, tutorials, mining calculators, hardware reviews, and Bitcoin network analysis.
          </p>
          {/* Search */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What would you like to learn about Bitcoin mining?"
              className="pl-10 pr-4 h-11 bg-background"
            />
          </div>
          {/* Stats strip */}
          <div className="flex flex-wrap gap-5 mt-8">
            {[
              { icon: BookOpen,     label: `${knowledgeArticles.length} Articles` },
              { icon: Users,        label: "18,000+ Readers Monthly" },
              { icon: CheckCircle,  label: "Expert Fact-Checked" },
              { icon: Star,         label: "Updated Monthly" },
            ].map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="w-3.5 h-3.5 text-primary" />{s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Live Network Stats Bar ─────────────────────────────────────────────── */}
      <LiveStatsBar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* ── Featured Article ──────────────────────────────────────────────── */}
        {featuredArticle && !query && activeCategory === "all" && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4">Featured Guide</h2>
            <Link to={`/blog/${featuredArticle.slug}`}>
              <Card className="bg-card border-border overflow-hidden hover:border-primary/30 transition-colors group">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-2/5 aspect-[16/9] md:aspect-auto overflow-hidden">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{featuredArticle.category}</Badge>
                        <Badge className={`text-xs ${LEVEL_COLORS[featuredArticle.level]}`}>{featuredArticle.level}</Badge>
                        {featuredArticle.trending && <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">🔥 Trending</Badge>}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 text-balance">{featuredArticle.title}</h3>
                      <p className="text-muted-foreground text-pretty mb-4">{featuredArticle.excerpt}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featuredArticle.readTime} min read</span>
                        <span>{featuredArticle.author.name}</span>
                        <span>Updated {featuredArticle.updatedDate}</span>
                      </div>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0">
                        Read Guide <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* ── Category Cards ─────────────────────────────────────────────────── */}
        {!query && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveCategory("all")}
                className={`text-left border rounded-lg p-4 transition-colors ${activeCategory === "all" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className={`w-4 h-4 ${activeCategory === "all" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold text-sm ${activeCategory === "all" ? "text-primary" : "text-foreground"}`}>All Articles</span>
                </div>
                <p className="text-xs text-muted-foreground">{knowledgeArticles.length} articles across all topics</p>
              </button>
              {knowledgeCategories.map(cat => {
                const Icon = CATEGORY_ICONS[cat.icon] ?? BookOpen;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(isActive ? "all" : cat.id)}
                    className={`text-left border rounded-lg p-4 transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{cat.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Filter Tabs ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto whitespace-nowrap pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                activeFilter === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Article Grid ───────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium text-foreground">No articles found</p>
            <p className="text-sm mt-1">Try a different search term or category.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setActiveCategory("all"); setActiveFilter("All"); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} article{filtered.length !== 1 ? "s" : ""} found</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(article => (
                <Link key={article.id} to={`/blog/${article.slug}`}>
                  <Card className="bg-card border-border overflow-hidden h-full flex flex-col hover:border-primary/30 transition-colors group">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{article.category}</Badge>
                        <Badge className={`text-[10px] ${LEVEL_COLORS[article.level]}`}>{article.level}</Badge>
                        {article.trending && <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">🔥 Trending</Badge>}
                      </div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-2 text-balance flex-1">{article.title}</h3>
                      <p className="text-xs text-muted-foreground text-pretty line-clamp-2 mb-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground min-w-0">
                          <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3" />{article.readTime} min</span>
                          <span className="truncate">{article.author.name}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* ── Internal Links ─────────────────────────────────────────────────── */}
        <div className="mt-14 grid md:grid-cols-4 gap-4">
          {[
            { icon: Zap,       label: "Mining Plans",       href: "/pricing",     desc: "View hashrate contracts" },
            { icon: BarChart3, label: "Mining Calculator",  href: "/calculator",  desc: "Estimate your returns" },
            { icon: Globe,     label: "Mining Farms",       href: "/farms",       desc: "Our global infrastructure" },
            { icon: BookOpen,  label: "FAQ",                href: "/faq",         desc: "Common questions" },
          ].map(link => (
            <Link
              key={link.href}
              to={link.href}
              className="border border-border rounded-lg p-4 flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <link.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
        <div className="mt-12 text-center border border-primary/20 bg-primary/5 rounded-xl py-10 px-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 text-balance">Start Mining Bitcoin Today</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto text-pretty">
            Access mining contracts backed by enterprise-grade infrastructure and transparent hashrate pricing.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11" asChild>
              <Link to="/pricing"><Zap className="w-4 h-4" />View Mining Plans</Link>
            </Button>
            <Button variant="outline" className="h-11 gap-2" asChild>
              <Link to="/calculator"><BarChart3 className="w-4 h-4" />Calculate Profitability</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sticky Mobile CTA ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border px-4 py-3">
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11" asChild>
          <Link to="/register"><Zap className="w-4 h-4" />🚀 Start Mining</Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  </>
  );
}
