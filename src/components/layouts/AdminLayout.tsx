import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard, Users, FileText, Server, Cpu, Wallet,
  ArrowDownToLine, ArrowUpFromLine, Link2, UserCheck, LifeBuoy,
  Search, Lock, Bell, Settings, LogOut, Menu, Shield,
  BookOpen, Activity, X, Cpu as CpuIcon, ChevronRight, CreditCard, ScanEye,
  Star, HelpCircle, PenSquare, CheckCircle, BarChart3, ShoppingBag,
  Mail, MailCheck, ListOrdered, BarChart2, Send, TestTube, SlidersHorizontal, Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";

type NavItem =
  | { divider: true; label: string }
  | { divider?: false; icon: React.FC<{ className?: string }>; label: string; href: string; badgeKey?: "deposits" | "withdrawals" };

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { label: "Management", divider: true },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: ScanEye, label: "User Portal", href: "/admin/user-portal" },
  { icon: Activity, label: "Reward Jobs", href: "/admin/reward-jobs" },
  { icon: FileText, label: "Contracts", href: "/admin/contracts" },
  { icon: Server, label: "Mining Farms", href: "/admin/farms" },
  { icon: Cpu, label: "Hardware", href: "/admin/hardware" },
  { label: "Finance", divider: true },
  { icon: Wallet, label: "Wallets", href: "/admin/wallets" },
  { icon: ArrowDownToLine, label: "Deposits", href: "/admin/deposits", badgeKey: "deposits" },
  { icon: ArrowUpFromLine, label: "Withdrawals", href: "/admin/withdrawals", badgeKey: "withdrawals" },
  { icon: CreditCard, label: "Payment Methods", href: "/admin/payment-methods" },
  { label: "Systems", divider: true },
  { icon: Link2, label: "API Management", href: "/admin/apis" },
  { icon: Users, label: "Affiliate", href: "/admin/affiliate" },
  { icon: UserCheck, label: "KYC", href: "/admin/kyc" },
  { icon: LifeBuoy, label: "Support", href: "/admin/support" },
  { label: "Content", divider: true },
  { icon: BookOpen,    label: "CMS",            href: "/admin/cms" },
  { icon: Search,      label: "SEO",            href: "/admin/seo" },
  { icon: PenSquare,   label: "Blog / Knowledge", href: "/admin/blog" },
  { icon: HelpCircle,  label: "FAQ",            href: "/admin/faq" },
  { icon: Star,        label: "Reviews",        href: "/admin/reviews" },
  { icon: CheckCircle, label: "Payout Proofs",  href: "/admin/payout-proofs" },
  { icon: BarChart3,   label: "Platform Stats", href: "/admin/platform-stats" },
  { icon: ShoppingBag, label: "Marketplace CMS", href: "/admin/marketplace" },
  { icon: BarChart3,   label: "Calculator CMS",  href: "/admin/calculator" },
  { label: "System", divider: true },
  { icon: Lock, label: "Roles & Perms", href: "/admin/roles" },
  { icon: Bell, label: "Notifications", href: "/admin/notifications" },
  { icon: Activity, label: "Audit Logs", href: "/admin/audit" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
  { label: "Email Center", divider: true },
  { icon: Mail,             label: "Providers",     href: "/admin/email/providers" },
  { icon: Layers,           label: "Templates",     href: "/admin/email/templates" },
  { icon: ListOrdered,      label: "Queue Monitor", href: "/admin/email/queue" },
  { icon: MailCheck,        label: "Delivery Logs", href: "/admin/email/logs" },
  { icon: BarChart2,        label: "Analytics",     href: "/admin/email/analytics" },
  { icon: Send,             label: "Campaigns",     href: "/admin/email/campaigns" },
  { icon: TestTube,         label: "Test Center",   href: "/admin/email/test" },
  { icon: SlidersHorizontal,label: "Email Settings",href: "/admin/email/settings" },
];

function usePendingCounts() {
  const [counts, setCounts] = useState({ deposits: 0, withdrawals: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("type")
        .eq("status", "pending");
      if (!data) return;
      const deposits = data.filter(r => r.type === "deposit").length;
      const withdrawals = data.filter(r => r.type === "withdrawal").length;
      setCounts({ deposits, withdrawals });
    };
    fetchCounts();
    // Poll every 30 s
    const interval = setInterval(fetchCounts, 30000);
    // Realtime subscription for instant updates
    const channel = supabase
      .channel("pending-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchCounts)
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  return counts;
}

function AdminSidebarContent({ onClose, pendingCounts }: { onClose?: () => void; pendingCounts: { deposits: number; withdrawals: number } }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <CpuIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sidebar-foreground text-sm">BTC<span className="text-primary">Miner</span></span>
            <Badge className="ml-1.5 text-[10px] h-4 px-1 bg-destructive text-destructive-foreground">Admin</Badge>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {adminNavItems.map((item, idx) => {
          if ("divider" in item && item.divider) {
            return (
              <div key={idx} className="mt-3 mb-1 px-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{item.label}</p>
              </div>
            );
          }
          const isActive = location.pathname === item.href;
          const Icon = item.icon!;
          const liveCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              to={item.href!}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors min-h-[34px] ${
                isActive
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 min-w-0 truncate">{item.label}</span>
              {liveCount > 0 ? (
                <Badge className="bg-destructive text-destructive-foreground text-[10px] h-4 px-1.5">{liveCount}</Badge>
              ) : isActive ? (
                <ChevronRight className="w-3 h-3 shrink-0" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
          <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary font-medium">Super Admin</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAdmin, loading } = useAuth();
  const pendingCounts = usePendingCounts();

  // Defense-in-depth: block unauthenticated / non-admin at layout level
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-4 w-32 bg-muted" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const pageTitle = adminNavItems.find(item => "href" in item && item.href === location.pathname)?.label ?? "Admin";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-sidebar border-r border-sidebar-border">
        <AdminSidebarContent pendingCounts={pendingCounts} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-52 bg-sidebar">
          <AdminSidebarContent onClose={() => setMobileOpen(false)} pendingCounts={pendingCounts} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground flex-1 min-w-0 truncate">Admin — {pageTitle}</h1>
          <Badge className="bg-destructive/20 text-destructive border border-destructive/30 text-xs hidden md:flex">
            Admin Panel
          </Badge>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
