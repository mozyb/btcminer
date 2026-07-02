import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Zap, ArrowDownToLine, Shield, Info, DollarSign, BellOff } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  reward: Zap,
  mining_reward: Zap,
  deposit: ArrowDownToLine,
  deposit_confirmed: ArrowDownToLine,
  deposit_created: ArrowDownToLine,
  security: Shield,
  system: Info,
  commission: DollarSign,
  referral_bonus: DollarSign,
};

const typeColors: Record<string, string> = {
  reward: "text-primary",
  mining_reward: "text-primary",
  deposit: "text-success",
  deposit_confirmed: "text-success",
  deposit_created: "text-success",
  security: "text-destructive",
  system: "text-muted-foreground",
  commission: "text-warning",
  referral_bonus: "text-warning",
};

function fmtTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markAllRead = async () => {
    if (!user?.id) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems(n => n.map(i => ({ ...i, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems(n => n.map(i => i.id === id ? { ...i, read: true } : i));
  };

  const unread = items.filter(n => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Notifications
              {unread > 0 && <Badge className="bg-primary text-primary-foreground text-xs">{unread} new</Badge>}
            </h2>
            <p className="text-sm text-muted-foreground">{items.length} total notifications</p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" className="text-xs" onClick={markAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-muted rounded" />
            ))
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <BellOff className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground mb-1">No notifications yet</p>
              <p className="text-sm text-muted-foreground">You'll receive alerts here for deposits, mining rewards, and account activity.</p>
            </div>
          ) : (
            items.map(n => {
              const Icon = typeIcons[n.type] ?? Bell;
              const iconColor = typeColors[n.type] ?? "text-muted-foreground";
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded border transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/5 border-primary/20 hover:bg-primary/8" : "bg-card border-border hover:bg-muted/20"
                  }`}
                  onClick={() => markRead(n.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 text-pretty">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{fmtTime(n.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
