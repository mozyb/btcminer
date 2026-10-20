import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, ShieldCheck, RefreshCw, Save } from "lucide-react";

interface Prefs {
  marketing_optin: boolean;
  educational_optin: boolean;
  promotional_optin: boolean;
  product_updates_optin: boolean;
  newsletter_optin: boolean;
  unsubscribed_all: boolean;
}

const DEFAULT_PREFS: Prefs = {
  marketing_optin: true,
  educational_optin: true,
  promotional_optin: true,
  product_updates_optin: true,
  newsletter_optin: true,
  unsubscribed_all: false,
};

const CATEGORIES = [
  { key: "marketing_optin", label: "Marketing Emails", desc: "Promotional campaigns and special offers" },
  { key: "educational_optin", label: "Educational Content", desc: "Guides, tutorials, and how-to articles about cloud mining" },
  { key: "promotional_optin", label: "Promotional Offers", desc: "Discount codes, limited-time deals, and seasonal campaigns" },
  { key: "product_updates_optin", label: "Product Updates", desc: "New features, platform improvements, and announcements" },
  { key: "newsletter_optin", label: "Newsletter", desc: "Weekly digest of mining news, market insights, and platform updates" },
] as const;

export default function EmailPreferencesPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("email_consent").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setPrefs({
        marketing_optin: data.marketing_optin,
        educational_optin: data.educational_optin,
        promotional_optin: data.promotional_optin,
        product_updates_optin: data.product_updates_optin,
        newsletter_optin: data.newsletter_optin,
        unsubscribed_all: data.unsubscribed_all,
      });
      setLoading(false);
    });
  }, [user?.id]);

  const setP = (key: keyof Prefs, val: boolean) => setPrefs(p => ({ ...p, [key]: val, unsubscribed_all: false }));

  const unsubscribeAll = async () => {
    setSaving(true);
    const newPrefs: Prefs = {
      marketing_optin: false, educational_optin: false,
      promotional_optin: false, product_updates_optin: false,
      newsletter_optin: false, unsubscribed_all: true,
    };
    setPrefs(newPrefs);
    await save(newPrefs);
    setSaving(false);
  };

  const save = async (data?: Prefs) => {
    if (!user?.id) return;
    setSaving(true);
    const payload = { ...data ?? prefs, user_id: user.id, email: user.email, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("email_consent")
      .upsert(payload, { onConflict: "user_id" });
    if (error) toast.error("Failed to save preferences");
    else toast.success("Email preferences saved");
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Email Preferences</h2>
          <p className="text-sm text-muted-foreground">Manage your email subscriptions and notification settings</p>
        </div>

        {/* Transactional notice */}
        <Card className="bg-card border-border border-primary/20">
          <CardContent className="p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Transactional emails are always delivered</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Security alerts, deposit confirmations, withdrawal approvals, and KYC notifications are sent regardless of your marketing preferences.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status badge */}
        <div className="flex items-center gap-3">
          <Badge className={prefs.unsubscribed_all ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"}>
            {prefs.unsubscribed_all ? "Unsubscribed from all marketing" : "Subscribed to marketing emails"}
          </Badge>
        </div>

        {/* Categories */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Email Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {loading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-1.5"><div className="h-4 w-32 bg-muted rounded" /><div className="h-3 w-48 bg-muted/50 rounded" /></div>
                    <div className="h-6 w-10 bg-muted rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              CATEGORIES.map((cat, i) => (
                <React.Fragment key={cat.key}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0 mr-4">
                      <Label htmlFor={cat.key} className="text-sm font-medium cursor-pointer">{cat.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                    </div>
                    <Switch
                      id={cat.key}
                      checked={!prefs.unsubscribed_all && prefs[cat.key]}
                      onCheckedChange={v => setP(cat.key, v)}
                      disabled={prefs.unsubscribed_all}
                    />
                  </div>
                </React.Fragment>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => save()} disabled={saving} className="gap-1.5">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Preferences
          </Button>
          {!prefs.unsubscribed_all && (
            <Button variant="outline" onClick={unsubscribeAll} disabled={saving}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5">
              Unsubscribe from All
            </Button>
          )}
          {prefs.unsubscribed_all && (
            <Button variant="outline" onClick={() => setPrefs(DEFAULT_PREFS)} disabled={saving}>
              Re-subscribe
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          You can update your preferences at any time. To delete your account and all data, contact support.
        </p>
      </div>
    </DashboardLayout>
  );
}
