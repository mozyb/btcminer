import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { apiConfigs } from "@/lib/mockData";
import { Plus, Activity, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  Blockchain: "bg-primary/10 text-primary border-primary/20",
  "Price Data": "bg-info/10 text-info border-info/20",
  "Mining Pool": "bg-success/10 text-success border-success/20",
  Payment: "bg-warning/10 text-warning border-warning/20",
};

export default function AdminAPIs() {
  const [apis, setApis] = useState(apiConfigs);
  const [addOpen, setAddOpen] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", provider: "", endpoint: "", type: "Blockchain", apiKey: "" });

  const testConnection = async (id: string) => {
    toast.loading("Testing connection...");
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Connection successful!");
  };

  const handleAdd = () => {
    const newApi = { id: `a${apis.length + 1}`, ...form, status: "active", priority: 1, rateLimit: "10/s", health: 100 };
    setApis(a => [...a, newApi]);
    setAddOpen(false);
    setForm({ name: "", provider: "", endpoint: "", type: "Blockchain", apiKey: "" });
    toast.success("API added successfully.");
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">API Management Center</h2>
            <p className="text-sm text-muted-foreground">{apis.length} API integrations configured</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />Add API
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apis.map(api => (
            <Card key={api.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{api.name}</p>
                    <p className="text-xs text-muted-foreground">{api.provider}</p>
                  </div>
                  <Badge className={`text-xs ${typeColors[api.type] ?? "bg-muted text-muted-foreground"}`}>{api.type}</Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-muted/30 border border-border rounded px-2 py-1">
                    <p className="text-xs font-mono text-muted-foreground truncate">{api.endpoint}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div><p className="text-muted-foreground">Priority</p><p className="font-mono text-foreground">{api.priority}</p></div>
                  <div><p className="text-muted-foreground">Rate Limit</p><p className="font-mono text-foreground">{api.rateLimit}</p></div>
                  <div>
                    <p className="text-muted-foreground">Health</p>
                    <p className={`font-mono ${api.health >= 99 ? "text-success" : api.health >= 95 ? "text-warning" : "text-destructive"}`}>{api.health}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => testConnection(api.id)}>
                    <RefreshCw className="w-3 h-3" />Test
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => toast.info("API logs coming soon")}>
                    <Activity className="w-3 h-3" />Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Add New API Integration</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div><Label className="text-xs font-normal mb-1 block">API Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label className="text-xs font-normal mb-1 block">Provider</Label><Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} /></div>
            <div><Label className="text-xs font-normal mb-1 block">Endpoint URL</Label><Input value={form.endpoint} onChange={e => setForm(f => ({ ...f, endpoint: e.target.value }))} /></div>
            <div>
              <Label className="text-xs font-normal mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Blockchain", "Price Data", "Mining Pool", "Payment", "Analytics"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-normal mb-1 block">API Key</Label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className="pr-10" />
                <button type="button" onClick={() => setShowKey(s => s ? null : "new")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAdd}>Add API</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
