import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Save, Settings, Shield, Coins, Mail } from "lucide-react";
import { toast } from "sonner";

const sections = [
  {
    icon: Settings,
    title: "Platform Settings",
    fields: [
      { key: "platformName", label: "Platform Name", value: "BTCMiner.online", type: "text" },
      { key: "supportEmail", label: "Support Email", value: "support@btcminer.online", type: "email" },
      { key: "contactEmail", label: "Contact Email", value: "contact@btcminer.online", type: "email" },
      { key: "maintenanceMode", label: "Maintenance Mode", value: "off", type: "select", options: ["on", "off"] },
    ],
  },
  {
    icon: Coins,
    title: "Mining & Deposit Settings",
    fields: [
      { key: "minDepositBTC", label: "Min Deposit (BTC)", value: "0.001", type: "number" },
      { key: "minWithdrawBTC", label: "Min Withdrawal (BTC)", value: "0.002", type: "number" },
      { key: "minDepositUSDT", label: "Min Deposit (USDT)", value: "10", type: "number" },
      { key: "rewardDistributionTime", label: "Reward Distribution (UTC)", value: "02:00", type: "text" },
    ],
  },
  {
    icon: Shield,
    title: "Security Settings",
    fields: [
      { key: "sessionTimeout", label: "Session Timeout (minutes)", value: "60", type: "number" },
      { key: "enforce2FA", label: "Enforce 2FA for Withdrawals", value: "yes", type: "select", options: ["yes", "no"] },
      { key: "withdrawalLockDuration", label: "Withdrawal Lock Duration (hours)", value: "24", type: "number" },
      { key: "maxLoginAttempts", label: "Max Login Attempts Before Lock", value: "5", type: "number" },
    ],
  },
  {
    icon: Mail,
    title: "Email & Notifications",
    fields: [
      { key: "smtpHost", label: "SMTP Host", value: "smtp.sendgrid.net", type: "text" },
      { key: "smtpPort", label: "SMTP Port", value: "587", type: "number" },
      { key: "emailFrom", label: "From Email", value: "noreply@btcminer.online", type: "email" },
      { key: "emailVerificationRequired", label: "Email Verification Required", value: "yes", type: "select", options: ["yes", "no"] },
    ],
  },
];

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    sections.forEach(s => s.fields.forEach(f => { init[f.key] = f.value; }));
    return init;
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setValues(v => ({ ...v, [key]: e.target.value }));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">System Settings</h2>
          <p className="text-sm text-muted-foreground">Configure platform-wide settings and security policies</p>
        </div>

        <div className="space-y-6">
          {sections.map(section => (
            <Card key={section.title} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {section.fields.map(field => (
                    <div key={field.key}>
                      <Label className="text-xs font-normal mb-1.5 block">{field.label}</Label>
                      {field.type === "select" ? (
                        <Select value={values[field.key]} onValueChange={v => setValues(vs => ({ ...vs, [field.key]: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options ?? []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type}
                          value={values[field.key]}
                          onChange={set(field.key)}
                          className="font-mono text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => toast.success("System settings saved successfully.")}
          >
            <Save className="w-4 h-4" />Save All Settings
          </Button>
          <Button variant="outline" onClick={() => toast.info("Settings reset to defaults.")}>Reset to Defaults</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
