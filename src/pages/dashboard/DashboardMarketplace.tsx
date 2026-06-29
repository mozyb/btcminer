import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { miningContracts } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { getWallets, type Wallet } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { supabase } from "@/db/supabase";
import { Search, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function DashboardMarketplace() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const [search, setSearch] = useState("");
  const [algorithm, setAlgorithm] = useState("all");
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getWallets(user.id).then(setWallets).finally(() => setWalletsLoading(false));
  }, [user?.id]);

  const btcWallet = wallets.find(w => w.currency === "BTC");
  const btcBalanceUSD = btcWallet ? btcWallet.balance * btc.btcPrice : 0;

  const filtered = miningContracts.filter(c => {
    const matchS = c.name.toLowerCase().includes(search.toLowerCase());
    const matchA = algorithm === "all" || c.algorithm === algorithm;
    return matchS && matchA;
  });

  const handlePurchase = async (contractTemplate: typeof miningContracts[0]) => {
    if (!user?.id) { toast.error("Please log in first."); return; }
    if (contractTemplate.totalPrice > btcBalanceUSD) {
      toast.error("Insufficient balance. Please deposit funds first.");
      return;
    }
    setPurchasing(contractTemplate.id);
    try {
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + contractTemplate.duration);

      const { error } = await supabase.from("contracts").insert({
        user_id: user.id,
        contract_name: contractTemplate.name,
        algorithm: contractTemplate.algorithm,
        coin: contractTemplate.coin,
        hashrate: contractTemplate.hashrate,
        hashrate_unit: contractTemplate.hashrateUnit,
        pool_allocation: "BTCMiner Pool",
        hardware: "Antminer S21",
        status: "active",
        start_date: startDate.toISOString().split("T")[0],
        expiry_date: expiryDate.toISOString().split("T")[0],
        rewards_generated: 0,
        maintenance_paid: 0,
        price_paid: contractTemplate.totalPrice,
      });
      if (error) throw error;

      // Deduct from BTC wallet
      if (btcWallet) {
        const priceInBtc = contractTemplate.totalPrice / btc.btcPrice;
        await supabase.from("wallets")
          .update({ balance: Math.max(0, btcWallet.balance - priceInBtc) })
          .eq("id", btcWallet.id);
        setWallets(ws => ws.map(w => w.id === btcWallet.id ? { ...w, balance: Math.max(0, w.balance - priceInBtc) } : w));
      }

      toast.success("Contract purchased! Mining starts immediately.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Purchase failed. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

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
                <span className="font-mono text-primary">${btcBalanceUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              )}{" "}USD
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded text-xs">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
          <p className="text-muted-foreground">Mining rewards are not guaranteed. Output depends on network difficulty and BTC price. Read the <a href="/risk" className="text-primary underline">Risk Disclosure</a>.</p>
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
              <SelectItem value="SHA-256">SHA-256</SelectItem>
              <SelectItem value="Scrypt">Scrypt</SelectItem>
              <SelectItem value="Kadena">Kadena</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className={`bg-card border-border h-full flex flex-col ${c.featured ? "border-primary/40" : ""}`}>
              {c.featured && <div className="bg-primary/10 border-b border-primary/20 px-4 py-1 text-xs text-primary font-medium">⭐ Popular</div>}
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.algorithm} · {c.coin}</p>
                  </div>
                  <Badge className="bg-muted text-muted-foreground shrink-0 text-xs">{c.duration}d</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div><p className="text-muted-foreground">Hashrate</p><p className="font-mono font-bold text-foreground">{c.hashrate} {c.hashrateUnit}</p></div>
                  <div><p className="text-muted-foreground">Maintenance</p><p className="font-mono text-foreground">${c.maintenanceFee}/TH/d</p></div>
                  <div><p className="text-muted-foreground">Available</p><p className="font-mono text-success">{c.availability} slots</p></div>
                  <div><p className="text-muted-foreground">Power Cost</p><p className="font-mono text-foreground">${(c.powerCost * 1e6).toFixed(2)}/MH/d</p></div>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Price</p>
                    <p className="text-lg font-bold font-mono text-primary">${c.totalPrice.toLocaleString()}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs"
                    disabled={purchasing === c.id || walletsLoading}
                    onClick={() => handlePurchase(c)}
                  >
                    <Zap className="w-3 h-3" />
                    {purchasing === c.id ? "Processing..." : "Purchase"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
