import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PublicLayout from "@/components/layouts/PublicLayout";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";


export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Message sent. We'll respond within 24 hours.");
  };

  return (
    <>
      <PageMeta
      title="Contact BTCMiner.online | Bitcoin Mining Support"
      description="Get in touch with the BTCMiner.online support team. We're here to help with your cloud Bitcoin mining questions, account issues, and technical support."
      canonical="/contact"
      jsonLd={{"@context":"https://schema.org","@type":"ContactPage","name":"Contact BTCMiner.online","url":"https://btcminer.online/contact"}}
      />
      <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">Contact</Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">Get in Touch</h1>
          <p className="text-muted-foreground">Our support team is available 24/7 for technical and account inquiries.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">Send a Message</h2>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">First Name</Label>
                    <Input required />
                  </div>
                  <div>
                    <Label className="text-sm font-normal mb-1.5 block">Last Name</Label>
                    <Input required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Email</Label>
                  <Input type="email" required />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Subject</Label>
                  <Select required>
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing & Payments</SelectItem>
                      <SelectItem value="contract">Contract Question</SelectItem>
                      <SelectItem value="kyc">KYC Verification</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Message</Label>
                  <Textarea rows={5} required className="resize-none" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Send Message</Button>
              </form>
            ) : (
              <div className="border border-success/30 bg-success/10 rounded p-6 text-center">
                <p className="text-success font-semibold mb-2">Message Sent!</p>
                <p className="text-sm text-muted-foreground">We typically respond within 24 hours. Check your email for a confirmation.</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-6">Contact Information</h2>
            {[
              { icon: Mail, title: "Email Support", val: "support@btcminer.online", sub: "General inquiries and support" },
              { icon: MessageSquare, title: "Live Chat", val: "Available in Dashboard", sub: "For registered users via Intercom" },
              { icon: Clock, title: "Response Time", val: "< 24 hours", sub: "Monday–Sunday, 24/7" },
            ].map(item => (
              <Card key={item.title} className="bg-card border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-sm text-primary">{item.val}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  
  </>);
}
