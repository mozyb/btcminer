import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Users, DollarSign, Link2, BarChart3 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";


const levels = [
  { level: "Level 1", rate: "5%", desc: "Commission on all hashrate purchases by direct referrals" },
  { level: "Level 2", rate: "2%", desc: "Commission on hashrate purchased by your referrals' referrals" },
  { level: "Level 3", rate: "1%", desc: "Commission on third-tier referral hashrate purchases" },
];

export default function AffiliateProgramPage() {
  return (
    <>
      <PageMeta
      title="Bitcoin Mining Affiliate Program | Earn BTC Commissions | BTCMiner.online"
      description="Join the BTCMiner.online affiliate program and earn Bitcoin commissions for every referral. Up to 10% lifetime commissions on mining contracts. Free to join."
      canonical="/affiliate-program"
      jsonLd={{"@context":"https://schema.org","@type":"WebPage","name":"BTCMiner.online Affiliate Program","url":"https://btcminer.online/affiliate-program"}}
      />
      <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Affiliate Program</Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">Earn Bitcoin by Referring Miners</h1>
          <p className="text-lg text-muted-foreground max-w-xl">Our 3-level affiliate program rewards you with BTC commissions when your referrals purchase hashrate contracts.</p>
          <Button size="lg" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/register">Join & Get Your Link</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-12">
        <div className="grid md:grid-cols-3 gap-4">
          {levels.map(l => (
            <Card key={l.level} className="bg-card border-border text-center">
              <CardContent className="p-6">
                <div className="text-4xl font-bold font-mono text-primary mb-2">{l.rate}</div>
                <p className="font-semibold text-foreground mb-2">{l.level} Commission</p>
                <p className="text-sm text-muted-foreground text-pretty">{l.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Link2, step: "1", title: "Get Your Link", desc: "After registration, your unique referral link is available in your affiliate dashboard." },
              { icon: Users, step: "2", title: "Invite Miners", desc: "Share your referral link on social media, mining communities, and forums." },
              { icon: BarChart3, step: "3", title: "They Mine", desc: "When referred users purchase hashrate contracts, commissions are triggered." },
              { icon: DollarSign, step: "4", title: "Earn BTC", desc: "Commissions are credited to your BTC wallet automatically after each purchase." },
            ].map(step => (
              <div key={step.step} className="border border-border rounded p-5 text-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mb-1">Step {step.step}</p>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground text-pretty">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Start Earning?</h2>
          <p className="text-muted-foreground mb-6">Create your account and access your unique referral link instantly.</p>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </div>
    </PublicLayout>
  
  </>);
}
