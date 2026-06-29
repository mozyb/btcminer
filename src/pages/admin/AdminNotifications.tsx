import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Bell, Plus, Send, Users } from "lucide-react";
import { toast } from "sonner";

const sentNotifications = [
  { id: "sn1", title: "Scheduled Maintenance", message: "Platform will undergo maintenance on March 15 from 02:00–04:00 UTC.", audience: "All Users", sent: "2024-03-10", reach: 28471 },
  { id: "sn2", title: "New Hashrate Contracts Available", message: "Industrial PH and Elite SHA-256 contracts are now available in the marketplace.", audience: "Active Users", sent: "2024-03-08", reach: 6842 },
  { id: "sn3", title: "Withdrawal System Upgrade", message: "We have upgraded our withdrawal processing system for faster transactions.", audience: "All Users", sent: "2024-03-05", reach: 28471 },
];

export default function AdminNotifications() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", audience: "all", channel: "in_app" });

  const handleSend = () => {
    toast.success(`Notification sent to ${form.audience === "all" ? "all users" : "active users"}.`);
    setComposeOpen(false);
    setForm({ title: "", message: "", audience: "all", channel: "in_app" });
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Notification Management</h2>
            <p className="text-sm text-muted-foreground">Send system announcements to users</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => setComposeOpen(true)}>
            <Plus className="w-4 h-4" />New Notification
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Notifications Sent", val: "142", sub: "this month" },
            { label: "Total Reach", val: "28,471", sub: "unique users" },
            { label: "Avg Open Rate", val: "68.4%", sub: "in-app" },
          ].map(s => (
            <div key={s.label} className="border border-border rounded p-3 bg-card">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold font-mono text-primary">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Sent History */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Notification History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sentNotifications.map(n => (
              <div key={n.id} className="border border-border rounded p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary shrink-0" />
                    <p className="font-medium text-foreground text-sm">{n.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className="bg-muted text-muted-foreground text-xs">{n.audience}</Badge>
                    <span className="text-xs text-muted-foreground">{n.sent}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground ml-6 text-pretty">{n.message}</p>
                <div className="flex items-center gap-1 ml-6 mt-2">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{n.reach.toLocaleString()} recipients</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-normal mb-1 block">Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
            </div>
            <div>
              <Label className="text-xs font-normal mb-1 block">Message</Label>
              <Textarea rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Notification message..." className="resize-none text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-normal mb-1 block">Target Audience</Label>
                <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="kyc">KYC Verified</SelectItem>
                    <SelectItem value="new">New Users (7d)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-normal mb-1 block">Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                    <SelectItem value="email">Email + In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={handleSend}>
              <Send className="w-4 h-4" />Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
