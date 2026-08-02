import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  usd_value: number | null;
  status: string;
  show_as_proof: boolean;
  created_at: string;
}

export default function AdminPayoutProofs() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProof, setFilterProof] = useState<"all" | "proof">("all");

  const load = async () => {
    setLoading(true);
    const query = supabase
      .from("transactions")
      .select("id, user_id, amount, currency, usd_value, status, show_as_proof, created_at")
      .eq("type", "withdrawal")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data } = await query;
    setTxns(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (t: Transaction) => {
    const { error } = await supabase.from("transactions").update({ show_as_proof: !t.show_as_proof }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success(t.show_as_proof ? "Removed from payout proofs" : "Added to payout proofs");
    load();
  };

  const filtered = filterProof === "proof" ? txns.filter(t => t.show_as_proof) : txns;
  const proofCount = txns.filter(t => t.show_as_proof).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payout Proofs</h1>
          <p className="text-sm text-muted-foreground mt-1">Control which confirmed withdrawals are publicly displayed as payout proofs</p>
        </div>
        <Badge className="bg-success/10 text-success border-success/20">{proofCount} visible proofs</Badge>
      </div>

      <div className="flex gap-2">
        {(["all", "proof"] as const).map(f => (
          <button key={f} onClick={() => setFilterProof(f)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${filterProof === f ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
            {f === "all" ? "All Withdrawals" : "Proof Only"}
          </button>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Transaction ID", "Amount", "Currency", "USD Value", "Date", "Show as Proof"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${t.show_as_proof ? "bg-success/5" : ""}`}>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{t.id.slice(0, 16)}…</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">{t.amount.toFixed(6)}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-primary/10 text-primary border-primary/20">{t.currency}</Badge></td>
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">{t.usd_value ? `$${t.usd_value.toFixed(2)}` : "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggle(t)}>
                          {t.show_as_proof
                            ? <CheckCircle className="w-4 h-4 text-success" />
                            : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
