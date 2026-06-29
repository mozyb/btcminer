import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getWallets, getTransactions, getUserExternalWallets, type Wallet, type Transaction, type UserExternalWallet } from "@/lib/api";
import { useBtcStats } from "@/hooks/useBtcStats";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import WalletConnectModal from "@/components/wallet/WalletConnectModal";
import {
  ArrowDownToLine, ArrowUpFromLine, Copy, WalletMinimal,
  Zap, Shield, ExternalLink, Star, Trash2, Bitcoin,
} from "lucide-react";
import { toast } from "sonner";

const txColors: Record<string, string> = {
  deposit: "text-success",
  reward: "text-primary",
  withdrawal: "text-destructive",
  commission: "text-info",
  bonus: "text-warning",
};

const PROVIDER_ICONS: Record<string, string> = {
  unisat: "🔶", xverse: "🔷", leather: "🟤", okx: "⬛", phantom: "👻",
  ledger: "🔒", trezor: "🛡️", manual: "📝",
};

export default function WalletPage() {
  const { user } = useAuth();
  const btc = useBtcStats();
  const {
    wallets: externalWallets,
    loading: extLoading,
    disconnectWallet,
    setPrimary,
  } = useWalletConnect();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([getWallets(user.id), getTransactions(user.id)])
      .then(([w, t]) => { setWallets(w); setTransactions(t); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalUSD = wallets.reduce((s, w) => s + w.balance * (w.currency === "BTC" ? btc.btcPrice : 1), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="border border-border rounded p-5 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Portfolio Value</p>
          {loading ? (
            <Skeleton className="h-10 w-36 bg-muted" />
          ) : (
            <p className="text-4xl font-bold font-mono text-primary">${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Across all currencies</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-8 rounded-full bg-muted" />
                    <Skeleton className="h-5 w-16 bg-muted" />
                  </div>
                  <Skeleton className="h-7 w-28 bg-muted" />
                  <Skeleton className="h-4 w-20 bg-muted" />
                  <Skeleton className="h-8 w-full bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded">
            <WalletMinimal className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">No wallets yet</p>
            <p className="text-sm text-muted-foreground mb-4">Your BTC wallet will be created automatically when you make a deposit or purchase a contract</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/dashboard/deposit">Make Your First Deposit</Link>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map(w => (
              <Card key={w.currency} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{w.symbol}</span>
                      </div>
                      <p className="font-semibold text-foreground">{w.currency}</p>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20 text-xs">Active</Badge>
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground mb-0.5">{Number(w.balance).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    ${(w.balance * (w.currency === "BTC" ? btc.btcPrice : 1)).toLocaleString("en-US", { maximumFractionDigits: 0 })} USD
                  </p>
                  {w.address && (
                    <div className="flex items-center gap-1 bg-muted/30 border border-border rounded px-2 py-1.5 mb-3">
                      <p className="font-mono text-xs text-muted-foreground flex-1 truncate">{w.address}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Address copied"); }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 h-8" asChild>
                      <Link to="/dashboard/deposit"><ArrowDownToLine className="w-3 h-3" />Deposit</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 h-8" asChild>
                      <Link to="/dashboard/withdraw"><ArrowUpFromLine className="w-3 h-3" />Withdraw</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Connected External Wallets ─────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Connected External Wallets</h3>
            </div>
            <Button size="sm" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 h-7" onClick={() => setShowConnectModal(true)}>
              <ExternalLink className="w-3 h-3 mr-1" /> Connect Wallet
            </Button>
          </div>

          {extLoading ? (
            <div className="grid md:grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 bg-muted rounded" />
              ))}
            </div>
          ) : externalWallets.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded bg-muted/20">
              <WalletMinimal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">No external wallets connected</p>
              <p className="text-xs text-muted-foreground mb-3">Connect your Bitcoin wallet to receive payouts directly</p>
              <Button size="sm" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setShowConnectModal(true)}>
                <ExternalLink className="w-3 h-3 mr-1" /> Connect Wallet
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {externalWallets.map((w) => (
                <Card key={w.id} className={`bg-card border-border ${w.is_primary ? "ring-1 ring-primary/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PROVIDER_ICONS[w.provider] ?? "🔐"}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                            {w.label || w.provider}
                            {w.is_primary && (
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-4 px-1">
                                <Star className="w-2.5 h-2.5 mr-0.5" /> Primary
                              </Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[10px] h-4 px-1 ${
                              w.wallet_type === "hot"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-success/10 text-success border-success/20"
                            }`}>
                              {w.wallet_type === "hot" ? <Zap className="w-2.5 h-2.5 mr-0.5" /> : <Shield className="w-2.5 h-2.5 mr-0.5" />}
                              {w.wallet_type === "hot" ? "Hot" : "Cold"}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{w.provider}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!w.is_primary && (
                          <button
                            onClick={() => setPrimary(w.id)}
                            title="Set as primary"
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => disconnectWallet(w.id)}
                          title="Disconnect"
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/30 border border-border rounded px-2 py-1.5">
                      <p className="font-mono text-xs text-muted-foreground flex-1 truncate">{w.address}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Address copied"); }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Recent Transactions
              <Button variant="ghost" size="sm" className="text-xs text-primary h-6 px-2" asChild>
                <Link to="/dashboard/transactions">View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 bg-muted rounded" />)}</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>No transactions yet</p>
                <p className="text-xs mt-1">Deposits, rewards, and withdrawals will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Type", "Amount", "Currency", "Status", "Date"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map(tx => (
                      <tr key={tx.id} className="border-b border-border last:border-0">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`capitalize font-medium text-xs ${txColors[tx.type] ?? "text-foreground"}`}>{tx.type}</span>
                        </td>
                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          <span className={tx.type === "withdrawal" ? "text-destructive" : "text-success"}>
                            {tx.type === "withdrawal" ? "-" : "+"}{Number(tx.amount).toFixed(6)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">{tx.currency}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">{tx.status}</Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WalletConnectModal open={showConnectModal} onOpenChange={setShowConnectModal} />
    </DashboardLayout>
  );
}

