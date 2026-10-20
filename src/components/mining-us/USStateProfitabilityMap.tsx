import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usStates, getMiningFriendlinessColor, type USState } from "./usStateData";

const friendlyOrder = ["Very Friendly", "Friendly", "Neutral", "Restrictive", "Unfriendly"] as const;

const regionStates: Record<string, string[]> = {
  Northeast: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA", "DE", "MD"],
  Southeast: ["VA", "WV", "KY", "TN", "NC", "SC", "GA", "FL", "AL", "MS", "AR", "LA"],
  Midwest: ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO", "ND", "SD", "NE", "KS"],
  Southwest: ["TX", "OK", "NM", "AZ", "NV", "UT", "CO"],
  West: ["WA", "OR", "CA", "ID", "MT", "WY", "AK", "HI"],
};

export default function USStateProfitabilityMap() {
  const [selected, setSelected] = useState<USState | null>(null);
  const [filter, setFilter] = useState<USState["miningFriendly"] | "All">("All");

  const filtered = filter === "All" ? usStates : usStates.filter(s => s.miningFriendly === filter);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Interactive U.S. Mining Profitability Map</CardTitle>
        <CardDescription>
          Hover over a region to see state details. Filter by mining friendliness.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("All")}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filter === "All" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
          >
            All
          </button>
          {friendlyOrder.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(regionStates).map(([region, abbrs]) => {
            const regionData = filtered.filter(s => abbrs.includes(s.abbr));
            if (regionData.length === 0) return null;
            return (
              <div key={region} className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">{region}</h4>
                <div className="flex flex-wrap gap-1">
                  {regionData.map(state => (
                    <button
                      key={state.abbr}
                      onClick={() => setSelected(state)}
                      className={`w-9 h-9 text-[10px] font-medium rounded flex items-center justify-center transition-transform hover:scale-105 ${getMiningFriendlinessColor(state.miningFriendly)} ${selected?.abbr === state.abbr ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`}
                      title={state.name}
                    >
                      {state.abbr}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
              <Badge className={getMiningFriendlinessColor(selected.miningFriendly)}>{selected.miningFriendly}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Residential</p>
                <p className="font-mono font-medium">${selected.residentialRate.toFixed(3)}/kWh</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Commercial</p>
                <p className="font-mono font-medium">${selected.commercialRate.toFixed(3)}/kWh</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Industrial</p>
                <p className="font-mono font-medium">${selected.industrialRate.toFixed(3)}/kWh</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Climate</p>
                <p className="font-medium">{selected.climate}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Renewable energy availability: <span className="font-medium text-foreground">{selected.renewables}</span>
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs">
          {friendlyOrder.map(f => (
            <div key={f} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${getMiningFriendlinessColor(f).split(" ")[0]}`} />
              <span className="text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
