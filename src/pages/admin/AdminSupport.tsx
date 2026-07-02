import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supportCategories } from "@/lib/mockData";
import { MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";

const adminTickets = [
  { id: "T-0041", user: "alice@example.com", subject: "Withdrawal not received", category: "Withdrawal", status: "open", priority: "high", created: "2024-03-10", lastReply: "2024-03-12", messages: [{ from: "alice", text: "I have not received my withdrawal of 0.05 BTC requested 2 days ago.", time: "2024-03-10 14:22" }, { from: "support", text: "Hello Alice, we are looking into this. Can you provide the transaction hash?", time: "2024-03-12 10:15" }] },
  { id: "T-0038", user: "ethan@example.com", subject: "Contract not showing hashrate", category: "Technical Issue", status: "resolved", priority: "medium", created: "2024-03-05", lastReply: "2024-03-07", messages: [{ from: "ethan", text: "My Pro contract doesn't show any hashrate in the dashboard.", time: "2024-03-05 09:00" }, { from: "support", text: "This has been resolved. The dashboard should now reflect your active hashrate.", time: "2024-03-07 11:30" }] },
  { id: "T-0039", user: "bob@example.com", subject: "KYC document rejected", category: "KYC Verification", status: "open", priority: "low", created: "2024-03-08", lastReply: "2024-03-08", messages: [{ from: "bob", text: "My passport was rejected. What was wrong with it?", time: "2024-03-08 16:00" }] },
];

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground",
};
const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState(adminTickets);
  const [selected, setSelected] = useState<typeof adminTickets[0] | null>(null);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = tickets.filter(t => filter === "all" || t.status === filter);
  const open = tickets.filter(t => t.status === "open").length;

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    const newMsg = { from: "support", text: reply, time: new Date().toLocaleString() };
    setTickets(ts => ts.map(t => t.id === selected.id ? { ...t, messages: [...t.messages, newMsg] } : t));
    setSelected(s => s ? { ...s, messages: [...s.messages, newMsg] } : s);
    setReply("");
    toast.success("Reply sent.");
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Support Ticket Management</h2>
            <p className="text-sm text-muted-foreground">{open > 0 && <span className="text-warning font-medium">{open} open · </span>}{tickets.length} total</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={`grid gap-4 ${selected ? "md:grid-cols-2" : ""}`}>
          <div className="space-y-2">
            {filtered.map(t => (
              <Card
                key={t.id}
                className={`bg-card border-border cursor-pointer hover:border-primary/30 transition-colors ${selected?.id === t.id ? "border-primary/50" : ""}`}
                onClick={() => setSelected(t)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-muted-foreground">{t.id}</p>
                        <Badge className={`text-xs ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-0.5 truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground">{t.user} · {t.category}</p>
                    </div>
                    <Badge className={`text-xs shrink-0 ${statusColors[t.status] ?? "bg-muted text-muted-foreground"}`}>{t.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selected && (
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-foreground">{selected.subject}</p>
                    <p className="text-xs text-muted-foreground">{selected.id} · {selected.user}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selected.messages.map((m, i) => (
                    <div key={i} className={`p-2.5 rounded text-xs ${m.from === "support" ? "bg-primary/10 border border-primary/20 ml-4" : "bg-muted/30 border border-border mr-4"}`}>
                      <p className={`font-medium mb-1 ${m.from === "support" ? "text-primary" : "text-foreground"}`}>{m.from === "support" ? "Support Agent" : selected.user}</p>
                      <p className="text-muted-foreground">{m.text}</p>
                      <p className="text-muted-foreground/60 mt-1">{m.time}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Textarea rows={3} placeholder="Type your reply..." value={reply} onChange={e => setReply(e.target.value)} className="resize-none text-sm" />
                  <div className="flex gap-2">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 text-xs" onClick={sendReply}>
                      <Send className="w-3 h-3" />Reply
                    </Button>
                    <Button variant="outline" className="text-xs" onClick={() => { setTickets(ts => ts.map(t => t.id === selected.id ? { ...t, status: "resolved" } : t)); setSelected(null); toast.success("Ticket resolved."); }}>
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
