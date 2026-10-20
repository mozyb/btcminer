import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Copy, Users, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AffiliatePage() {
  const { user } = useAuth();
  // Referral code derived from user id — no mock data
  const referralCode = user?.id ? `BTCM-${user.id.slice(0, 6).toUpperCase()}` : "—";
  const link = `https://btcminer.online/register?ref=${referralCode}`;

  // Commission rates (static platform config)
  const level1Rate = 5;
  const level2Rate = 2;
  const level3Rate = 1;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats — all zero until real referral tracking is implemented */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Referrals", val: "0", icon: Users, color: "text-foreground" },
            { label: "Active Referrals", val: "0", icon: TrendingUp, color: "text-success" },
            { label: "Total Earned", val: "0.00000 ₿", icon: DollarSign, color: "text-primary" },
            { label: "Pending", val: "0.00000 ₿", icon: DollarSign, color: "text-warning" },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className={`text-xl font-bold font-mono ${s.color}`}>{s.val}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Link */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Your Referral Link</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded p-3">
              <p className="font-mono text-xs text-foreground flex-1 truncate">{link}</p>
              <Button
                variant="ghost" size="sm"
                className="shrink-0 gap-1 text-xs"
                onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied!"); }}
              >
                <Copy className="w-3.5 h-3.5" />Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Code: <span className="font-mono font-bold text-primary">{referralCode}</span></p>
          </CardContent>
        </Card>

        {/* Commission Rates */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Commission Structure</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { level: "Level 1", rate: `${level1Rate}%`, desc: "Direct referrals" },
                { level: "Level 2", rate: `${level2Rate}%`, desc: "2nd tier" },
                { level: "Level 3", rate: `${level3Rate}%`, desc: "3rd tier" },
              ].map(l => (
                <div key={l.level} className="border border-border rounded p-4">
                  <p className="text-3xl font-bold font-mono text-primary mb-1">{l.rate}</p>
                  <p className="text-sm font-medium text-foreground">{l.level}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empty referral table */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Referred Users</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-10 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No referrals yet</p>
              <p className="text-xs mt-1">Share your link to start earning commissions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}