import React, { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, ShoppingCart, BarChart3, Wallet,
  ArrowDownToLine, ArrowUpFromLine, History, Users, Shield,
  Bell, Settings, HelpCircle, LogOut, Menu, Cpu, X, ChevronRight, Coins,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: FileText, label: "My Contracts", href: "/dashboard/contracts" },
  { icon: ShoppingCart, label: "Marketplace", href: "/dashboard/marketplace" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Coins, label: "My Rewards", href: "/dashboard/rewards" },
  { label: "—", divider: true },
  { icon: Wallet, label: "Wallet", href: "/dashboard/wallet" },
  { icon: ArrowDownToLine, label: "Deposit", href: "/dashboard/deposit" },
  { icon: ArrowUpFromLine, label: "Withdraw", href: "/dashboard/withdraw" },
  { icon: History, label: "Transactions", href: "/dashboard/transactions" },
  { label: "—", divider: true },
  { icon: Users, label: "Affiliate", href: "/dashboard/affiliate" },
  { icon: Shield, label: "KYC", href: "/dashboard/kyc" },
  { icon: HelpCircle, label: "Support", href: "/dashboard/support" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications", badge: 2 },
  { label: "—", divider: true },
  { icon: Settings, label: "Account", href: "/dashboard/settings" },
  { icon: Shield, label: "Security", href: "/dashboard/security" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
        <Link to="/" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground text-sm">
            BTC<span className="text-primary">Miner</span>
          </span>
        </Link>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navItems.map((item, idx) => {
          if ("divider" in item && item.divider) {
            return <div key={idx} className="my-1.5 border-t border-sidebar-border" />;
          }
          const isActive = location.pathname === item.href;
          const Icon = item.icon!;
          return (
            <Link
              key={item.href}
              to={item.href!}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors min-h-[36px] ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{item.label}</span>
              {item.badge ? (
                <Badge className="bg-primary text-primary-foreground text-xs h-4 px-1.5">{item.badge}</Badge>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-sidebar-border shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function EmailVerificationBanner() {
  const [resending, setResending] = useState(false);
  const { session } = useAuth();
  const email = session?.user?.email ?? "";

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setResending(false);
    if (error) toast.error("Could not resend: " + error.message);
    else toast.success("Verification email resent — check your inbox.");
  };

  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <span className="text-warning text-xs font-medium flex-1 min-w-0">
        ⚠️ Please verify your email address to access all features. Check your inbox for a verification link.
      </span>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 h-7 text-xs border-warning/50 text-warning hover:bg-warning/10"
        onClick={handleResend}
        disabled={resending}
      >
        {resending ? "Sending…" : "Resend email"}
      </Button>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, session, loading } = useAuth();

  // Defense-in-depth: require authentication
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-32 bg-muted" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const isEmailVerified = !!session?.user?.email_confirmed_at;
  const pageTitle = navItems.find(item => "href" in item && item.href === location.pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-56 bg-sidebar">
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">{pageTitle}</h1>
          <Button variant="ghost" size="icon" className="text-muted-foreground" asChild>
            <Link to="/dashboard/notifications">
              <Bell className="w-4 h-4" />
            </Link>
          </Button>
        </header>

        {/* Email verification banner */}
        {!isEmailVerified && <EmailVerificationBanner />}

        {/* Page */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
