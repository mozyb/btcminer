import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/layouts/PublicLayout";
import { faqs } from "@/lib/mockData";
import { ChevronDown } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";


export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <>
      <PageMeta
      title="Frequently Asked Questions | Bitcoin Cloud Mining FAQ | BTCMiner.online"
      description="Get answers to the most common questions about Bitcoin cloud mining on BTCMiner.online. Learn how contracts work, how payouts are calculated, and how to get started."
      canonical="/faq"
      jsonLd={{"@context":"https://schema.org","@type":"FAQPage","name":"BTCMiner.online FAQ","url":"https://btcminer.online/faq"}}
      />
      <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 text-center">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">FAQ</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Answers to common questions about our platform and cloud mining.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-border rounded overflow-hidden">
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium text-foreground text-sm">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open === idx ? "rotate-180" : ""}`} />
              </button>
              {open === idx && (
                <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-border pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 border border-border rounded p-6 text-center">
          <p className="text-foreground font-medium mb-2">Still have questions?</p>
          <p className="text-sm text-muted-foreground mb-4">Our support team is available 24/7 to help.</p>
          <a href="/contact" className="text-sm text-primary hover:underline">Contact Support →</a>
        </div>
      </div>
    </PublicLayout>
  
  </>);
}
