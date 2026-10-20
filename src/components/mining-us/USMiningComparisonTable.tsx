import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Minus } from "lucide-react";

const rows = [
  { factor: "Startup cost", home: "High ($5,000–$15,000+)", cloud: "Low ($100–$5,000)", hosted: "Medium ($3,000–$10,000)" },
  { factor: "Maintenance", home: "You handle all repairs", cloud: "Provider handles", hosted: "Hosting facility handles" },
  { factor: "Electricity exposure", home: "Full exposure to your utility rate", cloud: "None", hosted: "Shared via hosting fee" },
  { factor: "Noise", home: "75–85 dB inside home", cloud: "None", hosted: "None in your home" },
  { factor: "Cooling", home: "You provide HVAC and airflow", cloud: "Provider handles", hosted: "Facility handles" },
  { factor: "Flexibility", home: "You own hardware, can sell or upgrade", cloud: "No hardware ownership", hosted: "You own hardware remotely" },
  { factor: "Operational responsibility", home: "Full", cloud: "Minimal", hosted: "Shared" },
  { factor: "Uptime risk", home: "Residential outages affect you", cloud: "Provider uptime", hosted: "Facility uptime and monitoring" },
];

const legend = [
  { icon: Check, label: "Advantage", className: "text-success" },
  { icon: Minus, label: "Neutral / shared", className: "text-muted-foreground" },
  { icon: X, label: "Disadvantage", className: "text-destructive" },
];

export default function USMiningComparisonTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-base">Cloud Mining vs Mining at Home in the United States</CardTitle>
        <CardDescription>
          Side-by-side comparison of the three ways to participate in Bitcoin mining.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Factor</TableHead>
                <TableHead className="whitespace-nowrap">Home Mining</TableHead>
                <TableHead className="whitespace-nowrap">Cloud Mining</TableHead>
                <TableHead className="whitespace-nowrap">Hosted Mining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.factor}>
                  <TableCell className="font-medium whitespace-nowrap">{row.factor}</TableCell>
                  <TableCell>{row.home}</TableCell>
                  <TableCell>{row.cloud}</TableCell>
                  <TableCell>{row.hosted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          {legend.map(({ icon: Icon, label, className }) => (
            <div key={label} className="flex items-center gap-1">
              <Icon className={`w-3 h-3 ${className}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
