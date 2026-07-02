import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWallets, getPublicContractTemplates,
  notifyAdmin, notifyUser,
  type Wallet, type ContractTemplate,
} from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { useMiningStats, type MiningPoolOption, type MiningFarmOption } from "@/hooks/useMiningStats";
import { supabase } from "@/db/supabase";
import { Search, Zap, AlertCircle, MapPin, Server, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function DashboardMarketplace() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const { pools, farms } = useMiningStats();
  const [search, setSearch]       = useState("");
  const [algorithm, setAlgorithm] = useState("all");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [wallets, setWallets]     = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // Purchase confirmation modal state
  const [purchaseModal, setPurchaseModal] = useState<ContractTemplate | null>(null);
  const [selectedPool, setSelectedPool]   = useState<MiningPoolOption | null>(null);
  const [selectedFarm, setSelectedFarm]   = useState<MiningFarmOption | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getWallets(user.id).then(setWallets).finally(() => setWalletsLoading(false));
  }, [user?.id]);

  useEffect(() => {
    getPublicContractTemplates()
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setContractsLoading(false));
  }, []);

  // Auto-select pool/farm when modal opens (pick first matching)
  useEffect(() => {
    if (!purchaseModal) { setSelectedPool(null); setSelectedFarm(null); return; }
    const matchingPools = pools.filter(p => p.algorithm === purchaseModal.algorithm || p.algorithm === "SHA-256");
    const firstPool = purchaseModal.mining_pool
      ? (matchingPools.find(p => p.name === purchaseModal.mining_pool) ?? matchingPools[0] ?? null)
      : matchingPools[0] ?? null;
    setSelectedPool(firstPool);
    setSelectedFarm(farms[0] ?? null);
  }, [purchaseModal, pools, farms]);

  const btcWallet = wallets.find(w => w.currency === "BTC");
  const btcBalanceUSD = btcWallet ? btcWallet.balance * btc.btcPrice : 0;
  const algorithms = [...new Set(contracts.map(c => c.algorithm))];

  const filtered = contracts.filter(c => {
    const matchS = c.name.toLowerCase().includes(search.toLowerCase());
    const matchA = algorithm === "all" || c.algorithm === algorithm;
    return matchS && matchA;
  });

  const openPurchaseModal = (ct: ContractTemplate) => {
    if (!user?.id) { toast.error("Please log in first."); return; }
    const price = ct.promotional_price ?? ct.discount_price ?? ct.price;
    if (price > btcBalanceUSD) {
      toast.error("Insufficient balance. Please deposit funds first.");
      return;
    }
    setPurchaseModal(ct);
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseModal || !user?.id) return;
    const ct    = purchaseModal;
    const price = ct.promotional_price ?? ct.discount_price ?? ct.price;
    setPurchasing(ct.id);
    setPurchaseModal(null);
    try {
      const startDate  = new Date();
      const expiryDate = new Date(startDate);
      if (!ct.is_lifetime) expiryDate.setDate(expiryDate.getDate() + (ct.duration ?? 365));

      const { error } = await supabase.from("contracts").insert({
        user_id:             user.id,
        contract_name:       ct.name,
        algorithm:           ct.algorithm,
        coin:                ct.coin,
        hashrate:            ct.hashrate,
        hashrate_unit:       ct.hashrate_unit,
        maintenance_fee_rate: ct.maintenance_fee ?? 0.0028,
        pool_allocation:     selectedPool?.name ?? ct.mining_pool ?? "BTCMiner Pool",
        hardware:            ct.hardware ?? "Antminer S21",
        status:              "active",
        start_date:          startDate.toISOString().split("T")[0],
        expiry_date:         ct.is_lifetime ? null : expiryDate.toISOString().split("T")[0],
        rewards_generated:   0,
        maintenance_paid:    0,
        price_paid:          price,
        mining_farm_id:      selectedFarm?.id ?? null,
        template_id:         ct.id,
      });
      if (error) throw error;

      // Deduct from BTC wallet
      if (btcWallet) {
        const priceInBtc = price / btc.btcPrice;
        await supabase.from("wallets")
          .update({ balance: Math.max(0, btcWallet.balance - priceInBtc) })
          .eq("id", btcWallet.id);
        setWallets(ws => ws.map(w =>
          w.id === btcWallet.id ? { ...w, balance: Math.max(0, w.balance - priceInBtc) } : w
        ));
      }

      // Notifications — non-blocking
      notifyAdmin({
        type:          "contract_purchased",
        user_id:       user.id,
        user_email:    user.email,
        contract_name: ct.name,
        hashrate:      `${ct.hashrate} ${ct.hashrate_unit}`,
        duration:      ct.is_lifetime ? "Lifetime" : `${ct.duration} days`,
        amount:        price,
        pool_name:     selectedPool?.name ?? ct.mining_pool ?? "—",
        farm_name:     selectedFarm?.name ?? ct.mining_farm ?? "—",
        payment_method: "BTC Wallet Balance",
      });
      notifyUser({
        type:          "contract_purchased",
        user_id:       user.id,
        user_email:    user.email,
        contract_name: ct.name,
        hashrate:      `${ct.hashrate} ${ct.hashrate_unit}`,
        duration:      ct.is_lifetime ? "Lifetime" : `${ct.duration} days`,
        amount:        price,
        pool_name:     selectedPool?.name ?? ct.mining_pool ?? "—",
        farm_name:     selectedFarm?.name ?? ct.mining_farm ?? "—",
      });

      toast.success("Contract purchased! Mining starts immediately.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const loading = contractsLoading || walletsLoading;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Hashrate Marketplace</h2>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              Balance:{" "}
              {walletsLoading ? (
                <Skeleton className="h-4 w-20 bg-muted" />
              ) : (
                <span className="font-mono text-primary">
                  ${btcBalanceUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              )}{" "}USD
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded text-xs">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-muted-foreground">
            Mining rewards are not guaranteed. Output depends on network difficulty and BTC price.{" "}
            <a href="/risk" className="text-primary underline">Risk Disclosure</a>.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 text-sm" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger className="w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Algorithms</SelectItem>
              {algorithms.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground text-sm">No contracts found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => {
              const price = c.promotional_price ?? c.discount_price ?? c.price;
              const hasDiscount = c.promotional_price != null || c.discount_price != null;
              return (
                <Card key={c.id} className={`bg-card border-border h-full flex flex-col ${c.featured ? "border-primary/40" : ""}`}>
                  {c.featured && (
                    <div className="bg-primary/10 border-b border-primary/20 px-4 py-1 text-xs text-primary font-medium">
                      ⭐ Popular
                    </div>
                  )}
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{c.display_name ?? c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.algorithm} · {c.coin}</p>
                      </div>
                      <Badge className="bg-muted text-muted-foreground shrink-0 text-xs">
                        {c.is_lifetime ? "∞" : `${c.duration}d`}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div>
                        <p className="text-muted-foreground">Hashrate</p>
                        <p className="font-mono font-bold text-foreground">{c.hashrate} {c.hashrate_unit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Maintenance</p>
                        <p className="font-mono text-foreground">${c.maintenance_fee}/TH/d</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-mono text-success">{c.remaining_capacity} slots</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Daily</p>
                        <p className="font-mono text-foreground">{c.estimated_daily_reward.toFixed(6)} BTC</p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Price</p>
                        {hasDiscount && (
                          <p className="text-xs line-through text-muted-foreground">${c.price.toLocaleString()}</p>
                        )}
                        <p className="text-lg font-bold font-mono text-primary">${price.toLocaleString()}</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs"
                        disabled={purchasing === c.id || loading || c.remaining_capacity <= 0}
                        onClick={() => openPurchaseModal(c)}
                      >
                        <Zap className="w-3 h-3" />
                        {purchasing === c.id ? "Processing…" : c.remaining_capacity <= 0 ? "Sold Out" : "Purchase"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Purchase Confirmation Modal with Pool + Farm Selection ────────── */}
      <Dialog open={!!purchaseModal} onOpenChange={v => !v && setPurchaseModal(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Confirm Contract Purchase
            </DialogTitle>
          </DialogHeader>

          {purchaseModal && (() => {
            const ct     = purchaseModal;
            const price  = ct.promotional_price ?? ct.discount_price ?? ct.price;
            const daily  = ct.estimated_daily_reward;
            const matchingPools = pools.filter(p => p.algorithm === ct.algorithm || p.algorithm === "SHA-256");

            return (
              <div className="space-y-4">
                {/* Contract summary */}
                <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-semibold text-foreground">{ct.display_name ?? ct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hashrate</span>
                    <span className="font-mono text-foreground">{ct.hashrate} {ct.hashrate_unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono text-foreground">{ct.is_lifetime ? "Lifetime" : `${ct.duration} days`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Daily</span>
                    <span className="font-mono text-primary">{daily.toFixed(6)} BTC</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Total Price</span>
                    <span className="font-bold text-primary text-base">${price.toLocaleString()}</span>
                  </div>
                </div>

                {/* Mining Pool selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Server className="w-3 h-3" />
                    Mining Pool
                    {matchingPools.length === 1 && (
                      <Badge className="text-xs bg-muted text-muted-foreground border-border ml-1">Auto-assigned</Badge>
                    )}
                  </Label>
                  {matchingPools.length > 0 ? (
                    <div className="space-y-2">
                      {matchingPools.map(pool => (
                        <button
                          key={pool.id}
                          type="button"
                          onClick={() => setSelectedPool(pool)}
                          className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                            selectedPool?.id === pool.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selectedPool?.id === pool.id && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                              <span className="font-medium text-foreground">{pool.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                              <span>{pool.fee}% fee</span>
                              <span>·</span>
                              <span className="text-success">{pool.uptime}% uptime</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-6">{pool.location} · {pool.hashrate_eh.toFixed(0)} EH/s · {pool.workers.toLocaleString()} workers</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      BTCMiner Pool (default) — managed by BTCMiner.online
                    </p>
                  )}
                </div>

                {/* Mining Farm selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Mining Farm
                    {farms.length === 1 && (
                      <Badge className="text-xs bg-muted text-muted-foreground border-border ml-1">Auto-assigned</Badge>
                    )}
                  </Label>
                  {farms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {farms.map(farm => (
                        <button
                          key={farm.id}
                          type="button"
                          onClick={() => setSelectedFarm(farm)}
                          className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                            selectedFarm?.id === farm.id
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/20 hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {selectedFarm?.id === farm.id && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                            <span className="font-medium text-xs text-foreground">{farm.flag} {farm.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{farm.country}</p>
                          <p className="text-xs text-muted-foreground">{farm.power_source}</p>
                          <p className="text-xs text-success">{farm.uptime}% uptime</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      Farm location will be assigned automatically.
                    </p>
                  )}
                </div>

                {/* Balance check */}
                <div className="flex justify-between text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                  <span>Account balance</span>
                  <span className="font-mono">${btcBalanceUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setPurchaseModal(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={handleConfirmPurchase}
              disabled={!purchaseModal}
            >
              <Zap className="w-4 h-4" />
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
