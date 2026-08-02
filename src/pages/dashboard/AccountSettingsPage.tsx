import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const countries = ["United States", "United Kingdom", "Germany", "Canada", "Australia", "Singapore", "Japan", "South Korea"];

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    username: user?.username ?? "",
    email: user?.email ?? "",
    country: user?.country ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Account settings updated successfully.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Account Settings</h2>
          <p className="text-sm text-muted-foreground">Manage your profile information</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Profile Information</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">First Name</Label>
                  <Input value={form.firstName} onChange={set("firstName")} />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Last Name</Label>
                  <Input value={form.lastName} onChange={set("lastName")} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Username</Label>
                <Input value={form.username} onChange={set("username")} />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Email Address</Label>
                <Input type="email" value={form.email} onChange={set("email")} />
                <p className="text-xs text-muted-foreground mt-1">Changing email requires re-verification.</p>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Country</Label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm">Account Information</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Member Since", val: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—" },
              { label: "Account Role", val: "Standard User" },
              { label: "KYC Status", val: user?.kycStatus === "approved" ? "✅ Verified" : "Not Verified" },
              { label: "2FA", val: user?.twoFAEnabled ? "✅ Enabled" : "❌ Disabled" },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="text-foreground font-medium">{r.val}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
