import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getContracts, isContractExpired, getContractEffectiveStatus, type Contract } from "@/lib/api";
import { FileText, Zap, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");

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

  const activeContracts = contracts.filter(c => getContractEffectiveStatus(c) === "active");
  const expiredContracts = contracts.filter(c => getContractEffectiveStatus(c) === "expired");
  const displayContracts = contracts.filter(c => {
    if (filter === "all") return true;
    return getContractEffectiveStatus(c) === filter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">My Mining Contracts</h2>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading contracts..."
                : `${activeContracts.length} active · ${expiredContracts.length} expired · ${contracts.length} total`}
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm self-start sm:self-auto" asChild>
            <Link to="/dashboard/marketplace"><Zap className="w-4 h-4" />Buy More Hashrate</Link>
          </Button>
        </div>

        {/* Filter Tabs */}
        {!loading && contracts.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border pb-2">
            {[
              { id: "all", label: `All (${contracts.length})` },
              { id: "active", label: `Active (${activeContracts.length})` },
              { id: "expired", label: `Expired (${expiredContracts.length})` },
            ].map(tab => (
              <Button
                key={tab.id}
                variant={filter === tab.id ? "default" : "ghost"}
                size="sm"
                className={`text-xs h-8 ${filter === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                onClick={() => setFilter(tab.id as "all" | "active" | "expired")}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        )}

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
        ) : displayContracts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No {filter !== "all" ? filter : ""} contracts found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "expired" ? "You do not have any expired mining contracts." : "You do not have any active mining contracts."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {displayContracts.map(c => {
              const effectiveStatus = getContractEffectiveStatus(c);
              const isExpired = effectiveStatus === "expired";
              const isLifetime = !c.expiry_date;
              const daysLeft = c.expiry_date ? getDaysLeft(c.expiry_date) : null;
              const totalDays = c.expiry_date ? getTotalDays(c.start_date, c.expiry_date) : 1;
              const progress = isExpired ? 100 : isLifetime ? 100 : Math.min(100, Math.max(2, ((totalDays - (daysLeft ?? 0)) / totalDays) * 100));

              return (
                <Card
                  key={c.id}
                  className={`bg-card border-border cursor-pointer hover:border-primary/40 transition-colors ${selected === c.id ? "border-primary/60" : ""} ${isExpired ? "opacity-90" : ""}`}
                  onClick={() => setSelected(selected === c.id ? null : c.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-foreground">{c.contract_name}</CardTitle>
                      <Badge className={`text-[10px] capitalize font-medium ${
                        effectiveStatus === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : isExpired
                          ? "bg-muted text-muted-foreground border-border"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {effectiveStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.algorithm} · {c.coin}{c.pool_allocation ? ` · ${c.pool_allocation}` : ""}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Hashrate</p>
                        <p className={`font-mono font-bold text-sm ${isExpired ? "text-muted-foreground" : "text-primary"}`}>{c.hashrate} {c.hashrate_unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rewards</p>
                        <p className="font-mono text-success text-sm">+{Number(c.rewards_generated).toFixed(5)} ₿</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className={`text-sm ${isExpired ? "text-muted-foreground font-medium" : "text-foreground"}`}>
                          {isExpired ? "Expired" : isLifetime ? "Lifetime" : `${daysLeft}d left`}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Contract progress</span>
                        <span>
                          {isExpired
                            ? "0 days remaining (Contract ended)"
                            : isLifetime
                            ? "Permanent allocation"
                            : `${daysLeft} days remaining`}
                        </span>
                      </div>
                      <Progress value={progress} className={`h-1.5 ${isExpired ? "opacity-50" : ""}`} />
                    </div>
                    {selected === c.id && (
                      <div className="border-t border-border pt-3 mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { label: "Start Date", val: c.start_date },
                            { label: "Expiry Date", val: c.expiry_date ?? "Lifetime" },
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
                          {isExpired ? (
                            <>
                              <Button size="sm" className="flex-1 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90" asChild onClick={e => e.stopPropagation()}>
                                <Link to="/dashboard/marketplace">
                                  <RefreshCw className="w-3 h-3" />Renew Plan
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" asChild onClick={e => e.stopPropagation()}>
                                <Link to="/dashboard/marketplace">
                                  <TrendingUp className="w-3 h-3" />New Contract
                                </Link>
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" asChild onClick={e => e.stopPropagation()}>
                                <Link to="/dashboard/marketplace">
                                  <RefreshCw className="w-3 h-3" />Extend
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs gap-1" asChild onClick={e => e.stopPropagation()}>
                                <Link to="/dashboard/marketplace">
                                  <TrendingUp className="w-3 h-3" />Upgrade
                                </Link>
                              </Button>
                            </>
                          )}
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

