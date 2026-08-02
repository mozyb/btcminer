import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { miningHardware } from "@/lib/mockData";
import { Search, Plus, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AdminHardware() {
  const [search, setSearch] = useState("");
  const [mfgFilter, setMfgFilter] = useState("all");

  const filtered = miningHardware.filter(h => {
    const matchS = h.name.toLowerCase().includes(search.toLowerCase()) || h.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchM = mfgFilter === "all" || h.manufacturer === mfgFilter;
    return matchS && matchM;
  });

  const totalUnits = miningHardware.reduce((s, h) => s + h.count, 0);
  const totalHashrate = miningHardware.reduce((s, h) => s + h.hashrate * h.count, 0);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Hardware Inventory</h2>
            <p className="text-sm text-muted-foreground">{totalUnits.toLocaleString()} units · {(totalHashrate / 1000000).toFixed(2)} EH/s total</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => toast.info("Hardware form coming soon")}>
            <Plus className="w-4 h-4" />Add Hardware
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {["Bitmain", "MicroBT", "Canaan"].map(mfg => {
            const hw = miningHardware.filter(h => h.manufacturer === mfg);
            const units = hw.reduce((s, h) => s + h.count, 0);
            return (
              <div key={mfg} className="border border-border rounded p-3 bg-card">
                <p className="text-xs text-muted-foreground">{mfg}</p>
                <p className="text-xl font-bold font-mono text-primary">{units.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{hw.length} models</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search hardware..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={mfgFilter} onValueChange={setMfgFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="Bitmain">Bitmain</SelectItem>
              <SelectItem value="MicroBT">MicroBT</SelectItem>
              <SelectItem value="Canaan">Canaan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Model", "Manufacturer", "Algorithm", "Hashrate", "Power (W)", "Efficiency", "Units", "Farm", "Status"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(hw => (
                    <tr key={hw.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground whitespace-nowrap">{hw.name}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{hw.manufacturer}</td>
                      <td className="py-3 px-4 whitespace-nowrap"><Badge className="bg-muted text-muted-foreground text-xs">{hw.algorithm}</Badge></td>
                      <td className="py-3 px-4 font-mono text-primary whitespace-nowrap">{hw.hashrate} {hw.hashrateUnit}</td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{hw.power.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-foreground whitespace-nowrap">{hw.efficiency} J/TH</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground whitespace-nowrap">{hw.count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">{hw.farm}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge className="bg-success/10 text-success border-success/20 text-xs">{hw.status}</Badge>
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
