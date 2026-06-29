import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentMethods, getUserExternalWallets, submitManualTransaction, notifyAdmin, type PaymentMethod, type UserExternalWallet } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import {
  Copy, AlertCircle, CheckCircle, Clock, ArrowDownToLine,
  Wallet, ExternalLink, Star, Zap, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function DepositPage() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [externalWallets, setExternalWallets] = useState<UserExternalWallet[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      getPaymentMethods("deposit"),
      user?.id ? getUserExternalWallets(user.id) : Promise.resolve([]),
    ])
      .then(([m, ext]) => {
        setMethods(m);
        setExternalWallets(ext);
        if (m.length) setSelectedId(m[0].id);
      })
      .catch(() => toast.error("Failed to load payment methods"))
      .finally(() => setLoadingMethods(false));
  }, [user?.id]);

  const method = methods.find(m => m.id === selectedId);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !method) return;
    const n = Number(amount);
    if (!n || n <= 0) { toast.error("Enter a valid amount"); return; }
    setSubmitting(true);
    try {
      const txId = await submitManualTransaction({
        user_id: user.id,
        type: "deposit",
        currency: method.currency,
        amount: n,
        usd_value: usdValue(),
        payment_method_id: method.id,
        note: `Manual deposit via ${method.display_name}`,
      });
      await notifyAdmin({
        type: "deposit",
        user_id: user.id,
        user_email: user.email,
        currency: method.currency,
        amount: n,
        usd_value: usdValue(),
        transaction_id: txId,
      });
      setDone(true);
      toast.success("Deposit request submitted. Admin will credit your account shortly.");
    } catch (err) {
      toast.error("Failed to submit deposit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Deposit Funds</h2>
          <p className="text-sm text-muted-foreground">Select a currency and send funds to the address below</p>
        </div>

        {loadingMethods ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full bg-muted" />
            <Skeleton className="h-48 w-full bg-muted" />
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded">
            <p className="text-muted-foreground text-sm">No active deposit methods configured.</p>
          </div>
        ) : done ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Deposit Request Submitted</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your deposit of <span className="font-mono text-foreground font-medium">{amount} {method?.currency}</span> has been submitted. Admin will review and credit your account within 1–3 hours.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setDone(false); setAmount(""); }}>New Deposit</Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link to="/dashboard/transactions">View Transactions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Currency selector */}
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Select Currency</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        {m.display_name}
                        {m.network_tag && <span className="text-xs text-muted-foreground">({m.network_tag})</span>}
                        <Badge className="ml-1 text-[10px] h-4 px-1.5 bg-success/10 text-success border-success/20">
                          {m.mode === "manual" ? "Manual" : "Auto"}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {method && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ArrowDownToLine className="w-4 h-4 text-primary" />
                    {method.display_name} Deposit
                    {method.network_tag && (
                      <Badge className="bg-muted text-muted-foreground text-xs">{method.network_tag}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Admin wallet address to send to */}
                  {/* Show user's connected wallet for receiving payout reference */}
                {method.currency === "BTC" && externalWallets.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Your connected wallets</p>
                    <div className="space-y-1.5">
                      {externalWallets.map(w => (
                        <div key={w.id} className={`flex items-center gap-2 bg-muted/30 border rounded p-2 ${w.is_primary ? "border-primary/30" : "border-border"}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {w.wallet_type === "hot" ? <Zap className="w-3 h-3 text-warning" /> : <Shield className="w-3 h-3 text-success" />}
                              <span className="text-xs font-medium text-foreground">{w.label || w.provider}</span>
                              {w.is_primary && (
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-4 px-1">
                                  <Star className="w-2.5 h-2.5 mr-0.5" /> Primary
                                </Badge>
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-muted-foreground truncate">{w.address}</p>
                          </div>
                          <button
                            onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Address copied"); }}
                            className="text-muted-foreground hover:text-primary shrink-0 p-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Link to="/dashboard/wallet" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        <Wallet className="w-2.5 h-2.5" /> Manage wallets
                      </Link>
                    </div>
                  </div>
                )}

                {method.admin_address && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Send to this address</p>
                      <div className="flex items-center gap-2 bg-muted/30 border border-border rounded p-3">
                        <p className="font-mono text-xs text-foreground flex-1 break-all">{method.admin_address}</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(method.admin_address!); toast.success("Address copied"); }}
                          className="text-muted-foreground hover:text-primary shrink-0 p-1"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {method.instructions && (
                    <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/20 rounded text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">{method.instructions}</p>
                    </div>
                  )}

                  {/* Amount + submit */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="text-sm font-normal mb-1.5 block">Amount ({method.currency})</Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="font-mono"
                        required
                      />
                      {amount && Number(amount) > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ ${usdValue().toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { icon: AlertCircle, text: `Send only ${method.currency} (${method.network_tag ?? method.currency} network)`, color: "text-warning" },
                        { icon: Clock, text: "Balance credited within 1–3 hours after admin review", color: "text-muted-foreground" },
                        { icon: CheckCircle, text: "No receipt or transaction hash needed — just send and submit", color: "text-success" },
                      ].map(item => (
                        <div key={item.text} className="flex items-start gap-2 text-xs">
                          <item.icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.color}`} />
                          <span className="text-muted-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting…" : `Confirm Deposit — ${amount || "0"} ${method.currency}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Button variant="outline" className="w-full text-sm gap-2" asChild>
          <Link to="/dashboard/transactions">View Deposit History</Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
