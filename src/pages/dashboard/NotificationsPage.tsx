import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { notifications } from "@/lib/mockData";
import { Bell, Zap, ArrowDownToLine, Shield, Info, DollarSign } from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  reward: Zap,
  deposit: ArrowDownToLine,
  security: Shield,
  system: Info,
  commission: DollarSign,
};

const typeColors: Record<string, string> = {
  reward: "text-primary",
  deposit: "text-success",
  security: "text-destructive",
  system: "text-muted-foreground",
  commission: "text-warning",
};

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  const markAllRead = () => setItems(n => n.map(i => ({ ...i, read: true })));
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
          {items.map(n => {
            const Icon = typeIcons[n.type] ?? Bell;
            const iconColor = typeColors[n.type] ?? "text-muted-foreground";
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 p-4 rounded border transition-colors cursor-pointer ${
                  !n.read ? "bg-primary/5 border-primary/20 hover:bg-primary/8" : "bg-card border-border hover:bg-muted/20"
                }`}
                onClick={() => setItems(items.map(i => i.id === n.id ? { ...i, read: true } : i))}
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
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
