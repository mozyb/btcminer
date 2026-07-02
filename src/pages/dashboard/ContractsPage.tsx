import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getContracts, type Contract } from "@/lib/api";
import { FileText, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getContracts(user.id)
      .then(setContracts)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getDaysLeft = (expiryDate: string) =>
    Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000));

  const getTotalDays = (start: string, expiry: string) =>
    Math.max(1, Math.ceil((new Date(expiry).getTime() - new Date(start).getTime()) / 86400000));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">My Mining Contracts</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${contracts.filter(c => c.status === "active").length} active contract${contracts.filter(c => c.status === "active").length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" asChild>
            <Link to="/dashboard/marketplace"><Zap className="w-4 h-4" />Buy More Hashrate</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-40 bg-muted" />
                  <Skeleton className="h-4 w-24 bg-muted" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-10 bg-muted rounded" />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No contracts yet</p>
            <p className="text-sm text-muted-foreground mb-4">Purchase hashrate to start earning Bitcoin mining rewards</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/dashboard/marketplace">Browse Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {contracts.map(c => {
              const daysLeft = getDaysLeft(c.expiry_date);
              const totalDays = getTotalDays(c.start_date, c.expiry_date);
              const progress = Math.max(2, ((totalDays - daysLeft) / totalDays) * 100);
              return (
                <Card
                  key={c.id}
                  className={`bg-card border-border cursor-pointer hover:border-primary/40 transition-colors ${selected === c.id ? "border-primary/60" : ""}`}
                  onClick={() => setSelected(selected === c.id ? null : c.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-foreground">{c.contract_name}</CardTitle>
                      <Badge className={`text-[10px] ${c.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.algorithm} · {c.coin}{c.pool_allocation ? ` · ${c.pool_allocation}` : ""}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Hashrate</p>
                        <p className="font-mono font-bold text-primary text-sm">{c.hashrate} {c.hashrate_unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rewards</p>
                        <p className="font-mono text-success text-sm">+{Number(c.rewards_generated).toFixed(5)} ₿</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className="text-sm text-foreground">{daysLeft}d left</p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Contract progress</span>
                        <span>{daysLeft} days remaining</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    {selected === c.id && (
                      <div className="border-t border-border pt-3 mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { label: "Start Date", val: c.start_date },
                            { label: "Expiry Date", val: c.expiry_date },
                            { label: "Hardware", val: c.hardware ?? "—" },
                            { label: "Maintenance Paid", val: `-${Number(c.maintenance_paid).toFixed(5)} ₿` },
                          ].map(item => (
                            <div key={item.label}>
                              <p className="text-muted-foreground">{item.label}</p>
                              <p className="font-mono text-foreground">{item.val}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => toast.info("Contract extension coming soon.")}>
                            <RefreshCw className="w-3 h-3" />Extend
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" onClick={() => toast.info("Hashrate upgrade coming soon.")}>
                            <TrendingUp className="w-3 h-3" />Upgrade
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

