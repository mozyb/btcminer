import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Globe, Shield, Zap, Users } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";


const team = [
  { name: "Marcus Reed", role: "CEO & Co-Founder", bg: "Previously VP Engineering at leading mining co." },
  { name: "Sophia Chen", role: "CTO", bg: "10 years distributed systems, ex-Google Infrastructure" },
  { name: "David Okafor", role: "Head of Operations", bg: "Managed 200+ MW mining facilities across 3 continents" },
  { name: "Lena Brandt", role: "Chief Compliance Officer", bg: "Regulatory compliance specialist, FinTech background" },
];

export default function AboutPage() {
  return (
    <>
      <PageMeta
      title="About BTCMiner.online | Transparent Cloud Bitcoin Mining Company"
      description="Learn about BTCMiner.online — a transparent cloud Bitcoin mining platform with real ASIC hardware, honest pricing, and daily BTC payouts. No hidden fees, no fake hashrate."
      canonical="/about"
      jsonLd={{"@context":"https://schema.org","@type":"AboutPage","name":"About BTCMiner.online","url":"https://btcminer.online/about"}}
      />
      <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">About Us</Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Building Legitimate Cloud Mining Infrastructure</h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            BTCMiner.online is an enterprise-grade hashrate marketplace and cloud mining platform. We own and operate mining farms across Iceland, the USA, Kazakhstan, and Norway, offering transparent access to real mining hashrate.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We believe cryptocurrency mining should be accessible, transparent, and legitimate. Our platform connects users to real mining infrastructure, providing actual hashrate backed by physical hardware, real pool statistics, and blockchain-verifiable payouts.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Unlike investment schemes that promise fixed returns, we operate strictly as a cloud mining service. Earnings are determined by network difficulty, your hashrate, and cryptocurrency prices — exactly as they would be if you owned the hardware yourself.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Globe, label: "4 Countries", sub: "Mining farm locations" },
              { icon: Zap, label: "555+ MW", sub: "Total mining capacity" },
              { icon: Users, label: "18,000+", sub: "Active miners" },
              { icon: Shield, label: "100%", sub: "On-chain verifiable payouts" },
            ].map(s => (
              <div key={s.label} className="border border-border rounded p-4 text-center">
                <s.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="font-bold text-xl font-mono text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Leadership Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map(m => (
              <Card key={m.name} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="text-lg font-bold text-primary">{m.name[0]}</span>
                  </div>
                  <p className="font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-primary mb-2">{m.role}</p>
                  <p className="text-xs text-muted-foreground text-pretty">{m.bg}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Our Commitment to Transparency</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">Every payout is verifiable on-chain. Farm capacity and hardware inventory are publicly disclosed. Network metrics are sourced directly from blockchain APIs.</p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/transparency">View Transparency Center</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Start Mining</Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  
  </>);
}
