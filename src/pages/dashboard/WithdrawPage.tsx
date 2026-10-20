import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPaymentMethods, getWallets, getUserExternalWallets,
  submitManualTransaction, notifyAdmin, notifyUser,
  MIN_WITHDRAWAL_USD, WITHDRAWAL_FEE,
  type PaymentMethod, type Wallet, type UserExternalWallet,
} from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import {
  Shield, AlertCircle, CheckCircle, Clock, ArrowUpFromLine,
  Wallet as WalletIcon, ExternalLink, Zap, Star,
} from "lucide-react";
import { toast } from "sonner";
import { formatCryptoBalance } from "@/lib/utils";

// Zero fee policy: all withdrawals have 0 fee across all currencies
const fee = WITHDRAWAL_FEE;

export default function WithdrawPage() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [externalWallets, setExternalWallets] = useState<UserExternalWallet[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getPaymentMethods("withdrawal"),
      user?.id ? getWallets(user.id) : Promise.resolve([]),
      user?.id ? getUserExternalWallets(user.id) : Promise.resolve([]),
    ]).then(([m, w, ext]) => {
      setMethods(m);
      setWallets(w);
      setExternalWallets(ext);
      if (m.length) setSelectedId(m[0].id);
    }).catch(() => toast.error("Failed to load payment methods"))
      .finally(() => setLoadingMethods(false));
  }, [user?.id]);

  const method = methods.find(m => m.id === selectedId);
  const wallet = wallets.find(w => w.currency === method?.currency);
  const net = Math.max(0, Number(amount));

  const usdValue = () => {
    const n = Number(amount);
    if (!n || !method) return 0;
    return btc.toUsd(n, method.currency);
  };

  const minCryptoAmount = () => {
    if (!method) return 0;
    const price = btc.getPrice(method.currency);
    if (!price || price <= 0) return 0;
    return Number((MIN_WITHDRAWAL_USD / price).toFixed(6));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { toast.error("Enter a destination wallet address"); return; }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) { toast.error("Enter a valid amount"); return; }
    const usd = usdValue();
    if (usd < MIN_WITHDRAWAL_USD) {
      toast.error(`Minimum withdrawal is $${MIN_WITHDRAWAL_USD.toFixed(2)} USD. Your requested amount is $${usd.toFixed(2)} USD.`);
      return;
    }
    if (wallet && numAmount > wallet.balance) { toast.error("Amount exceeds available balance"); return; }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!user || !method) return;
    setSubmitting(true);
    try {
      const txId = await submitManualTransaction({
        user_id: user.id,
        type: "withdrawal",
        currency: method.currency,
        amount: Number(amount),
        usd_value: usdValue(),
        payment_method_id: method.id,
        destination_address: address,
        note: `Manual withdrawal to ${address}`,
      });
      await notifyAdmin({
        type:                "withdrawal_requested",
        user_id:             user.id,
        user_email:          user.email,
        username:            user.username ?? user.email,
        currency:            method.currency,
        network:             ((method as unknown) as Record<string, unknown>)["network"] ?? method.currency,
        amount:              Number(amount),
        usd_value:           usdValue(),
        transaction_id:      txId,
        destination_address: address,
        status:              "Pending",
      });
      // Notify user their withdrawal was submitted
      notifyUser({
        type:                "withdrawal_requested",
        user_id:             user.id,
        user_email:          user.email,
        currency:            method.currency,
        amount:              Number(amount),
        destination_address: address,
        transaction_id:      txId,
      });
      setStep("done");
      toast.success("Withdrawal request submitted. Admin will process within 1–24 hours.");
    } catch {
      toast.error("Failed to submit withdrawal. Please try again.");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setStep("form"); setAmount(""); setAddress(""); };

  return (
    <DashboardLayout>
      <div className="max-w-md space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Withdraw Funds</h2>
          <p className="text-sm text-muted-foreground">Send funds to your external wallet</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card border border-border rounded-lg text-center">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide block font-medium">Minimum Withdrawal</span>
            <span className="text-base font-bold text-foreground font-mono">$5.00 USD</span>
            {method && (
              <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">
                ≈ {minCryptoAmount()} {method.currency}
              </span>
            )}
          </div>
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-center">
            <span className="text-[11px] text-success uppercase tracking-wide block font-medium">Withdrawal Fee</span>
            <span className="text-base font-bold text-success font-mono">$0.00 (Free)</span>
            <span className="text-[10px] text-success/80 block mt-0.5">
              Zero Platform Fee
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded text-xs">
          <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground">All withdrawals are reviewed by our team. Processing takes 1–24 hours.</p>
        </div>

        {loadingMethods ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-muted" />
            <Skeleton className="h-56 w-full bg-muted" />
          </div>
        ) : step === "form" ? (
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Currency</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {methods.map(m => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            {m.display_name}
                            {m.network_tag && <span className="text-xs text-muted-foreground">({m.network_tag})</span>}
                            {wallet && method?.id === m.id && (
                              <span className="text-xs text-muted-foreground">— {formatCryptoBalance(wallet.balance, wallet.currency)} available</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {wallet && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: <span className="font-mono text-foreground">{formatCryptoBalance(wallet.balance, wallet.currency)} {method?.currency}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Destination Address</Label>
                  {/* Quick select from connected wallets */}
                  {externalWallets.length > 0 && method?.currency === "BTC" && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {externalWallets.map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setAddress(w.address)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border transition-colors ${
                            address === w.address
                              ? "bg-primary/10 border-primary text-primary"
                              : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <WalletIcon className="w-2.5 h-2.5" />
                          {w.label || w.provider}
                          {w.is_primary && <Star className="w-2.5 h-2.5 text-warning" />}
                        </button>
                      ))}
                      <Link
                        to="/dashboard/wallet"
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> Manage wallets
                      </Link>
                    </div>
                  )}
                  <Input
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={`Enter your ${method?.currency ?? ""} wallet address`}
                    className="font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <Label className="text-sm font-normal">Amount ({method?.currency})</Label>
                    {wallet && (
                      <button type="button" className="text-xs text-primary hover:underline"
                        onClick={() => setAmount(String(wallet.balance.toFixed(6)))}>
                        Max
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="any"
                    min="0"
                    className="font-mono"
                    required
                  />
                  {amount && Number(amount) > 0 && method && (
                    <div className="space-y-1 mt-2 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>USD Value:</span>
                        <span className="font-mono text-foreground font-medium">≈ ${usdValue().toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span className="text-success font-medium">Withdrawal fee:</span>
                        <span className="text-success font-medium">$0.00 (Zero Fee)</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/50">
                        <span>You receive:</span>
                        <span className="text-foreground font-mono font-bold">{Number(amount).toFixed(6)} {method.currency}</span>
                      </div>
                      {usdValue() < MIN_WITHDRAWAL_USD && (
                        <p className="text-destructive text-[11px] font-medium pt-1">
                          ⚠️ Amount is below the $5.00 USD minimum withdrawal threshold.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {method?.instructions && (
                  <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded text-xs">
                    <Clock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">{method.instructions}</p>
                  </div>
                )}

                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Continue
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : step === "confirm" ? (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ArrowUpFromLine className="w-4 h-4 text-primary" />Confirm Withdrawal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm border border-border rounded p-3">
                {[
                  { label: "Currency", val: method?.currency ?? "" },
                  { label: "Method", val: method?.display_name ?? "" },
                  { label: "Requested Amount", val: `${amount} ${method?.currency} (≈ $${usdValue().toFixed(2)} USD)` },
                  { label: "Withdrawal Fee", val: "$0.00 (Zero Fee / 100% Free)" },
                  { label: "You Receive", val: `${Number(amount).toFixed(6)} ${method?.currency}` },
                  { label: "Destination", val: address },
                ].map(r => (
                  <div key={r.label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-mono text-foreground text-right break-all text-xs">{r.val}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-2 bg-warning/10 border border-warning/20 rounded text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Your request will be reviewed by admin. Funds will be sent within 1–24 hours.</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("form")} disabled={submitting}>Back</Button>
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConfirm} disabled={submitting}>
                  {submitting ? "Submitting…" : "Confirm & Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Withdrawal Request Submitted</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your withdrawal of <span className="font-mono text-foreground font-medium">{amount} {method?.currency}</span> is under review. Funds will be sent to your address within 1–24 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={reset}>New Withdrawal</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link to="/dashboard/transactions">View Transactions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
