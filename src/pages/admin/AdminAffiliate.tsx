import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";
import { affiliateStats } from "@/lib/mockData";
import { Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminAffiliate() {
  const [rates, setRates] = useState({ level1: affiliateStats.level1Rate, level2: affiliateStats.level2Rate, level3: affiliateStats.level3Rate });

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
            { label: "Total Affiliates", val: "1,284", icon: Users, color: "text-foreground" },
            { label: "Active Affiliates", val: "892", icon: TrendingUp, color: "text-success" },
            { label: "Total Commissions Paid", val: "8.421 ₿", icon: DollarSign, color: "text-primary" },
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
                    {["User", "Referrals", "Active", "Commissions Earned", "Paid Out", "Pending"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {affiliateStats.referrals.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">{r.user}</td>
                      <td className="py-3 px-3 font-mono text-foreground whitespace-nowrap">{r.contracts * 3}</td>
                      <td className="py-3 px-3 font-mono text-success whitespace-nowrap">{r.contracts * 2}</td>
                      <td className="py-3 px-3 font-mono text-primary whitespace-nowrap">{r.commission.toFixed(5)} ₿</td>
                      <td className="py-3 px-3 font-mono text-success whitespace-nowrap">{(r.commission * 0.8).toFixed(5)} ₿</td>
                      <td className="py-3 px-3 font-mono text-warning whitespace-nowrap">{(r.commission * 0.2).toFixed(5)} ₿</td>
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
