import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Shield, Smartphone, Monitor, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const loginHistory = [
  { device: "Chrome / macOS", location: "San Francisco, CA", time: "2024-03-12 14:22", ip: "192.168.1.x", current: true },
  { device: "Safari / iPhone", location: "San Francisco, CA", time: "2024-03-10 09:11", ip: "192.168.1.x", current: false },
  { device: "Chrome / Windows", location: "New York, NY", time: "2024-03-08 21:30", ip: "10.0.0.x", current: false },
];

export default function SecuritySettingsPage() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error("New passwords don't match"); return; }
    toast.success("Password changed successfully.");
    setPwForm({ current: "", next: "", confirm: "" });
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Security Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your account security</p>
        </div>

        {/* 2FA */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              Two-Factor Authentication
              <Badge className={twoFAEnabled ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Protect your account with an authenticator app (Google Authenticator, Authy, etc.).</p>
            {!twoFAEnabled ? (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2" onClick={() => { setShowSetup(true); setTwoFAEnabled(true); toast.success("2FA enabled successfully!"); }}>
                <Shield className="w-4 h-4" />Enable 2FA
              </Button>
            ) : (
              <Button variant="outline" className="gap-2" onClick={() => { setTwoFAEnabled(false); toast.success("2FA disabled."); }}>
                <Shield className="w-4 h-4" />Disable 2FA
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePwChange} className="space-y-3">
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Current Password</Label>
                <Input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">New Password</Label>
                <Input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} required />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Confirm New Password</Label>
                <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} required />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Update Password</Button>
            </form>
          </CardContent>
        </Card>

        {/* Login History */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Login History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loginHistory.map((s, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded border ${s.current ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                <Monitor className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{s.device}</p>
                    {s.current && <Badge className="bg-success/10 text-success border-success/20 text-xs">Current</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.location} · {s.time}</p>
                </div>
                {!s.current && (
                  <button className="text-xs text-destructive hover:underline shrink-0">Revoke</button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Withdrawal Lock */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              Withdrawal Lock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Enable a 24-hour withdrawal lock for additional security against unauthorized access.</p>
            <Button variant="outline" className="gap-2" onClick={() => toast.success("Withdrawal lock enabled for 24 hours.")}>
              <CheckCircle className="w-4 h-4" />Enable Withdrawal Lock
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
