import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/components/layouts/AdminLayout";
import { miningContracts } from "@/lib/mockData";
import { Search, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export default function AdminContracts() {
  const [search, setSearch] = useState("");
  const [algoFilter, setAlgoFilter] = useState("all");
  const [contracts, setContracts] = useState(miningContracts.map(c => ({ ...c, active: true })));
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<typeof contracts[0] | null>(null);

  const filtered = contracts.filter(c => {
    const matchS = c.name.toLowerCase().includes(search.toLowerCase());
    const matchA = algoFilter === "all" || c.algorithm === algoFilter;
    return matchS && matchA;
  });

  const toggleActive = (id: string) => {
    setContracts(cs => cs.map(c => c.id === id ? { ...c, active: !c.active } : c));
    toast.success("Contract status updated.");
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Contract Management</h2>
            <p className="text-sm text-muted-foreground">{contracts.length} contract templates</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => toast.info("Contract editor coming soon")}>
            <Plus className="w-4 h-4" />New Contract
          </Button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={algoFilter} onValueChange={setAlgoFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Algorithms</SelectItem>
              <SelectItem value="SHA-256">SHA-256</SelectItem>
              <SelectItem value="Scrypt">Scrypt</SelectItem>
              <SelectItem value="Kadena">Kadena</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Contract", "Algorithm", "Hashrate", "Duration", "Price", "Availability", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.coin}</p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-muted text-muted-foreground text-xs">{c.algorithm}</Badge></td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{c.hashrate} {c.hashrateUnit}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{c.duration}d</td>
                      <td className="py-3 px-4 font-mono text-primary whitespace-nowrap">${c.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{c.availability}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className={`text-xs ${c.active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>{c.active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditTarget(c); setEditOpen(true); }}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleActive(c.id)}>
                            {c.active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle>Edit Contract: {editTarget?.name}</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs font-normal mb-1 block">Price ($)</Label>
                <Input type="number" defaultValue={editTarget.totalPrice} />
              </div>
              <div>
                <Label className="text-xs font-normal mb-1 block">Availability (slots)</Label>
                <Input type="number" defaultValue={editTarget.availability} />
              </div>
              <div>
                <Label className="text-xs font-normal mb-1 block">Maintenance Fee</Label>
                <Input type="number" defaultValue={editTarget.maintenanceFee} step="0.0001" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditOpen(false); toast.success("Contract updated."); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
