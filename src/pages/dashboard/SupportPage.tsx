import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supportCategories } from "@/lib/mockData";
import { LifeBuoy, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const mockTickets = [
  { id: "T-0041", subject: "Withdrawal not received", category: "Withdrawal", status: "open", priority: "high", created: "2024-03-10", lastReply: "2024-03-12" },
  { id: "T-0038", subject: "Contract not showing hashrate", category: "Technical Issue", status: "resolved", priority: "medium", created: "2024-03-05", lastReply: "2024-03-07" },
];

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground",
};
const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground",
};

export default function SupportPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "", priority: "medium", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowNew(false);
    toast.success("Support ticket created. We'll respond within 24 hours.");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Support Center</h2>
            <p className="text-sm text-muted-foreground">Get help from our 24/7 support team</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => setShowNew(!showNew)}>
            <Plus className="w-4 h-4" />New Ticket
          </Button>
        </div>

        {showNew && (
          <Card className="bg-card border-border border-primary/30">
            <CardHeader><CardTitle className="text-sm">Open Support Ticket</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Subject</Label>
                  <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Category</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {supportCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Message</Label>
                  <Textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required className="resize-none" />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">Submit Ticket</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">My Tickets</CardTitle></CardHeader>
          <CardContent>
            {mockTickets.length > 0 ? (
              <div className="space-y-3">
                {mockTickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-border rounded hover:bg-muted/20 cursor-pointer">
                    <div className="flex items-start gap-3 min-w-0">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                        <p className="text-xs text-muted-foreground">{t.id} · {t.category} · Last reply: {t.lastReply}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge className={`text-xs ${priorityColors[t.priority]}`}>{t.priority}</Badge>
                      <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <LifeBuoy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No support tickets yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
