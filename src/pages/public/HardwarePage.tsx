import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PublicLayout from "@/components/layouts/PublicLayout";
import { miningHardware } from "@/lib/mockData";
import { Cpu } from "lucide-react";

const logoColors: Record<string, string> = {
  Bitmain: "bg-primary/10 text-primary border-primary/20",
  MicroBT: "bg-info/10 text-info border-info/20",
  Canaan: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export default function HardwarePage() {
  const [manufacturer, setManufacturer] = useState("all");
  const [algo, setAlgo] = useState("all");

  const filtered = miningHardware.filter(hw => {
    const matchM = manufacturer === "all" || hw.manufacturer === manufacturer;
    const matchA = algo === "all" || hw.algorithm === algo;
    return matchM && matchA;
  });

  return (
    <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Mining Hardware</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">ASIC Hardware Inventory</h1>
          <p className="text-muted-foreground max-w-2xl">Latest-generation mining hardware from Bitmain, MicroBT, and Canaan powering our cloud mining contracts.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <Select value={manufacturer} onValueChange={setManufacturer}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Manufacturer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Manufacturers</SelectItem>
              <SelectItem value="Bitmain">Bitmain</SelectItem>
              <SelectItem value="MicroBT">MicroBT</SelectItem>
              <SelectItem value="Canaan">Canaan</SelectItem>
            </SelectContent>
          </Select>
          <Select value={algo} onValueChange={setAlgo}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Algorithm" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Algorithms</SelectItem>
              <SelectItem value="SHA-256">SHA-256</SelectItem>
              <SelectItem value="Scrypt">Scrypt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(hw => (
            <Card key={hw.id} className="bg-card border-border h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{hw.name}</h3>
                      <Badge variant="outline" className={`text-xs mt-0.5 ${logoColors[hw.manufacturer]}`}>{hw.manufacturer}</Badge>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 shrink-0">Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mt-auto">
                  <div>
                    <p className="text-xs text-muted-foreground">Algorithm</p>
                    <p className="font-medium text-foreground">{hw.algorithm}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hashrate</p>
                    <p className="font-mono font-bold text-primary">{hw.hashrate} {hw.hashrateUnit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Power Draw</p>
                    <p className="font-mono text-foreground">{hw.power.toLocaleString()} W</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                    <p className="font-mono text-foreground">{hw.efficiency} J/TH</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Farm</p>
                    <p className="text-foreground text-xs">{hw.farm}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Units</p>
                    <p className="font-mono text-foreground">{hw.count.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
