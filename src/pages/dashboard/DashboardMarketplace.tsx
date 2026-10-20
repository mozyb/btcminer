import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWallets, getPublicContractTemplates,
  notifyAdmin, notifyUser, isStarterPlan, hasUserPurchasedStarterPlan,
  type Wallet, type ContractTemplate,
} from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { useMiningStats, type MiningPoolOption, type MiningFarmOption } from "@/hooks/useMiningStats";
import { supabase } from "@/db/supabase";
import { Search, Zap, AlertCircle, MapPin, Server, CheckCircle2, Tag, X, RefreshCw, Wallet as WalletIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AppliedPromo {
  id: string;
  name: string;
  promo_type: string;
  discount_value: number | null;
  bonus_hashpower_th: number | null;
  coupon_code: string | null;
}

export default function DashboardMarketplace() {
  const { user, isImpersonating } = useAuth();
  const btc = useBtcStats();
  const { pools, farms } = useMiningStats();
  const [search, setSearch]       = useState("");
  const [algorithm, setAlgorithm] = useState("all");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [wallets, setWallets]     = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [hasPurchasedStarter, setHasPurchasedStarter] = useState(false);
  const [contracts, setContracts] = useState<ContractTemplate[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // Purchase confirmation modal state
  const [purchaseModal, setPurchaseModal] = useState<ContractTemplate | null>(null);
  const [selectedPool, setSelectedPool]   = useState<MiningPoolOption | null>(null);
  const [selectedFarm, setSelectedFarm]   = useState<MiningFarmOption | null>(null);

  // Coupon/promo state
  const [couponInput, setCouponInput]     = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedPromo, setAppliedPromo]   = useState<AppliedPromo | null>(null);
  const [autoPromo, setAutoPromo]         = useState<AppliedPromo | null>(null);
  const couponInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) {
      setHasPurchasedStarter(false);
      return;
    }
    getWallets(user.id).then(setWallets).finally(() => setWalletsLoading(false));
    hasUserPurchasedStarterPlan(user.id).then(setHasPurchasedStarter).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    getPublicContractTemplates()
      .then(setContracts)
      .catch(() => setContracts([]))
      .finally(() => setContractsLoading(false));
  }, []);

  // Auto-select pool/farm when modal opens (pick first matching)
  useEffect(() => {
    if (!purchaseModal) {
      setSelectedPool(null);
      setSelectedFarm(null);
      setCouponInput("");
      setAppliedPromo(null);
      setAutoPromo(null);
      return;
    }
    const matchingPools = pools.filter(p => p.algorithm === purchaseModal.algorithm || p.algorithm === "SHA-256");
    const firstPool = purchaseModal.mining_pool
      ? (matchingPools.find(p => p.name === purchaseModal.mining_pool) ?? matchingPools[0] ?? null)
      : matchingPools[0] ?? null;
    setSelectedPool(firstPool);
    setSelectedFarm(farms[0] ?? null);

    // Auto-apply any active promotions for this user
    if (user?.id) {
      supabase.functions.invoke("marketing-automation", {
        body: { action: "auto_apply_promotion", user_id: user.id, contract_price: purchaseModal.price },
      }).then(({ data }) => {
        if (data?.promotion) setAutoPromo(data.promotion as AppliedPromo);
      });
    }
  }, [purchaseModal, pools, farms, user?.id]);

  const totalPortfolioUSD = wallets.reduce((s, w) => s + btc.toUsd(Number(w.balance) || 0, w.currency), 0);
  const fundedWallets = wallets.filter(w => (Number(w.balance) || 0) > 0);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("portfolio");
  const algorithms = [...new Set(contracts.map(c => c.algorithm).filter(Boolean))];

  // Compute final price after promo
  const computeFinalPrice = (basePrice: number, promo: AppliedPromo | null): number => {
    if (!promo) return basePrice;
    if (promo.promo_type === "percentage" || promo.promo_type === "maintenance_discount") {
      return Math.max(0, basePrice * (1 - (promo.discount_value ?? 0) / 100));
    }
    if (promo.promo_type === "fixed") {
      return Math.max(0, basePrice - (promo.discount_value ?? 0));
    }
    return basePrice;
  };

  const activePromo = appliedPromo ?? autoPromo;

  const applyCoupon = async () => {
    if (!couponInput.trim() || !purchaseModal) return;
    setCouponLoading(true);
    const { data, error } = await supabase.functions.invoke("marketing-automation", {
      body: {
        action: "validate_promotion",
        coupon_code: couponInput.trim().toUpperCase(),
        user_id: user?.id,
        contract_price: purchaseModal.price,
      },
    });
    setCouponLoading(false);
    if (error || !data?.valid) {
      toast.error(data?.error ?? "Invalid or expired coupon code");
      return;
    }
    setAppliedPromo(data.promotion as AppliedPromo);
    setAutoPromo(null);
    toast.success(`Coupon applied: ${data.promotion.name}`);
  };

  const removeCoupon = () => {
    setAppliedPromo(null);
    setCouponInput("");
  };

  const filtered = contracts.filter(c => {
    const matchS = c.name.toLowerCase().includes(search.toLowerCase());
    const matchA = algorithm === "all" || c.algorithm === algorithm;
    return matchS && matchA;
  });

  const openPurchaseModal = async (ct: ContractTemplate) => {
    if (!user?.id) { toast.error("Please log in first."); return; }
    
    // Check Starter SHA-256 single-purchase limit
    if (isStarterPlan(ct) && hasPurchasedStarter) {
      toast.error("Starter SHA-256 is strictly limited to 1 purchase per account. You have already claimed this plan.");
      return;
    }

    // Open modal immediately
    setPurchaseModal(ct);

    const basePrice = Number(ct.promotional_price ?? ct.discount_price ?? ct.price) || 0;

    // Refresh wallet balances from database to ensure fresh real-time balance
    try {
      const fresh = await getWallets(user.id);
      if (fresh && fresh.length > 0) {
        setWallets(fresh);

        // Intelligent auto-selection:
        // 1. Check if user has a wallet matching the contract coin with sufficient balance
        const coinUpper = (ct.coin || "").toUpperCase();
        const matchingWallet = fresh.find(w => {
          const wCur = (w.currency || "").toUpperCase();
          const isMatch = wCur === coinUpper || (coinUpper === "BITCOIN" && wCur === "BTC") || (coinUpper === "ETHEREUM" && wCur === "ETH") || (coinUpper === "LITECOIN" && wCur === "LTC") || (coinUpper === "DOGECOIN" && wCur === "DOGE");
          const usd = btc.toUsd(Number(w.balance) || 0, w.currency);
          return isMatch && usd + 0.05 >= basePrice;
        });

        if (matchingWallet) {
          setSelectedWalletId(matchingWallet.id);
          return;
        }

        // 2. Check if ANY single wallet has sufficient balance (pick highest balance)
        const sortedWallets = [...fresh].sort((a, b) => btc.toUsd(Number(b.balance) || 0, b.currency) - btc.toUsd(Number(a.balance) || 0, a.currency));
        const highestWallet = sortedWallets[0];
        if (highestWallet && btc.toUsd(Number(highestWallet.balance) || 0, highestWallet.currency) + 0.05 >= basePrice) {
          setSelectedWalletId(highestWallet.id);
          return;
        }

        // 3. Otherwise default to "portfolio"
        setSelectedWalletId("portfolio");
        return;
      }
    } catch (e) {
      console.warn("[DashboardMarketplace] Failed to refresh wallets on open:", e);
    }

    // Default to portfolio if refresh failed or no single wallet is sufficient
    setSelectedWalletId("portfolio");
  };

  const handleConfirmPurchase = async () => {
    if (!purchaseModal || !user?.id) return;
    const ct        = purchaseModal;
    const basePrice = Number(ct.promotional_price ?? ct.discount_price ?? ct.price) || 0;
    const isComplimentary = isImpersonating && selectedWalletId === "admin_complimentary";
    const finalPrice = isComplimentary ? 0 : (Number(computeFinalPrice(basePrice, activePromo)) || 0);
    
    // Balance validation with floating point tolerance
    let selectedAvailableUSD = totalPortfolioUSD;
    let effectiveWalletId = selectedWalletId;

    // Enforce 1-purchase limit for Starter SHA-256
    if (isStarterPlan(ct)) {
      const alreadyClaimed = await hasUserPurchasedStarterPlan(user.id);
      if (alreadyClaimed) {
        toast.error("Starter SHA-256 is strictly limited to 1 purchase per account. You have already claimed this plan.");
        setHasPurchasedStarter(true);
        setPurchaseModal(null);
        return;
      }
    }

    if (!isComplimentary) {
      if (selectedWalletId !== "portfolio") {
        const targetWallet = wallets.find(w => w.id === selectedWalletId || w.currency === selectedWalletId);
        selectedAvailableUSD = targetWallet ? btc.toUsd(Number(targetWallet.balance) || 0, targetWallet.currency) : 0;
      }

      // If selected wallet doesn't have enough, but overall portfolio DOES have enough:
      // Automatically fall back to portfolio so the user's purchase succeeds seamlessly!
      if (selectedAvailableUSD + 0.05 < finalPrice) {
        if (totalPortfolioUSD + 0.05 >= finalPrice) {
          effectiveWalletId = "portfolio";
          selectedAvailableUSD = totalPortfolioUSD;
        } else {
          const shortfall = Math.max(0, finalPrice - totalPortfolioUSD);
          toast.error(`Insufficient total balance. Have $${totalPortfolioUSD.toFixed(2)} USD, need $${finalPrice.toFixed(2)} USD ($${shortfall.toFixed(2)} USD required). Please deposit funds.`);
          return;
        }
      }
    }

    setPurchasing(ct.id);
    try {
      const startDate  = new Date();
      const expiryDate = new Date(startDate);
      if (!ct.is_lifetime) expiryDate.setDate(expiryDate.getDate() + (ct.duration ?? 365));

      const { error } = await supabase.from("contracts").insert({
        user_id:              user.id,
        contract_name:        ct.name,
        algorithm:            ct.algorithm,
        coin:                 ct.coin,
        hashrate:             ct.hashrate + (activePromo?.bonus_hashpower_th ?? 0),
        hashrate_unit:        ct.hashrate_unit,
        maintenance_fee_rate: ct.maintenance_fee ?? 0.0028,
        pool_allocation:      selectedPool?.name ?? ct.mining_pool ?? "BTCMiner Pool",
        hardware:             ct.hardware ?? "Antminer S21",
        status:               "active",
        start_date:           startDate.toISOString().split("T")[0],
        expiry_date:          ct.is_lifetime ? null : expiryDate.toISOString().split("T")[0],
        rewards_generated:    0,
        maintenance_paid:     0,
        price_paid:           finalPrice,
        mining_farm_id:       selectedFarm?.id ?? null,
        template_id:          ct.id,
      });
      if (error) throw error;

      // Record promo redemption if a promo was applied
      if (activePromo && !isComplimentary) {
        await supabase.functions.invoke("marketing-automation", {
          body: {
            action: "record_contract_purchase",
            user_id: user.id,
            contract_id: ct.id,
            promotion_id: activePromo.id,
          },
        });
      } else if (!isComplimentary) {
        // Still fire the funnel event without promo
        supabase.functions.invoke("marketing-automation", {
          body: { action: "record_contract_purchase", user_id: user.id, contract_id: ct.id },
        });
      }

      // Deduct from user wallet(s) only if not complimentary
      const updatedWallets = [...wallets];
      if (!isComplimentary) {
        if (effectiveWalletId !== "portfolio") {
          const targetWallet = wallets.find(w => w.id === effectiveWalletId || w.currency === effectiveWalletId);
          if (targetWallet) {
            const rate = btc.getPrice(targetWallet.currency);
            const cryptoAmt = rate > 0 ? finalPrice / rate : finalPrice;
            const newBal = Math.max(0, (Number(targetWallet.balance) || 0) - cryptoAmt);

            await supabase.from("wallets")
              .update({ balance: newBal, updated_at: new Date().toISOString() })
              .eq("id", targetWallet.id);

            await supabase.from("transactions").insert({
              user_id: user.id,
              type: "withdrawal",
              currency: targetWallet.currency,
              amount: cryptoAmt,
              usd_value: finalPrice,
              status: "confirmed",
              note: `Hashrate purchase: ${ct.name} (${ct.hashrate} ${ct.hashrate_unit})`,
            });

            const idx = updatedWallets.findIndex(w => w.id === targetWallet.id);
            if (idx >= 0) updatedWallets[idx] = { ...updatedWallets[idx], balance: newBal };
          }
        } else {
          // Deduct from available funded wallets starting with highest USD balance
          let remainingUSD = finalPrice;
          const sorted = [...wallets].sort((a, b) => btc.toUsd(Number(b.balance) || 0, b.currency) - btc.toUsd(Number(a.balance) || 0, a.currency));

          for (const w of sorted) {
            if (remainingUSD <= 0.0001) break;
            const wBalUSD = btc.toUsd(Number(w.balance) || 0, w.currency);
            if (wBalUSD <= 0) continue;

            const deductUSD = Math.min(remainingUSD, wBalUSD);
            const rate = btc.getPrice(w.currency);
            const deductCrypto = rate > 0 ? deductUSD / rate : deductUSD;
            const newBal = Math.max(0, (Number(w.balance) || 0) - deductCrypto);

            await supabase.from("wallets")
              .update({ balance: newBal, updated_at: new Date().toISOString() })
              .eq("id", w.id);

            await supabase.from("transactions").insert({
              user_id: user.id,
              type: "withdrawal",
              currency: w.currency,
              amount: deductCrypto,
              usd_value: deductUSD,
              status: "confirmed",
              note: `Hashrate purchase: ${ct.name} (${ct.hashrate} ${ct.hashrate_unit})`,
            });

            const idx = updatedWallets.findIndex(item => item.id === w.id);
            if (idx >= 0) updatedWallets[idx] = { ...updatedWallets[idx], balance: newBal };

            remainingUSD -= deductUSD;
          }
        }

        setWallets(updatedWallets);
        getWallets(user.id).then(setWallets).catch(() => {});
      }

      // Notifications — non-blocking
      notifyAdmin({
        type:           "contract_purchased",
        user_id:        user.id,
        user_email:     user.email,
        contract_name:  ct.name,
        hashrate:       `${ct.hashrate} ${ct.hashrate_unit}`,
        duration:       ct.is_lifetime ? "Lifetime" : `${ct.duration} days`,
        amount:         finalPrice,
        pool_name:      selectedPool?.name ?? ct.mining_pool ?? "—",
        farm_name:      selectedFarm?.name ?? ct.mining_farm ?? "—",
        payment_method: effectiveWalletId === "portfolio" ? "Portfolio Balance (Multi-Wallet)" : `${effectiveWalletId} Wallet`,
      });
      notifyUser({
        type:          "contract_purchased",
        user_id:       user.id,
        user_email:    user.email,
        contract_name: ct.name,
        hashrate:      `${ct.hashrate} ${ct.hashrate_unit}`,
        duration:      ct.is_lifetime ? "Lifetime" : `${ct.duration} days`,
        amount:        finalPrice,
        pool_name:     selectedPool?.name ?? ct.mining_pool ?? "—",
        farm_name:     selectedFarm?.name ?? ct.mining_farm ?? "—",
      });

      if (isStarterPlan(ct)) {
        setHasPurchasedStarter(true);
      }

      toast.success(`Contract purchased! ${ct.name} (${ct.hashrate + (activePromo?.bonus_hashpower_th ?? 0)} ${ct.hashrate_unit}) is now hashing.`);
      setPurchaseModal(null);
    } catch (e: unknown) {
      console.error("[handleConfirmPurchase] Error:", e);
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
              Portfolio Balance:{" "}
              {walletsLoading ? (
                <Skeleton className="h-4 w-20 bg-muted" />
              ) : (
                <span className="font-mono text-primary font-semibold">
                  ${totalPortfolioUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              )}
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
              const isStarter = isStarterPlan(c);
              const isStarterClaimed = isStarter && hasPurchasedStarter;

              return (
                <Card key={c.id} className={`bg-card border-border h-full flex flex-col ${isStarterClaimed ? "opacity-80 border-border" : c.featured ? "border-primary/40" : ""}`}>
                  {isStarter && (
                    <div className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between border-b ${
                      isStarterClaimed
                        ? "bg-muted text-muted-foreground border-border"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        1-Time Introductory Plan
                      </span>
                      <Badge variant="outline" className={`text-[10px] font-bold py-0 ${
                        isStarterClaimed
                          ? "border-muted-foreground/30 text-muted-foreground bg-background/50"
                          : "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      }`}>
                        {isStarterClaimed ? "Already Claimed" : "1 Per Account"}
                      </Badge>
                    </div>
                  )}
                  {c.featured && !isStarter && (
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
                        className={`gap-1 text-xs ${
                          isStarterClaimed
                            ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed border border-border"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                        disabled={isStarterClaimed || purchasing === c.id || loading || c.remaining_capacity <= 0}
                        onClick={() => {
                          if (isStarterClaimed) {
                            toast.error("Starter SHA-256 is strictly limited to 1 purchase per account. You have already claimed this plan.");
                            return;
                          }
                          openPurchaseModal(c);
                        }}
                      >
                        {isStarterClaimed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                            Already Claimed
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            {purchasing === c.id ? "Processing…" : c.remaining_capacity <= 0 ? "Sold Out" : "Purchase"}
                          </>
                        )}
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
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 pb-3.5 border-b border-border/60 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-primary" />
              Confirm Contract Purchase
            </DialogTitle>
          </DialogHeader>

          {purchaseModal && (() => {
            const ct        = purchaseModal;
            const basePrice = ct.promotional_price ?? ct.discount_price ?? ct.price;
            const finalPrice = computeFinalPrice(basePrice, activePromo);
            const savings   = basePrice - finalPrice;
            const bonusTH   = activePromo?.bonus_hashpower_th ?? 0;
            const daily     = ct.estimated_daily_reward;
            const matchingPools = pools.filter(p => p.algorithm === ct.algorithm || p.algorithm === "SHA-256");

            return (
              <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                {/* Contract summary */}
                <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-semibold text-foreground">{ct.display_name ?? ct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hashrate</span>
                    <span className="font-mono text-foreground">
                      {ct.hashrate}{bonusTH > 0 && <span className="text-green-500"> +{bonusTH}</span>} {ct.hashrate_unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono text-foreground">{ct.is_lifetime ? "Lifetime" : `${ct.duration} days`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Daily</span>
                    <span className="font-mono text-primary">{daily.toFixed(6)} BTC</span>
                  </div>
                  <Separator />
                  {savings > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span className="font-medium flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" /> Discount
                      </span>
                      <span className="font-mono">−${savings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Total Price</span>
                    <div className="text-right">
                      {savings > 0 && (
                        <p className="text-xs line-through text-muted-foreground">${basePrice.toLocaleString()}</p>
                      )}
                      <span className="font-bold text-primary text-base">${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Auto-applied promo banner */}
                {autoPromo && !appliedPromo && (
                  <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-500">
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1">Promotion auto-applied: <strong>{autoPromo.name}</strong></span>
                  </div>
                )}

                {/* Coupon field */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Coupon Code
                  </Label>
                  {appliedPromo ? (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Tag className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      <span className="flex-1 text-xs text-green-500 font-medium">{appliedPromo.name}</span>
                      <button type="button" onClick={removeCoupon} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        ref={couponInputRef}
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && applyCoupon()}
                        placeholder="Enter coupon code"
                        className="h-8 text-sm font-mono uppercase flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0"
                        onClick={applyCoupon}
                        disabled={!couponInput.trim() || couponLoading}
                      >
                        {couponLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mining Pool selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Server className="w-3 h-3" />
                      Mining Pool
                      {matchingPools.length === 1 && (
                        <Badge className="text-xs bg-muted text-muted-foreground border-border ml-1">Auto-assigned</Badge>
                      )}
                    </Label>
                    {matchingPools.length > 2 && (
                      <span className="text-[11px] text-muted-foreground">Scroll to see all ({matchingPools.length})</span>
                    )}
                  </div>
                  {matchingPools.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto p-1 border border-border/50 rounded-lg bg-muted/10">
                      {matchingPools.map(pool => (
                        <button
                          key={pool.id}
                          type="button"
                          onClick={() => setSelectedPool(pool)}
                          className={`w-full text-left p-2.5 rounded-md border text-sm transition-all ${
                            selectedPool?.id === pool.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-background hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selectedPool?.id === pool.id ? (
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}
                              <span className="font-medium text-foreground text-xs md:text-sm">{pool.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                              <span className="font-mono">{pool.fee}% fee</span>
                              <span>·</span>
                              <span className="text-success font-mono">{pool.uptime}% uptime</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">
                            {pool.location} · {pool.hashrate_eh.toFixed(0)} EH/s · {pool.workers.toLocaleString()} workers
                          </p>
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
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border border-border/50 rounded-lg bg-muted/10">
                      {farms.map(farm => (
                        <button
                          key={farm.id}
                          type="button"
                          onClick={() => setSelectedFarm(farm)}
                          className={`text-left p-2.5 rounded-md border text-xs transition-all ${
                            selectedFarm?.id === farm.id
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-background hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {selectedFarm?.id === farm.id ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                            )}
                            <span className="font-medium text-foreground truncate">{farm.flag} {farm.name}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{farm.country} · {farm.power_source}</p>
                          <p className="text-[11px] text-success font-mono">{farm.uptime}% uptime</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
                      Farm location will be assigned automatically.
                    </p>
                  )}
                </div>

                {/* Payment Source Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <WalletIcon className="w-3 h-3" />
                      Payment Method
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Total Balance: ${totalPortfolioUSD.toFixed(2)} USD
                    </span>
                  </Label>
                  <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                    <SelectTrigger className="w-full text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isImpersonating && (
                        <SelectItem value="admin_complimentary" className="font-semibold text-primary">
                          🎁 Admin Complimentary Grant ($0.00 — Platform Covered)
                        </SelectItem>
                      )}
                      <SelectItem value="portfolio">
                        ✨ Portfolio Balance (${totalPortfolioUSD.toFixed(2)} USD total) {totalPortfolioUSD + 0.05 >= finalPrice ? "• Ready" : "• Insufficient"}
                      </SelectItem>
                      {wallets.map(w => {
                        const bal = Number(w.balance) || 0;
                        const usd = btc.toUsd(bal, w.currency);
                        const hasEnough = usd + 0.05 >= finalPrice;
                        return (
                          <SelectItem key={w.id} value={w.id}>
                            {w.currency} Wallet — {bal.toFixed(w.currency === "USDT" ? 2 : 5)} {w.currency} (≈ ${usd.toFixed(2)} USD) {hasEnough ? "• Ready" : `• Short by $${Math.max(0, finalPrice - usd).toFixed(2)}`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Balance check and shortfall / success feedback */}
                {(() => {
                  if (selectedWalletId === "admin_complimentary") {
                    return (
                      <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center text-primary font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Admin Complimentary Override Active
                          </span>
                          <span className="font-mono">$0.00 Cost</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          This contract will be provisioned directly for {user?.email} at $0 charge to their wallet balance.
                        </p>
                      </div>
                    );
                  }

                  let selectedAvailableUSD = totalPortfolioUSD;
                  let selectedCurrency = "Portfolio (All Wallets)";
                  if (selectedWalletId !== "portfolio") {
                    const tw = wallets.find(w => w.id === selectedWalletId || w.currency === selectedWalletId);
                    selectedAvailableUSD = tw ? btc.toUsd(Number(tw.balance) || 0, tw.currency) : 0;
                    selectedCurrency = tw?.currency ? `${tw.currency} Wallet` : "Selected Wallet";
                  }
                  const isSelectedSufficient = selectedAvailableUSD + 0.05 >= finalPrice;
                  const isPortfolioSufficient = totalPortfolioUSD + 0.05 >= finalPrice;
                  const isSufficient = isSelectedSufficient || isPortfolioSufficient;
                  const shortfall = Math.max(0, finalPrice - totalPortfolioUSD);

                  if (isSelectedSufficient) {
                    return (
                      <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-success font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Sufficient Balance in {selectedCurrency}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            ${selectedAvailableUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        </div>
                        <div className="flex justify-between text-muted-foreground text-[11px]">
                          <span>Remaining balance after purchase:</span>
                          <span className="font-mono">${Math.max(0, selectedAvailableUSD - finalPrice).toFixed(2)} USD</span>
                        </div>
                      </div>
                    );
                  }

                  if (isPortfolioSufficient) {
                    return (
                      <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between items-center text-primary font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            Portfolio Balance Available (${totalPortfolioUSD.toFixed(2)} USD)
                          </span>
                          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                            Ready to Pay
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {selectedCurrency} has ${selectedAvailableUSD.toFixed(2)} USD, but your overall Portfolio holds ${totalPortfolioUSD.toFixed(2)} USD. You can confirm purchase now and funds will be seamlessly drawn from your funded balance!
                        </p>
                        <div className="pt-0.5 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Prefer explicit portfolio deduction?</span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[11px] px-2.5"
                            onClick={() => setSelectedWalletId("portfolio")}
                          >
                            Use Portfolio Balance
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between items-center text-destructive font-semibold">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Insufficient Balance
                        </span>
                        <span className="font-mono font-bold">
                          Shortfall: ${shortfall.toFixed(2)} USD
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground text-[11px] pt-1 border-t border-destructive/20">
                        <div>
                          <span>Required: </span>
                          <strong className="font-mono text-foreground">${finalPrice.toFixed(2)} USD</strong>
                        </div>
                        <div>
                          <span>Total Available: </span>
                          <strong className="font-mono text-foreground">${totalPortfolioUSD.toFixed(2)} USD</strong>
                        </div>
                      </div>

                      <div className="pt-1">
                        <Button
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs gap-1"
                          asChild
                        >
                          <a href="/dashboard/deposit" target="_blank" rel="noreferrer">
                            Deposit Funds to Wallet (${shortfall.toFixed(2)} USD needed)
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          <DialogFooter className="p-4 border-t border-border/60 shrink-0 bg-background flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPurchaseModal(null)}>
              Cancel
            </Button>
            {(() => {
              if (!purchaseModal) return null;
              const ct = purchaseModal;
              const basePrice = Number(ct.promotional_price ?? ct.discount_price ?? ct.price) || 0;
              const finalPrice = Number(computeFinalPrice(basePrice, activePromo)) || 0;
              let selectedAvailableUSD = totalPortfolioUSD;
              if (selectedWalletId !== "portfolio") {
                const tw = wallets.find(w => w.id === selectedWalletId || w.currency === selectedWalletId);
                selectedAvailableUSD = tw ? btc.toUsd(Number(tw.balance) || 0, tw.currency) : 0;
              }
              const isSelectedSufficient = selectedAvailableUSD + 0.05 >= finalPrice;
              const isPortfolioSufficient = totalPortfolioUSD + 0.05 >= finalPrice;
              const isSufficient = isSelectedSufficient || isPortfolioSufficient;
              const shortfall = Math.max(0, finalPrice - totalPortfolioUSD);

              return (
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-md"
                  onClick={handleConfirmPurchase}
                  disabled={!isSufficient || Boolean(purchasing)}
                >
                  <Zap className="w-4 h-4" />
                  {purchasing
                    ? "Processing Purchase…"
                    : !isSufficient
                    ? `Insufficient Balance (Need $${shortfall.toFixed(2)} more)`
                    : !isSelectedSufficient && isPortfolioSufficient
                    ? `Confirm Purchase (Pay $${finalPrice.toFixed(2)} via Portfolio)`
                    : `Confirm Purchase ($${finalPrice.toFixed(2)} USD)`}
                </Button>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
