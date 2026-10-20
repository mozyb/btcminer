import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBtcStats } from "@/hooks/useBtcStats";
import { ArrowRight, RefreshCw, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { calculateAlignedMiningPlan, CANONICAL_PLANS } from "@/lib/miningPlanCalculator";
import { getPublicContractTemplates, type ContractTemplate } from "@/lib/api";

interface Props {
  defaultHashrate?: number;
  defaultDuration?: number;
  defaultMaintenance?: number;
  ctaLabel?: string;
  ctaLink?: string;
  onResultChange?: (netDailyBtc: number, hashrate: number) => void;
}

export default function CalculatorEngine({
  defaultHashrate   = 145,
  defaultDuration   = 90,
  defaultMaintenance = 0.000002,
  ctaLabel          = "Start Mining",
  ctaLink           = "/register",
  onResultChange,
}: Props) {
  const btc = useBtcStats();
  const [plans, setPlans] = useState<ContractTemplate[]>(CANONICAL_PLANS as unknown as ContractTemplate[]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("71744a17-9706-46ed-9cc1-dec7b1aae1e2"); // Pro SHA-256
  const [hashrate, setHashrate] = useState(defaultHashrate);
  const [duration, setDuration] = useState(defaultDuration);
  const [manualBtcPrice, setManualBtcPrice] = useState<number | null>(null);

  useEffect(() => {
    getPublicContractTemplates().then(res => {
      if (res && res.length > 0) setPlans(res);
    }).catch(() => {});
  }, []);

  const activeBtcPrice = manualBtcPrice ?? btc.btcPrice;

  // Calculate outputs aligned with platform plans
  const planCalc = calculateAlignedMiningPlan({
    hashrate,
    durationDays: duration,
    btcPrice: activeBtcPrice,
    selectedPlanId: selectedPlanId !== "custom" ? selectedPlanId : undefined,
    availablePlans: plans,
  });

  const netDailyBTC = planCalc.dailyBTC;

  useEffect(() => {
    onResultChange?.(netDailyBTC, hashrate);
  }, [netDailyBTC, hashrate, onResultChange]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "custom") return;
    const p = plans.find(x => x.id === planId);
    if (p) {
      setHashrate(p.hashrate);
      setDuration(p.is_lifetime ? 365 : p.duration);
    }
  };

  const rows = [
    { label: "Aligned Mining Plan", value: planCalc.planName, unit: "", negative: false, highlight: true },
    { label: "Plan Investment", value: `$${planCalc.investmentCostUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, unit: "USD", negative: false, highlight: false },
    { label: "Net Daily BTC", value: planCalc.dailyBTC.toFixed(8), unit: "BTC", negative: false, highlight: false },
    { label: `Net Daily USD @ $${(activeBtcPrice || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, value: `$${planCalc.dailyUSD.toFixed(2)}`, unit: "", negative: false, highlight: false },
    { label: `Net ${duration}-Day BTC`, value: planCalc.totalContractBTC.toFixed(6), unit: "BTC", negative: false, highlight: true },
    { label: `Net ${duration}-Day USD`, value: `$${planCalc.totalContractGrossUSD.toFixed(2)}`, unit: "", negative: false, highlight: true },
    { label: `Est. Maintenance Cost (${duration}d)`, value: `$${planCalc.totalMaintenanceUSD.toFixed(2)}`, unit: "USD", negative: true, highlight: false },
    { label: "Est. Net Profit", value: `+$${planCalc.netProfitUSD.toFixed(2)}`, unit: "USD", negative: false, highlight: true, color: "text-success font-bold" },
    { label: "Est. Net ROI", value: `+${planCalc.roiPercent.toFixed(1)}%`, unit: "ROI", negative: false, highlight: true, color: "text-success font-bold" },
    { label: "Est. Break-even", value: planCalc.breakEvenDays > 0 ? `~${planCalc.breakEvenDays}` : "N/A", unit: "days", negative: false, highlight: false },
  ];

  const targetLink = planCalc.matchedPlanSlug
    ? `/marketplace/${planCalc.matchedPlanSlug}`
    : (ctaLink || "/marketplace");

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Parameters</CardTitle>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">
              Mining Plan Aligned
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Presets */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Select Platform Mining Plan Preset</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
              {plans.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPlan(p.id)}
                  className={`text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                    selectedPlanId === p.id
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "bg-muted/40 border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="truncate font-medium">{p.display_name ?? p.name}</p>
                  <p className="text-[10px] opacity-80 font-mono">${(p.promotional_price ?? p.price).toLocaleString()} · {p.hashrate} {p.hashrate_unit}</p>
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleSelectPlan("custom")}
                className={`text-left px-2 py-1.5 rounded border text-xs transition-colors ${
                  selectedPlanId === "custom"
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-muted/40 border-border text-foreground hover:border-primary/50"
                }`}
              >
                <p className="font-medium">Custom Plan</p>
                <p className="text-[10px] opacity-80">Flexible TH/s</p>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-normal">Hashrate (TH/s)</Label>
              {selectedPlanId !== "custom" && (
                <span className="text-[11px] text-primary font-medium">Plan Preset</span>
              )}
            </div>
            <Input
              type="number"
              value={hashrate}
              onChange={e => {
                setHashrate(Number(e.target.value));
                setSelectedPlanId("custom");
              }}
              min={1}
              className="font-mono"
            />
          </div>
          <div>
            <Label className="text-sm font-normal mb-1.5 block">Duration (Days)</Label>
            <div className="flex gap-2">
              {[30, 90, 180, 365].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    if (selectedPlanId !== "custom") {
                      const p = plans.find(x => x.id === selectedPlanId);
                      if (p && p.duration !== d) setSelectedPlanId("custom");
                    }
                  }}
                  className={`flex-1 py-2 text-sm rounded border transition-colors ${duration === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                >
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

          <div className="border border-border rounded p-3 text-xs space-y-1 bg-muted/20">
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Estimated Output</CardTitle>
            <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
              {planCalc.planName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {rows.map(row => (
              <div key={row.label} className={`flex items-center justify-between py-1.5 px-3 rounded text-sm ${row.highlight ? "bg-primary/10 border border-primary/20" : ""}`}>
                <span className={row.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>{row.label}</span>
                <span className={`font-mono font-bold ${row.color ?? (row.highlight ? "text-primary" : row.negative ? "text-muted-foreground" : "text-foreground")}`}>
                  {row.value} {row.unit}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
              <Link to={targetLink}>
                {ctaLabel} {planCalc.planName} <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
