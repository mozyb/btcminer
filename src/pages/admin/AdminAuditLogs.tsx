import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { auditLogs } from "@/lib/mockData";
import { Search, Download, Shield } from "lucide-react";
import { toast } from "sonner";

const allLogs = [
  ...auditLogs,
  { id: "al6", user: "support@btcminer.online", action: "REPLIED_TICKET", target: "Ticket #0039", ip: "10.0.0.8", time: "2024-03-11 17:22" },
  { id: "al7", user: "admin@btcminer.online", action: "SUSPENDED_USER", target: "carlos@example.com", ip: "192.168.1.1", time: "2024-03-11 15:14" },
  { id: "al8", user: "finance@btcminer.online", action: "REJECTED_WITHDRAWAL", target: "w3 — bob@example.com", ip: "10.0.0.5", time: "2024-03-11 09:08" },
  { id: "al9", user: "admin@btcminer.online", action: "ADDED_API", target: "Luxor Mining API", ip: "192.168.1.1", time: "2024-03-10 20:00" },
  { id: "al10", user: "admin@btcminer.online", action: "UPDATED_CONTRACT", target: "Starter SHA-256", ip: "192.168.1.1", time: "2024-03-10 18:45" },
];

const actionColors: Record<string, string> = {
  APPROVED: "text-success",
  REJECTED: "text-destructive",
  SUSPENDED: "text-destructive",
  MODIFIED: "text-warning",
  UPDATED: "text-warning",
  ADDED: "text-primary",
  CLOSED: "text-muted-foreground",
  REPLIED: "text-info",
};

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const users = [...new Set(allLogs.map(l => l.user))];

  const filtered = allLogs.filter(l => {
    const matchS = l.action.includes(search.toUpperCase()) || l.target.toLowerCase().includes(search.toLowerCase()) || l.user.includes(search.toLowerCase());
    const matchU = userFilter === "all" || l.user === userFilter;
    return matchS && matchU;
  });

  const getActionColor = (action: string) => {
    const key = Object.keys(actionColors).find(k => action.startsWith(k));
    return key ? actionColors[key] : "text-foreground";
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Audit Logs</h2>
            <p className="text-sm text-muted-foreground">{allLogs.length} events recorded · full admin activity trail</p>
          </div>
          <Button variant="outline" className="gap-2 text-sm" onClick={() => toast.success("Audit log exported as CSV.")}>
            <Download className="w-4 h-4" />Export CSV
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search actions, targets, users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All admins" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Admins</SelectItem>
              {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Timestamp", "Admin", "Action", "Target", "IP Address"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(log => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{log.time}</td>
                      <td className="py-3 px-4 text-sm text-foreground whitespace-nowrap">{log.user}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Shield className={`w-3 h-3 shrink-0 ${getActionColor(log.action)}`} />
                          <span className={`font-mono text-xs font-medium ${getActionColor(log.action)}`}>{log.action}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{log.target}</td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">No audit logs found</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
