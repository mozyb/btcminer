import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Cpu, ChevronDown, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { label: "Marketplace", href: "/marketplace" },
  {
    label: "Mining", children: [
      { label: "Mining Farms", href: "/farms" },
      { label: "Mining Hardware", href: "/hardware" },
      { label: "Transparency Center", href: "/transparency" },
    ],
  },
  { label: "Calculator", href: "/calculator" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Learn", children: [
      { label: "Blog", href: "/blog" },
      { label: "FAQ", href: "/faq" },
      { label: "About Us", href: "/about" },
    ],
  },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled ? "bg-background/95 backdrop-blur border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">
              BTC<span className="text-primary">Miner</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <DropdownMenu key={link.label}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-1 text-muted-foreground hover:text-foreground text-sm">
                      {link.label}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {link.children.map((child) => (
                      <DropdownMenuItem key={child.href} asChild>
                        <Link to={child.href}>{child.label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button key={link.href} variant="ghost" className="text-muted-foreground hover:text-foreground text-sm" asChild>
                  <Link to={link.href!}>{link.label}</Link>
                </Button>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground text-sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/register">Start Mining</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-sidebar p-0">
              <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                <span className="font-bold text-sidebar-foreground">
                  BTC<span className="text-primary">Miner</span>
                </span>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <nav className="p-4 flex flex-col gap-1">
                {navLinks.map((link) =>
                  link.children ? (
                    <div key={link.label}>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground px-2 py-2">{link.label}</p>
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="block px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      key={link.href}
                      to={link.href!}
                      className="block px-3 py-2 rounded text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                    >
                      {link.label}
                    </Link>
                  )
                )}
                <div className="border-t border-sidebar-border mt-4 pt-4 flex flex-col gap-2">
                  <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link to="/register">Start Mining</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pt-16">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        {/* Trust strip */}
        <div className="border-b border-border bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {[
                { icon: "🔒", label: "SSL Secured" },
                { icon: "🛡", label: "DDoS Protected" },
                { icon: "💾", label: "Daily Backups" },
                { icon: "🎧", label: "24/7 Support" },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">BTC<span className="text-primary">Miner</span>.online</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-[180px] text-pretty">
                Enterprise-grade cloud mining infrastructure. Real hashrate, real rewards.
              </p>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company</p>
              <ul className="space-y-2">
                {[
                  { label: "About BTCMiner",  href: "/about" },
                  { label: "Contact Us",      href: "/contact" },
                  { label: "Careers",         href: "/about" },
                  { label: "Partners",        href: "/about" },
                ].map(l => <li key={l.href}><Link to={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>)}
              </ul>
            </div>

            {/* Mining */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Mining</p>
              <ul className="space-y-2">
                {[
                  { label: "Mining Plans",       href: "/pricing" },
                  { label: "Hashrate Market",    href: "/marketplace" },
                  { label: "ASIC Hardware",      href: "/hardware" },
                  { label: "Mining Farms",       href: "/farms" },
                ].map(l => <li key={l.href}><Link to={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>)}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resources</p>
              <ul className="space-y-2">
                {[
                  { label: "Knowledge Center",  href: "/blog" },
                  { label: "Profit Calculator", href: "/calculator" },
                  { label: "FAQ",               href: "/faq" },
                  { label: "Network Stats",     href: "/transparency" },
                ].map(l => <li key={l.href}><Link to={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>)}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  { label: "Terms of Service",  href: "/terms" },
                  { label: "Privacy Policy",    href: "/privacy" },
                  { label: "Risk Disclosure",   href: "/risk" },
                  { label: "AML/KYC Policy",   href: "/aml" },
                ].map(l => <li key={l.href}><Link to={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>)}
              </ul>
            </div>

            {/* Community */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Community</p>
              <ul className="space-y-2">
                {[
                  { label: "Telegram",  href: "#" },
                  { label: "X (Twitter)", href: "#" },
                  { label: "Discord",   href: "#" },
                  { label: "YouTube",   href: "#" },
                ].map(l => <li key={l.label}><a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l.label}</a></li>)}
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 BTCMiner.online. All rights reserved.</p>
            <p className="text-xs text-muted-foreground text-center text-pretty">
              Cloud mining involves risk. Mining output depends on network difficulty and cryptocurrency prices.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
