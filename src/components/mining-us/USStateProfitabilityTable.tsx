import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usStates, type USState } from "./usStateData";
import { ArrowUpDown } from "lucide-react";

type SortKey = keyof Pick<USState, "name" | "industrialRate" | "commercialRate" | "residentialRate" | "miningFriendly">;

function calculateDailyProfit(rate: number, hashrate = 100, efficiency = 25) {
  const powerW = hashrate * efficiency;
  const dailyKwh = (powerW * 24) / 1000;
  const dailyCost = dailyKwh * rate;
  const grossRevenue = 3.25;
  const netProfit = grossRevenue - dailyCost;
  return { dailyCost, netProfit, dailyKwh };
}

export default function USStateProfitabilityTable() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("industrialRate");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    let data = usStates.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.abbr.toLowerCase().includes(search.toLowerCase()));
    data = [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") return sortAsc ? aVal - bVal : bVal - aVal;
      return sortAsc ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return data;
  }, [search, sortKey, sortAsc]);

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => toggleSort(k)}>
      <span className="flex items-center gap-1">
        {label} <ArrowUpDown className="w-3 h-3" />
      </span>
    </TableHead>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">State-by-State Electricity Cost Comparison</CardTitle>
        <CardDescription>
          Industrial rates and estimated mining profit for a 100 TH/s ASIC at 25 J/TH. Last updated: June 2026.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search state..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="State" k="name" />
                <TableHead className="whitespace-nowrap">Abbr</TableHead>
                <SortHeader label="Residential" k="residentialRate" />
                <SortHeader label="Commercial" k="commercialRate" />
                <SortHeader label="Industrial" k="industrialRate" />
                <TableHead className="whitespace-nowrap">Est. Daily Cost</TableHead>
                <TableHead className="whitespace-nowrap">Est. Daily Profit</TableHead>
                <TableHead className="whitespace-nowrap">Est. Monthly Profit</TableHead>
                <SortHeader label="Friendliness" k="miningFriendly" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(state => {
                const { dailyCost, netProfit, dailyKwh } = calculateDailyProfit(state.industrialRate);
                const monthlyProfit = netProfit * 30;
                return (
                  <TableRow key={state.abbr}>
                    <TableCell className="font-medium">{state.name}</TableCell>
                    <TableCell className="font-mono">{state.abbr}</TableCell>
                    <TableCell className="font-mono">${state.residentialRate.toFixed(3)}</TableCell>
                    <TableCell className="font-mono">${state.commercialRate.toFixed(3)}</TableCell>
                    <TableCell className="font-mono">${state.industrialRate.toFixed(3)}</TableCell>
                    <TableCell className="font-mono">${dailyCost.toFixed(2)}</TableCell>
                    <TableCell className={`font-mono ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>${netProfit.toFixed(2)}</TableCell>
                    <TableCell className={`font-mono ${monthlyProfit >= 0 ? "text-success" : "text-destructive"}`}>${monthlyProfit.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{state.miningFriendly}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimates assume a 100 TH/s ASIC consuming 25 J/TH, 24/7 operation, $3.25 gross daily revenue, and no pool fees. Actual results vary with BTC price, network difficulty, and pool fees.
        </p>
      </CardContent>
    </Card>
  );
}
