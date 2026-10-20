import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { RefreshCw, Download, ShieldCheck, MailX, ToggleLeft } from "lucide-react";

interface ConsentRecord {
  id: string;
  email: string;
  marketing_optin: boolean;
  educational_optin: boolean;
  promotional_optin: boolean;
  product_updates_optin: boolean;
  newsletter_optin: boolean;
  double_opted_in: boolean;
  unsubscribed_all: boolean;
  unsubscribed_at: string | null;
  consent_source: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminComplianceConsent() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [doubleOptIn, setDoubleOptIn] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("email_consent").select("*").order("created_at", { ascending: false });
    setRecords(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => {
    if (filter === "opted_out") return r.unsubscribed_all;
    if (filter === "double_opted") return r.double_opted_in;
    if (filter === "marketing_off") return !r.marketing_optin && !r.unsubscribed_all;
    return true;
  });

  const exportCSV = () => {
    const rows = [["Email", "Marketing", "Educational", "Promotional", "Updates", "Newsletter", "Double Opted In", "Unsubscribed", "Source", "Date"]];
    filtered.forEach(r => rows.push([
      r.email,
      r.marketing_optin ? "yes" : "no",
      r.educational_optin ? "yes" : "no",
      r.promotional_optin ? "yes" : "no",
      r.product_updates_optin ? "yes" : "no",
      r.newsletter_optin ? "yes" : "no",
      r.double_opted_in ? "yes" : "no",
      r.unsubscribed_all ? new Date(r.unsubscribed_at ?? "").toLocaleDateString() : "no",
      r.consent_source ?? "",
      new Date(r.created_at).toLocaleDateString(),
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "consent_audit.csv";
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Compliance & Consent</h2>
            <p className="text-sm text-muted-foreground">Email consent tracking and compliance management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5" /> Export Audit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records", value: records.length },
            { label: "Marketing Opted In", value: records.filter(r => r.marketing_optin && !r.unsubscribed_all).length },
            { label: "Unsubscribed", value: records.filter(r => r.unsubscribed_all).length },
            { label: "Double Opted In", value: records.filter(r => r.double_opted_in).length },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="records">
          <TabsList>
            <TabsTrigger value="records">Consent Records</TabsTrigger>
            <TabsTrigger value="settings">Global Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Records</SelectItem>
                  <SelectItem value="opted_out">Unsubscribed</SelectItem>
                  <SelectItem value="double_opted">Double Opted In</SelectItem>
                  <SelectItem value="marketing_off">Marketing Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {["Email", "Marketing", "Educational", "Promo", "Newsletter", "Double Opt-In", "Status", "Source", "Date"].map(h => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {Array.from({ length: 9 }).map((__, j) => <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-14" /></td>)}
                        </tr>
                      )) : filtered.length === 0 ? (
                        <tr><td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">No consent records</td></tr>
                      ) : filtered.map(r => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">{r.email}</td>
                          {[r.marketing_optin, r.educational_optin, r.promotional_optin, r.newsletter_optin].map((v, i) => (
                            <td key={i} className="py-3 px-4 whitespace-nowrap">
                              <Badge className={v ? "bg-green-500/10 text-green-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                                {v ? "On" : "Off"}
                              </Badge>
                            </td>
                          ))}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={r.double_opted_in ? "bg-green-500/10 text-green-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                              {r.double_opted_in ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {r.unsubscribed_all
                              ? <Badge className="bg-destructive/10 text-destructive text-xs">Unsubscribed</Badge>
                              : <Badge className="bg-green-500/10 text-green-500 text-xs">Active</Badge>}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">{r.consent_source ?? "—"}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Compliance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Double Opt-In</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Send a confirmation email before adding leads to marketing lists</p>
                  </div>
                  <Switch checked={doubleOptIn} onCheckedChange={v => { setDoubleOptIn(v); toast.success(v ? "Double opt-in enabled" : "Double opt-in disabled"); }} />
                </div>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Platform Compliance Rules</p>
                  {[
                    { icon: <MailX className="w-4 h-4 text-green-500" />, title: "Unsubscribe Link", desc: "All marketing emails include a one-click unsubscribe link in the footer" },
                    { icon: <ShieldCheck className="w-4 h-4 text-green-500" />, title: "Transactional Separation", desc: "Transactional emails (receipts, security) are sent regardless of marketing preferences" },
                    { icon: <ToggleLeft className="w-4 h-4 text-green-500" />, title: "Preference Center", desc: "Users can manage individual email category preferences from their account settings" },
                  ].map(r => (
                    <div key={r.title} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                      <div className="mt-0.5 shrink-0">{r.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
