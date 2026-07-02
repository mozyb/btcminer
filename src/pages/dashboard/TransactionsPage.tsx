import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactions, type Transaction } from "@/lib/api";
import { Search, ReceiptText } from "lucide-react";

const typeColors: Record<string, string> = {
  deposit: "bg-success/10 text-success border-success/20",
  reward: "bg-primary/10 text-primary border-primary/20",
  withdrawal: "bg-destructive/10 text-destructive border-destructive/20",
  commission: "bg-info/10 text-info border-info/20",
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    getTransactions(user.id)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = transactions.filter(tx => {
    const matchType = filter === "all" || tx.type === filter;
    const matchSearch = tx.currency.toLowerCase().includes(search.toLowerCase()) || tx.type.includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Transaction History</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading..." : `${transactions.length} total transaction${transactions.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="reward">Rewards</SelectItem>
              <SelectItem value="commission">Commissions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted rounded" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ReceiptText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Deposits, mining rewards, and withdrawals will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["Type", "Amount", "Currency", "USD Value", "Status", "Date", "TX Hash"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(tx => (
                      <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={`text-xs ${typeColors[tx.type] ?? "bg-muted text-muted-foreground"}`}>{tx.type}</Badge>
                        </td>
                        <td className="py-3 px-4 font-mono whitespace-nowrap">
                          <span className={tx.type === "withdrawal" ? "text-destructive" : "text-success"}>
                            {tx.type === "withdrawal" ? "-" : "+"}{Number(tx.amount).toFixed(6)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{tx.currency}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">${Number(tx.usd_value).toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">{tx.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {tx.hash ? tx.hash.slice(0, 12) + "…" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">No transactions match your filter</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

