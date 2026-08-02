import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const examples = [
  {
    label: "Residential Electricity",
    rate: 0.15,
    hashrate: 200,
    power: 3500,
    assumptions: "Typical U.S. residential rate, single Antminer S21, no solar.",
  },
  {
    label: "Commercial Electricity",
    rate: 0.10,
    hashrate: 800,
    power: 14000,
    assumptions: "Small business hosting four Antminer S21 units in a warehouse.",
  },
  {
    label: "Industrial Electricity",
    rate: 0.07,
    hashrate: 2000,
    power: 35000,
    assumptions: "Industrial hosting facility in Texas with negotiated power rates.",
  },
];

function dailyEst(rate: number, hashrate: number, power: number) {
  const dailyKwh = (power * 24) / 1000;
  const electricityCost = dailyKwh * rate;
  const grossRevenue = (hashrate / 100) * 3.25;
  const netProfit = grossRevenue - electricityCost;
  return { dailyKwh, electricityCost, grossRevenue, netProfit };
}

export default function USMiningExamples() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Real Examples by Electricity Rate</CardTitle>
        <CardDescription>
          These scenarios use illustrative assumptions for a 200 TH/s class ASIC scaled to different operation sizes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {examples.map(ex => {
            const { dailyKwh, electricityCost, grossRevenue, netProfit } = dailyEst(ex.rate, ex.hashrate, ex.power);
            return (
              <div key={ex.label} className="border border-border rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-foreground">{ex.label}</h3>
                <p className="text-xs text-muted-foreground">{ex.assumptions}</p>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-mono">${ex.rate.toFixed(2)}/kWh</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Hashrate</span><span className="font-mono">{ex.hashrate} TH/s</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Power</span><span className="font-mono">{ex.power} W</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Daily kWh</span><span className="font-mono">{dailyKwh.toFixed(1)}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Electricity</span><span className="font-mono">${electricityCost.toFixed(2)}</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Gross revenue</span><span className="font-mono">${grossRevenue.toFixed(2)}</span></p>
                  <p className="flex justify-between pt-2 border-t border-border"><span className="font-medium">Net profit/day</span><span className={`font-mono font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>${netProfit.toFixed(2)}</span></p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Assumes $3.25 gross daily revenue per 100 TH/s. Actual revenue depends on BTC price, network difficulty, and pool fees. Numbers are illustrative, not guarantees.
        </p>
      </CardContent>
    </Card>
  );
}
