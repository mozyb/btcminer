import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Search, RefreshCw, Mail, UserPlus, Download, Tag, Trash2 } from "lucide-react";

interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  source: string;
  status: string;
  tags: string[];
  opted_in: boolean;
  created_at: string;
}

export default function AdminLeadCapture() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load leads");
    else setLeads(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return !q || l.email.toLowerCase().includes(q) || (l.first_name ?? "").toLowerCase().includes(q);
  });

  const sendWelcome = async (lead: Lead) => {
    setActionLoading(lead.id + "-welcome");
    const { error } = await supabase.functions.invoke("marketing-automation", {
      body: { action: "capture_lead", email: lead.email, first_name: lead.first_name ?? undefined, source: "manual_resend" },
    });
    if (error) toast.error("Failed to send welcome email");
    else toast.success("Welcome email sent to " + lead.email);
    setActionLoading(null);
  };

  const deleteLead = async (id: string) => {
    setActionLoading(id + "-delete");
    const { error } = await supabase.from("email_leads").delete().eq("id", id);
    if (error) toast.error("Failed to delete lead");
    else { setLeads(prev => prev.filter(l => l.id !== id)); toast.success("Lead deleted"); }
    setActionLoading(null);
  };

  const exportCSV = () => {
    const rows = [["Email", "First Name", "Source", "Status", "Tags", "Opted In", "Date"]];
    filtered.forEach(l => rows.push([
      l.email, l.first_name ?? "", l.source, l.status,
      (l.tags ?? []).join(";"), l.opted_in ? "yes" : "no",
      new Date(l.created_at).toLocaleDateString(),
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = "leads.csv";
    a.click();
  };

  const statusColor = (s: string) => s === "converted" ? "bg-green-500/10 text-green-500" :
    s === "unsubscribed" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Lead Capture</h2>
            <p className="text-sm text-muted-foreground">{leads.length} captured · {leads.filter(l => l.status === "converted").length} converted</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={exportCSV}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={load} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Leads", value: leads.length },
            { label: "Converted", value: leads.filter(l => l.status === "converted").length },
            { label: "Opted In", value: leads.filter(l => l.opted_in).length },
            { label: "Unsubscribed", value: leads.filter(l => l.status === "unsubscribed").length },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by email or name…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Email", "Name", "Source", "Status", "Tags", "Opted In", "Date", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="py-3 px-4"><Skeleton className="h-4 bg-muted rounded w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-muted-foreground text-sm">No leads found</td></tr>
                  ) : filtered.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">{l.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">{l.first_name ?? "—"}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="outline" className="text-xs capitalize">{l.source}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs capitalize ${statusColor(l.status)}`}>{l.status}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex gap-1 flex-wrap">
                          {(l.tags ?? []).map(t => (
                            <Badge key={t} variant="outline" className="text-xs">
                              <Tag className="w-2.5 h-2.5 mr-1" />{t}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={l.opted_in ? "bg-green-500/10 text-green-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                          {l.opted_in ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(l.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                            onClick={() => sendWelcome(l)}
                            disabled={actionLoading === l.id + "-welcome"} title="Send welcome email">
                            {actionLoading === l.id + "-welcome" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-blue-500 hover:bg-blue-500/10"
                            title="Mark as converted" onClick={async () => {
                              await supabase.from("email_leads").update({ status: "converted" }).eq("id", l.id);
                              setLeads(prev => prev.map(x => x.id === l.id ? { ...x, status: "converted" } : x));
                            }}>
                            <UserPlus className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteLead(l.id)} disabled={actionLoading === l.id + "-delete"}>
                            {actionLoading === l.id + "-delete" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
                      </td>
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
