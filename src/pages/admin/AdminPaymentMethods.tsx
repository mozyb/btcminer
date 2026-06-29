import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layouts/AdminLayout";
import { getAllPaymentMethods, updatePaymentMethod, type PaymentMethod } from "@/lib/api";
import { Pencil, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Zap, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editMode, setEditMode] = useState<"manual" | "automatic">("manual");
  const [editInstructions, setEditInstructions] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editNetworkTag, setEditNetworkTag] = useState("");
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPaymentMethods();
      setMethods(data);
    } catch {
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setEditMode(m.mode);
    setEditInstructions(m.instructions ?? "");
    setEditAddress(m.admin_address ?? "");
    setEditDisplayName(m.display_name);
    setEditNetworkTag(m.network_tag ?? "");
    setEditActive(m.is_active);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updatePaymentMethod(editing.id, {
        mode: editMode,
        instructions: editInstructions || null,
        admin_address: editAddress || null,
        display_name: editDisplayName,
        network_tag: editNetworkTag || null,
        is_active: editActive,
      });
      setMethods(ms => ms.map(m => m.id === editing.id ? {
        ...m, mode: editMode, instructions: editInstructions || null,
        admin_address: editAddress || null, display_name: editDisplayName,
        network_tag: editNetworkTag || null, is_active: editActive,
      } : m));
      toast.success(`${editDisplayName} updated successfully.`);
      setEditing(null);
    } catch {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Quick mode toggle without opening the dialog
  const toggleMode = async (m: PaymentMethod) => {
    const newMode = m.mode === "manual" ? "automatic" : "manual";
    try {
      await updatePaymentMethod(m.id, { mode: newMode });
      setMethods(ms => ms.map(x => x.id === m.id ? { ...x, mode: newMode } : x));
      toast.success(`${m.display_name} switched to ${newMode} mode.`);
    } catch {
      toast.error("Failed to toggle mode.");
    }
  };

  const deposits = methods.filter(m => m.direction === "deposit");
  const withdrawals = methods.filter(m => m.direction === "withdrawal");

  const renderTable = (items: PaymentMethod[], title: string, icon: React.ReactNode) => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
          <span className="text-muted-foreground font-normal">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Currency", "Name / Network", "Mode", "Admin Address", "Active", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="py-3 px-4 font-mono font-medium text-foreground whitespace-nowrap">{m.currency}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <p className="text-foreground text-xs font-medium">{m.display_name}</p>
                      {m.network_tag && <p className="text-muted-foreground text-xs">{m.network_tag}</p>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleMode(m)}
                        title={`Switch to ${m.mode === "manual" ? "automatic" : "manual"} mode`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:opacity-80 active:scale-95 ${
                          m.mode === "manual"
                            ? "bg-warning/10 text-warning border-warning/30"
                            : "bg-success/10 text-success border-success/30"
                        }`}
                      >
                        {m.mode === "manual" ? (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            <Clock className="w-3 h-3" />
                            Manual
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            <Zap className="w-3 h-3" />
                            Auto
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap max-w-[180px] truncate">
                      {m.admin_address ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Switch
                        checked={m.is_active}
                        onCheckedChange={async (v) => {
                          try {
                            await updatePaymentMethod(m.id, { is_active: v });
                            setMethods(ms => ms.map(x => x.id === m.id ? { ...x, is_active: v } : x));
                            toast.success(`${m.display_name} ${v ? "enabled" : "disabled"}.`);
                          } catch { toast.error("Failed to update."); }
                        }}
                      />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Button size="sm" variant="outline" className="h-7 px-2 gap-1 text-xs" onClick={() => openEdit(m)}>
                        <Pencil className="w-3 h-3" />Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment Methods</h2>
            <p className="text-sm text-muted-foreground">
              Toggle between manual and automatic processing for each currency and direction.
              Click the mode badge to quickly switch, or use Edit for full settings.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-8" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </Button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded text-sm">
          <div className="shrink-0 mt-0.5">
            <div className="flex gap-2">
              <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1"><Clock className="w-3 h-3" />Manual</Badge>
              <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1"><Zap className="w-3 h-3" />Automatic</Badge>
            </div>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            <strong className="text-foreground">Manual mode</strong> — users submit a request and admin approves. No receipt or hash required from users.
            Deposit shows your wallet address; withdrawal collects user's destination address.
            Admin receives an email + in-app notification for every request.<br />
            <strong className="text-foreground">Automatic mode</strong> — reserved for future payment gateway integration.
          </p>
        </div>

        {renderTable(deposits, "Deposit Methods", <ArrowDownToLine className="w-4 h-4 text-success" />)}
        {renderTable(withdrawals, "Withdrawal Methods", <ArrowUpFromLine className="w-4 h-4 text-destructive" />)}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={v => !v && setEditing(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit — {editing?.display_name} ({editing?.direction})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Display Name</Label>
              <Input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Network / Tag</Label>
              <Input value={editNetworkTag} onChange={e => setEditNetworkTag(e.target.value)} placeholder="e.g. ERC-20, TRC-20, Bitcoin Network" />
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Mode</Label>
              <Select value={editMode} onValueChange={v => setEditMode(v as "manual" | "automatic")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (admin reviews each request)</SelectItem>
                  <SelectItem value="automatic">Automatic (payment gateway)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing?.direction === "deposit" && (
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Admin Wallet Address (shown to users)</Label>
                <Input
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  className="font-mono text-xs"
                  placeholder="Your receiving wallet address"
                />
              </div>
            )}
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Instructions (shown to users)</Label>
              <Textarea
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                rows={3}
                placeholder="Instructions displayed to the user during deposit/withdrawal"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editActive} onCheckedChange={setEditActive} id="active-toggle" />
              <Label htmlFor="active-toggle" className="text-sm font-normal cursor-pointer">
                Method active (visible to users)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
