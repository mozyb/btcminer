import React from "react";
import { Badge } from "@/components/ui/badge";
import PublicLayout from "@/components/layouts/PublicLayout";

type PolicyType = "terms" | "privacy" | "aml" | "kyc" | "risk";

const policies: Record<PolicyType, { title: string; badge: string; content: { heading: string; text: string }[] }> = {
  terms: {
    title: "Terms of Service",
    badge: "Legal",
    content: [
      { heading: "1. Acceptance of Terms", text: "By accessing and using BTCMiner.online, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the platform." },
      { heading: "2. Cloud Mining Services", text: "BTCMiner.online provides cloud mining infrastructure services. Users purchase hashrate from our mining farms to participate in cryptocurrency mining. This is not an investment product and does not guarantee any return." },
      { heading: "3. Account Registration", text: "You must provide accurate, complete, and current information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account." },
      { heading: "4. Mining Rewards", text: "Mining rewards are distributed daily based on your proportional hashrate contribution to the mining pool, minus applicable maintenance fees. Rewards depend on network difficulty, block rewards, pool luck, and cryptocurrency prices." },
      { heading: "5. Deposits and Withdrawals", text: "Deposits are processed after blockchain confirmation. Withdrawal requests are subject to security verification including email confirmation and 2FA. We reserve the right to delay or suspend withdrawals for security review." },
      { heading: "6. Risk Acknowledgment", text: "Cloud mining involves substantial risk including but not limited to: cryptocurrency price volatility, network difficulty increases, mining hardware failures, and regulatory changes. You acknowledge these risks by using our service." },
      { heading: "7. Prohibited Activities", text: "You may not use our platform for money laundering, fraud, or any illegal activity. We cooperate fully with law enforcement and regulatory authorities." },
      { heading: "8. Limitation of Liability", text: "BTCMiner.online shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    badge: "Legal",
    content: [
      { heading: "1. Information We Collect", text: "We collect personal information including name, email address, country of residence, and identification documents for KYC purposes. We also collect technical information such as IP addresses, device information, and usage data." },
      { heading: "2. How We Use Information", text: "We use your information to operate the platform, process transactions, send mining reward notifications, comply with legal obligations, and improve our services." },
      { heading: "3. Data Storage and Security", text: "Your data is stored on secure servers with encryption at rest and in transit. We implement industry-standard security measures including 2FA, rate limiting, and regular security audits." },
      { heading: "4. Third-Party Services", text: "We share data with blockchain network providers for transaction verification, payment processors for deposits and withdrawals, and KYC verification providers as required by law." },
      { heading: "5. Data Retention", text: "We retain your data for the duration of your account plus 5 years as required by financial regulations. You may request deletion of non-essential data subject to legal requirements." },
      { heading: "6. Your Rights", text: "You have the right to access, correct, and request deletion of your personal data. Contact privacy@btcminer.online to exercise these rights." },
    ],
  },
  aml: {
    title: "AML Policy",
    badge: "Compliance",
    content: [
      { heading: "1. Anti-Money Laundering Commitment", text: "BTCMiner.online is committed to preventing money laundering and terrorist financing. We implement comprehensive AML procedures in compliance with applicable regulations." },
      { heading: "2. Customer Due Diligence", text: "We conduct Know Your Customer (KYC) verification for users exceeding certain transaction thresholds. Enhanced due diligence is applied for high-risk customers." },
      { heading: "3. Transaction Monitoring", text: "We monitor all transactions for suspicious patterns including unusual volumes, rapid cycling, and geographic anomalies. Suspicious transactions are reported to relevant authorities." },
      { heading: "4. Prohibited Transactions", text: "We do not accept funds from sanctioned individuals, entities, or jurisdictions. Transactions involving known mixing services or privacy coins may be subject to additional scrutiny." },
      { heading: "5. Reporting Obligations", text: "We file Suspicious Activity Reports (SARs) with relevant financial intelligence units as required by law. We fully cooperate with law enforcement investigations." },
    ],
  },
  kyc: {
    title: "KYC Policy",
    badge: "Compliance",
    content: [
      { heading: "1. KYC Requirements", text: "Know Your Customer verification is required for users who wish to withdraw amounts exceeding platform thresholds or access enhanced platform features." },
      { heading: "2. Accepted Documents", text: "We accept government-issued photo ID (passport, national ID card, or driver's license), a selfie with the document, and proof of address (utility bill or bank statement less than 3 months old)." },
      { heading: "3. Verification Process", text: "Submitted documents are reviewed by our compliance team within 1-3 business days. You will be notified by email of the outcome." },
      { heading: "4. Data Protection", text: "KYC documents are stored securely with restricted access and are used solely for verification purposes. We comply with data protection regulations including GDPR." },
      { heading: "5. Re-verification", text: "We may require re-verification if your account shows unusual activity, if your documents expire, or if regulatory requirements change." },
    ],
  },
  risk: {
    title: "Risk Disclosure",
    badge: "Risk",
    content: [
      { heading: "1. Mining Output Uncertainty", text: "Mining output is not guaranteed. The amount of cryptocurrency you earn depends on network difficulty, which adjusts approximately every two weeks. Increases in network difficulty reduce mining rewards." },
      { heading: "2. Cryptocurrency Price Risk", text: "The USD value of mining rewards is directly tied to cryptocurrency prices, which are highly volatile. The value of earned cryptocurrency may decrease significantly." },
      { heading: "3. This Is Not an Investment Product", text: "BTCMiner.online is a cloud mining service, not an investment platform. We do not guarantee any returns, profits, or specific mining output. Do not use funds you cannot afford to lose." },
      { heading: "4. Hardware and Operational Risk", text: "Mining hardware may malfunction or require maintenance. Network connectivity issues may temporarily affect mining operations. We aim for maximum uptime but cannot guarantee 100% availability." },
      { heading: "5. Regulatory Risk", text: "Cryptocurrency regulations are evolving globally. Changes in regulations may affect the legality of mining activities in your jurisdiction or our ability to operate." },
      { heading: "6. Security Risk", text: "While we implement strong security measures, cryptocurrency platforms remain targets for cyberattacks. Users should enable 2FA and follow security best practices." },
      { heading: "7. Acknowledgment", text: "By using BTCMiner.online, you acknowledge that you have read, understood, and accept all risks associated with cloud mining and cryptocurrency activities." },
    ],
  },
};

export default function PolicyPage({ type }: { type: PolicyType }) {
  const policy = policies[type];
  return (
    <PublicLayout>
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">{policy.badge}</Badge>
          <h1 className="text-3xl font-bold text-foreground">{policy.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">Last updated: March 2024</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="space-y-8">
          {policy.content.map(section => (
            <div key={section.heading}>
              <h2 className="font-semibold text-foreground mb-2">{section.heading}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
