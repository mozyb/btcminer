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
  submitManualTransaction, notifyAdmin,
  type PaymentMethod, type Wallet, type UserExternalWallet,
} from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import {
  Shield, AlertCircle, CheckCircle, Clock, ArrowUpFromLine,
  Wallet as WalletIcon, ExternalLink, Zap, Star,
} from "lucide-react";
import { toast } from "sonner";

const fees: Record<string, number> = { BTC: 0.0001, ETH: 0.001, USDT: 1, LTC: 0.001, DOGE: 1 };

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
  const fee = fees[method?.currency ?? "BTC"] ?? 0;
  const net = Math.max(0, Number(amount) - fee);

  const usdValue = () => {
    const n = Number(amount);
    if (!n || !method) return 0;
    if (method.currency === "BTC") return n * btc.btcPrice;
    if (method.currency === "ETH") return n * 3200;
    if (method.currency === "USDT") return n;
    if (method.currency === "LTC") return n * 90;
    if (method.currency === "DOGE") return n * 0.18;
    return n;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { toast.error("Enter a destination wallet address"); return; }
    if (!Number(amount) || Number(amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (wallet && Number(amount) > wallet.balance) { toast.error("Amount exceeds available balance"); return; }
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
        type: "withdrawal",
        user_id: user.id,
        user_email: user.email,
        currency: method.currency,
        amount: Number(amount),
        usd_value: usdValue(),
        transaction_id: txId,
        destination_address: address,
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
                              <span className="text-xs text-muted-foreground">— {wallet.balance.toLocaleString()} available</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {wallet && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: <span className="font-mono text-foreground">{wallet.balance.toLocaleString()} {method?.currency}</span>
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
                        onClick={() => setAmount(String(Math.max(0, wallet.balance - fee).toFixed(6)))}>
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
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Network fee: {fee} {method.currency}</span>
                      <span>You receive: <strong className="text-foreground">{net.toFixed(6)} {method.currency}</strong></span>
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
                  { label: "Amount", val: `${amount} ${method?.currency}` },
                  { label: "Network fee", val: `${fee} ${method?.currency}` },
                  { label: "You receive", val: `${net.toFixed(6)} ${method?.currency}` },
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
