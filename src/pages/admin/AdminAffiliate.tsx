import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface AffiliateRow {
  id: string;
  user_id: string;
  user_email: string;
  referrals: number;
  total_commission: number;
}

export default function AdminAffiliate() {
  const [rates, setRates] = useState({ level1: 5, level2: 2, level3: 1 });
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, commissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Load affiliate links with referral counts
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id, user_id, referral_count, total_earned")
        .order("total_earned", { ascending: false })
        .limit(20);

      if (links && links.length > 0) {
        const userIds = links.map(l => l.user_id as string);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        const emailMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.email as string]));
        setRows(links.map(l => ({
          id: l.id as string,
          user_id: l.user_id as string,
          user_email: emailMap[l.user_id as string] ?? "—",
          referrals: Number(l.referral_count) || 0,
          total_commission: Number(l.total_earned) || 0,
        })));
        setStats({
          total: links.length,
          active: links.filter(l => Number(l.referral_count) > 0).length,
          commissions: links.reduce((s, l) => s + (Number(l.total_earned) || 0), 0),
        });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Affiliate Program Management</h2>
          <p className="text-sm text-muted-foreground">Configure multi-level referral commission rates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Affiliates", val: loading ? "—" : stats.total.toLocaleString(), icon: Users, color: "text-foreground" },
            { label: "Active Affiliates", val: loading ? "—" : stats.active.toLocaleString(), icon: TrendingUp, color: "text-success" },
            { label: "Total Commissions Paid", val: loading ? "—" : `${stats.commissions.toFixed(5)} ₿`, icon: DollarSign, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-3 bg-card">
              <div className="flex items-center gap-1 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Commission Config */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Commission Rate Configuration</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { level: "Level 1", key: "level1", desc: "Direct referral commission %" },
                { level: "Level 2", key: "level2", desc: "2nd-tier referral commission %" },
                { level: "Level 3", key: "level3", desc: "3rd-tier referral commission %" },
              ].map(l => (
                <div key={l.key}>
                  <Label className="text-sm font-normal mb-1.5 block">{l.level} Rate (%)</Label>
                  <Input
                    type="number"
                    value={rates[l.key as keyof typeof rates]}
                    onChange={e => setRates(r => ({ ...r, [l.key]: Number(e.target.value) }))}
                    min={0}
                    max={20}
                    step={0.5}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                </div>
              ))}
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Commission rates updated.")}>
              Save Rates
            </Button>
          </CardContent>
        </Card>

        {/* Top Affiliates */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Top Affiliates</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["User", "Referrals", "Total Commission"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={3} className="py-3 px-3"><Skeleton className="h-4 w-full bg-muted" /></td></tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">No affiliate activity yet</td></tr>
                  ) : rows.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{r.user_email}</td>
                      <td className="py-3 px-3 font-mono text-foreground whitespace-nowrap">{r.referrals}</td>
                      <td className="py-3 px-3 font-mono text-primary whitespace-nowrap">{r.total_commission.toFixed(8)} ₿</td>
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
