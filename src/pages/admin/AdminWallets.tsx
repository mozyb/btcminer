import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";
import { walletBalances } from "@/lib/mockData";
import { ArrowDownToLine, ArrowUpFromLine, Shield } from "lucide-react";
import { toast } from "sonner";

const platformWallets = [
  { label: "Hot Wallet BTC", currency: "BTC", balance: 14.72, usdValue: 998421, status: "active" },
  { label: "Hot Wallet USDT", currency: "USDT", balance: 280000, usdValue: 280000, status: "active" },
  { label: "Hot Wallet ETH", currency: "ETH", balance: 84.2, usdValue: 316282, status: "active" },
  { label: "Cold Storage BTC", currency: "BTC", balance: 248.91, usdValue: 16882101, status: "cold" },
];

export default function AdminWallets() {
  const totalUSD = platformWallets.reduce((s, w) => s + w.usdValue, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Platform Wallet Management</h2>
          <p className="text-sm text-muted-foreground">Total: <span className="font-mono text-primary">${totalUSD.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span> USD across all wallets</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {platformWallets.map(w => (
            <Card key={w.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {w.status === "cold" && <Shield className="w-4 h-4 text-muted-foreground" />}
                    <p className="font-semibold text-foreground">{w.label}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${w.status === "cold" ? "border-muted text-muted-foreground bg-muted/30" : "border-success/20 text-success bg-success/10"}`}>{w.status === "cold" ? "Cold Storage" : "Hot Wallet"}</span>
                </div>
                <p className="text-3xl font-bold font-mono text-primary">{w.balance.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{w.currency} · ${w.usdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD</p>
                {w.status === "active" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 h-7" onClick={() => toast.info("Wallet receive address")}><ArrowDownToLine className="w-3 h-3" />Receive</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs gap-1 h-7" onClick={() => toast.info("Send funds coming soon")}><ArrowUpFromLine className="w-3 h-3" />Send</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">User Wallet Balances Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Currency", "Total User Balance", "USD Value", "Pending Deposits", "Pending Withdrawals"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {walletBalances.map(w => (
                    <tr key={w.currency} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{w.currency}</td>
                      <td className="py-3 px-3 font-mono text-foreground whitespace-nowrap">{(w.balance * 1000).toFixed(3)}</td>
                      <td className="py-3 px-3 font-mono text-primary whitespace-nowrap">${(w.usdValue * 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                      <td className="py-3 px-3 font-mono text-warning whitespace-nowrap">{(w.balance * 0.02).toFixed(4)}</td>
                      <td className="py-3 px-3 font-mono text-destructive whitespace-nowrap">{(w.balance * 0.01).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
