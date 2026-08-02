import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBtcStats } from "@/hooks/useBtcStats";
import { usStates } from "./usStateData";
import { RefreshCw } from "lucide-react";

const ASIC_PRESETS = {
  "Antminer S21": { hashrate: 200, power: 3500, efficiency: 17.5 },
  "Whatsminer M63S": { hashrate: 390, power: 7200, efficiency: 18.5 },
  "AvalonMiner A1566": { hashrate: 185, power: 3420, efficiency: 18.5 },
  "Generic 10 TH/s Mini": { hashrate: 10, power: 300, efficiency: 30 },
  "Custom": { hashrate: 100, power: 3000, efficiency: 30 },
};

export default function USProfitabilityCalculator() {
  const btc = useBtcStats();
  const [selectedState, setSelectedState] = useState("TX");
  const [rateOverride, setRateOverride] = useState<string>("");
  const [preset, setPreset] = useState<keyof typeof ASIC_PRESETS>("Antminer S21");
  const [quantity, setQuantity] = useState(1);
  const [poolFee, setPoolFee] = useState(2);
  const [customHashrate, setCustomHashrate] = useState(ASIC_PRESETS["Antminer S21"].hashrate);
  const [customPower, setCustomPower] = useState(ASIC_PRESETS["Antminer S21"].power);

  const state = usStates.find(s => s.abbr === selectedState) ?? usStates[0];
  const rate = rateOverride ? Number(rateOverride) : state.industrialRate;
  const isCustom = preset === "Custom";
  const hashrate = isCustom ? customHashrate : ASIC_PRESETS[preset].hashrate;
  const power = isCustom ? customPower : ASIC_PRESETS[preset].power;

  const estimates = useMemo(() => {
    const totalHashrate = hashrate * quantity;
    const totalPower = power * quantity;
    const dailyKwh = (totalPower * 24) / 1000;
    const dailyElectricity = dailyKwh * rate;
    const networkTH = (btc.networkHashrate > 0 ? btc.networkHashrate * 1e6 : 850e6);
    const btcPrice = btc.btcPrice || 65000;
    const blockReward = btc.blockReward || 3.125;
    const grossBtc = (totalHashrate / networkTH) * 144 * blockReward;
    const grossUsd = grossBtc * btcPrice;
    const poolCost = grossUsd * (poolFee / 100);
    const netDailyUsd = grossUsd - dailyElectricity - poolCost;
    return {
      totalHashrate,
      dailyKwh,
      dailyElectricity,
      grossBtc,
      grossUsd,
      poolCost,
      netDailyUsd,
      netMonthlyUsd: netDailyUsd * 30,
      netAnnualUsd: netDailyUsd * 365,
    };
  }, [hashrate, power, quantity, rate, poolFee, btc.networkHashrate, btc.btcPrice, btc.blockReward]);

  const handlePresetChange = (value: keyof typeof ASIC_PRESETS) => {
    setPreset(value);
    if (value !== "Custom") {
      setCustomHashrate(ASIC_PRESETS[value].hashrate);
      setCustomPower(ASIC_PRESETS[value].power);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Live U.S. Mining Profitability Calculator</CardTitle>
        <CardDescription>
          Estimate daily, monthly, and annual profit using current BTC price, network difficulty, and your electricity rate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-normal mb-1.5 block">State</Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map(s => (
                    <SelectItem key={s.abbr} value={s.abbr}>{s.name} — ${s.industrialRate.toFixed(3)}/kWh</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Using industrial rate for {state.name}: ${state.industrialRate.toFixed(3)}/kWh</p>
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Electricity Rate ($/kWh)</Label>
              <Input type="number" value={rateOverride || rate.toFixed(3)} onChange={e => setRateOverride(e.target.value)} step={0.001} className="font-mono" />
              {rateOverride && <button onClick={() => setRateOverride("")} className="text-xs text-primary mt-1 hover:underline">Reset to state rate</button>}
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">ASIC Model</Label>
              <Select value={preset} onValueChange={v => handlePresetChange(v as keyof typeof ASIC_PRESETS)}>
                <SelectTrigger><SelectValue placeholder="Select ASIC" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ASIC_PRESETS).map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isCustom && (
              <>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Hashrate (TH/s)</Label>
                  <Input type="number" value={customHashrate} onChange={e => setCustomHashrate(Number(e.target.value))} className="font-mono" />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Power Consumption (W)</Label>
                  <Input type="number" value={customPower} onChange={e => setCustomPower(Number(e.target.value))} className="font-mono" />
                </div>
              </>
            )}
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Quantity of Miners</Label>
              <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} min={1} className="font-mono" />
            </div>
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Pool Fee (%)</Label>
              <Input type="number" value={poolFee} onChange={e => setPoolFee(Number(e.target.value))} step={0.1} className="font-mono" />
            </div>
            <div className="border border-border rounded p-3 text-xs space-y-1">
              {btc.loading ? (
                <p className="text-muted-foreground">Loading live data...</p>
              ) : (
                <>
                  <p><strong className="text-foreground">BTC Price:</strong> <span className="font-mono">${btc.btcPrice.toLocaleString()}</span></p>
                  <p><strong className="text-foreground">Network Hashrate:</strong> <span className="font-mono">{btc.networkHashrate} EH/s</span></p>
                  <p><strong className="text-foreground">Difficulty:</strong> <span className="font-mono">{btc.networkDifficulty} T</span></p>
                  <p><strong className="text-foreground">Block Reward:</strong> <span className="font-mono">{btc.blockReward} BTC</span></p>
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ResultBox label="Daily Estimate" value={`$${estimates.netDailyUsd.toFixed(2)}`} />
              <ResultBox label="Monthly Estimate" value={`$${estimates.netMonthlyUsd.toFixed(2)}`} />
              <ResultBox label="Annual Estimate" value={`$${estimates.netAnnualUsd.toFixed(2)}`} />
              <ResultBox label="Daily Electricity" value={`$${estimates.dailyElectricity.toFixed(2)}`} />
            </div>
            <div className="border border-border rounded p-3 space-y-2 text-sm">
              <Row label="Total Hashrate" value={`${estimates.totalHashrate.toLocaleString()} TH/s`} />
              <Row label="Gross Daily BTC" value={`${estimates.grossBtc.toFixed(6)} BTC`} />
              <Row label="Gross Daily USD" value={`$${estimates.grossUsd.toFixed(2)}`} />
              <Row label="Pool Fee" value={`$${estimates.poolCost.toFixed(2)}`} />
            </div>
            <p className="text-xs text-muted-foreground">
              Estimates are based on current network conditions and market data. Actual rewards vary with luck, pool payout model, and difficulty adjustments.
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <a href="/calculator">Open Full Mining Calculator <RefreshCw className="w-4 h-4" /></a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border rounded p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-mono font-bold text-foreground">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}
