import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBtcStats } from "@/hooks/useBtcStats";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  defaultHashrate?: number;
  defaultDuration?: number;
  defaultMaintenance?: number;
  ctaLabel?: string;
  ctaLink?: string;
  onResultChange?: (netDailyBtc: number, hashrate: number) => void;
}

export default function CalculatorEngine({
  defaultHashrate   = 500,
  defaultDuration   = 90,
  defaultMaintenance = 0.0028,
  ctaLabel          = "Start Mining",
  ctaLink           = "/register",
  onResultChange,
}: Props) {
  const btc = useBtcStats();
  const [hashrate,        setHashrate]        = useState(defaultHashrate);
  const [duration,        setDuration]        = useState(defaultDuration);
  const [manualBtcPrice,  setManualBtcPrice]  = useState<number | null>(null);
  const [maintenanceRate, setMaintenanceRate] = useState(defaultMaintenance);

  const activeBtcPrice     = manualBtcPrice ?? btc.btcPrice;
  const networkTH          = btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 850e6;
  const grossDailyBTC      = (hashrate / networkTH) * 144 * (btc.blockReward || 3.125);
  const maintenanceDailyBTC = (maintenanceRate * hashrate) / (activeBtcPrice || 63000);
  const netDailyBTC        = Math.max(0, grossDailyBTC - maintenanceDailyBTC);
  const netTotalBTC        = netDailyBTC * duration;
  const netTotalUSD        = netTotalBTC * (activeBtcPrice || 63000);
  const grossTotalBTC      = grossDailyBTC * duration;
  const totalMaintenance   = maintenanceDailyBTC * duration;

  React.useEffect(() => {
    onResultChange?.(netDailyBTC, hashrate);
  }, [netDailyBTC, hashrate]);

  const rows = [
    { label: "Gross Daily BTC",          value: grossDailyBTC.toFixed(8),  unit: "BTC",  negative: false, highlight: false },
    { label: "Daily Maintenance",         value: maintenanceDailyBTC.toFixed(8), unit: "BTC", negative: true, highlight: false },
    { label: "Net Daily BTC",             value: netDailyBTC.toFixed(8),    unit: "BTC",  negative: false, highlight: true },
    { label: `Net Daily USD @ $${(activeBtcPrice || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, value: `$${(netDailyBTC * (activeBtcPrice || 0)).toFixed(2)}`, unit: "", negative: false, highlight: true },
    { label: `Gross ${duration}-Day BTC`, value: grossTotalBTC.toFixed(6),  unit: "BTC",  negative: false, highlight: false },
    { label: `Total Maintenance (${duration}d)`, value: totalMaintenance.toFixed(6), unit: "BTC", negative: true, highlight: false },
    { label: `Net ${duration}-Day BTC`,   value: netTotalBTC.toFixed(6),    unit: "BTC",  negative: false, highlight: true },
    { label: `Net ${duration}-Day USD`,   value: `$${netTotalUSD.toFixed(2)}`, unit: "",  negative: false, highlight: true },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Hashrate (TH/s)</Label>
            <Input type="number" value={hashrate} onChange={e => setHashrate(Number(e.target.value))} min={1} className="font-mono" />
          </div>
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Duration (Days)</Label>
            <div className="flex gap-2">
              {[30, 90, 180, 365].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 text-sm rounded border transition-colors ${duration === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-normal">BTC Price (USD)</Label>
              {manualBtcPrice !== null && (
                <button onClick={() => setManualBtcPrice(null)} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <RefreshCw className="w-3 h-3" />Use live price
                </button>
              )}
            </div>
            <Input type="number" value={manualBtcPrice ?? btc.btcPrice} onChange={e => setManualBtcPrice(Number(e.target.value))} step={100} className="font-mono" />
            {manualBtcPrice === null && <p className="text-[10px] text-success mt-1">● Using live Coinbase price</p>}
          </div>
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Maintenance Fee ($/TH/day)</Label>
            <Input type="number" value={maintenanceRate} onChange={e => setMaintenanceRate(Number(e.target.value))} step={0.0001} className="font-mono" />
          </div>
          <div className="border border-border rounded p-3 text-xs space-y-1">
            {btc.loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-3 w-40 bg-muted" />) : [
              ["Network Hashrate", `${btc.networkHashrate} EH/s`],
              ["Difficulty",       `${btc.networkDifficulty}T`],
              ["Block Reward",     `${btc.blockReward} BTC`],
            ].map(([k, v]) => (
              <p key={k}><strong className="text-foreground">{k}:</strong> <span className="text-muted-foreground font-mono">{v}</span></p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Estimated Output</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rows.map(row => (
              <div key={row.label} className={`flex items-center justify-between py-2 px-3 rounded text-sm ${row.highlight ? "bg-primary/10 border border-primary/20" : ""}`}>
                <span className={row.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>{row.label}</span>
                <span className={`font-mono font-bold ${row.highlight ? "text-primary" : row.negative ? "text-destructive" : "text-foreground"}`}>
                  {row.value} {row.unit}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to={ctaLink}>{ctaLabel} {hashrate} TH/s <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
