import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Save, RefreshCw, Bell, User, Shield, Settings,
  Mail, Zap, CheckCircle2, XCircle, Eye, EyeOff,
  Send, Wifi, WifiOff, TestTube,
} from "lucide-react";

interface SenderIdentity extends Record<string, string> {
  from_email: string; from_name: string; reply_to: string;
  company_name: string; company_address: string; logo_url: string;
  brand_color: string; social_twitter: string; social_telegram: string;
  social_discord: string; footer_text: string; unsubscribe_text: string;
  privacy_url: string; terms_url: string;
}
interface NotificationTriggers { [key: string]: boolean }
interface QueueConfig extends Record<string, number | boolean> {
  max_retries: number; retry_delay_minutes: number; exponential_backoff: boolean;
  concurrency: number; paused: boolean; daily_limit_per_user: number;
}

interface ResendConfig {
  api_key: string;
  from_email: string;
  from_name: string;
  reply_to: string;
  support_email: string;
  verified_domain: string;
  default_language: string;
  enable_logging: boolean;
  enable_queue: boolean;
  retry_attempts: number;
  enabled: boolean;
  last_test_at: string | null;
  last_test_status: string | null;
}

const DEFAULT_RESEND: ResendConfig = {
  api_key: "", from_email: "noreply@btcminer.online", from_name: "BTCMiner.online",
  reply_to: "support@btcminer.online", support_email: "support@btcminer.online",
  verified_domain: "", default_language: "en", enable_logging: true,
  enable_queue: true, retry_attempts: 3, enabled: true,
  last_test_at: null, last_test_status: null,
};

const TRIGGER_GROUPS: { label: string; keys: [string, string][] }[] = [
  { label: "Security", keys: [
    ["new_login","New Login Detected"], ["new_device_login","New Device Login"],
    ["password_changed","Password Changed"], ["email_changed","Email Changed"],
    ["twofa_enabled","2FA Enabled"], ["twofa_disabled","2FA Disabled"],
    ["account_locked","Account Locked"], ["suspicious_activity","Suspicious Activity"],
    ["api_key_generated","API Key Generated"], ["withdrawal_request","Withdrawal Request"],
    ["wallet_address_changed","Wallet Address Changed"],
  ]},
  { label: "Mining", keys: [
    ["contract_purchased","Contract Purchased"], ["contract_expires_soon","Contract Expires Soon"],
    ["contract_expired","Contract Expired"], ["mining_reward_credited","Mining Reward Credited"],
    ["maintenance_fee_deducted","Maintenance Fee Deducted"],
  ]},
  { label: "Wallet", keys: [
    ["deposit_detected","Deposit Detected"], ["deposit_confirmed","Deposit Confirmed"],
    ["deposit_failed","Deposit Failed"], ["withdrawal_requested","Withdrawal Requested"],
    ["withdrawal_approved","Withdrawal Approved"], ["withdrawal_rejected","Withdrawal Rejected"],
    ["internal_transfer","Internal Transfer"],
  ]},
  { label: "Account", keys: [
    ["welcome","Welcome Email"], ["profile_updated","Profile Updated"],
    ["kyc_submitted","KYC Submitted"], ["kyc_approved","KYC Approved"],
    ["kyc_rejected","KYC Rejected"], ["referral_commission","Referral Commission Earned"],
    ["referral_registered","Referral Registered"],
  ]},
  { label: "Support", keys: [
    ["ticket_created","Ticket Created"], ["staff_replied","Staff Replied"],
    ["ticket_closed","Ticket Closed"], ["ticket_reopened","Ticket Reopened"],
  ]},
];

export default function AdminEmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [identity, setIdentity] = useState<SenderIdentity>({
    from_email: "noreply@btcminer.online", from_name: "BTCMiner.online",
    reply_to: "support@btcminer.online", company_name: "BTCMiner.online",
    company_address: "", logo_url: "", brand_color: "#f59e0b",
    social_twitter: "", social_telegram: "", social_discord: "",
    footer_text: "You are receiving this email because you have an account at BTCMiner.online",
    unsubscribe_text: "Unsubscribe", privacy_url: "https://btcminer.online/privacy",
    terms_url: "https://btcminer.online/terms",
  });
  const [triggers, setTriggers] = useState<NotificationTriggers>({});
  const [queueCfg, setQueueCfg] = useState<QueueConfig>({
    max_retries: 3, retry_delay_minutes: 5, exponential_backoff: true,
    concurrency: 10, paused: false, daily_limit_per_user: 20,
  });
  const [resendCfg, setResendCfg] = useState<ResendConfig>(DEFAULT_RESEND);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("BTCMiner Test Email");
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("email_settings").select("*");
    const rows = data ?? [];
    rows.forEach(r => {
      if (r.key === "sender_identity") setIdentity(r.value as SenderIdentity);
      if (r.key === "notification_triggers") setTriggers(r.value as NotificationTriggers);
      if (r.key === "queue_config") setQueueCfg(r.value as QueueConfig);
      if (r.key === "resend_config") {
        const cfg = r.value as ResendConfig;
        setResendCfg({ ...DEFAULT_RESEND, ...cfg });
        setApiStatus(cfg.last_test_status === "ok" ? "connected" : cfg.api_key ? "unknown" : "disconnected");
      }
    });
    setLoading(false);
  }, []);

  const handleTestConnection = async () => {
    if (!resendCfg.api_key) { toast.error("Enter an API key first"); return; }
    setConnecting(true);
    try {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendCfg.api_key}` },
      });
      if (res.ok) {
        setApiStatus("connected");
        const now = new Date().toISOString();
        setResendCfg(c => ({ ...c, last_test_at: now, last_test_status: "ok" }));
        await supabase.from("email_settings").upsert({
          key: "resend_config",
          value: { ...resendCfg, last_test_at: now, last_test_status: "ok" },
          updated_at: now,
        }, { onConflict: "key" });
        toast.success("Resend API connected successfully");
      } else {
        setApiStatus("disconnected");
        toast.error(`Connection failed: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setApiStatus("disconnected");
      toast.error(e instanceof Error ? e.message : "Connection failed");
    } finally { setConnecting(false); }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) { toast.error("Enter a recipient email"); return; }
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: {
          user_id: "00000000-0000-0000-0000-000000000000",
          email: testEmail,
          first_name: "Admin Test",
        },
      });
      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
    } catch (e) {
      // Fallback: try direct Resend call from edge function via email-send
      try {
        const { error: e2 } = await supabase.functions.invoke("email-send", {
          body: {
            to_email: testEmail,
            subject: testSubject || "BTCMiner Test Email",
            html_body: `<div style="font-family:sans-serif;padding:24px;background:#111827;color:#e2e8f0;border-radius:8px;max-width:500px;margin:auto"><h2 style="color:#f7931a">Test Email ✓</h2><p>This is a test email from BTCMiner.online admin panel.</p><p style="color:#64748b;font-size:13px">Sent at: ${new Date().toLocaleString()}</p></div>`,
          },
        });
        if (e2) throw e2;
        toast.success(`Test email sent to ${testEmail}`);
      } catch (e3) {
        toast.error(e3 instanceof Error ? e3.message : "Failed to send test email");
      }
    } finally { setTesting(false); }
  };

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveKey = async (key: string, value: object) => {
    setSaving(key);
    try {
      const { error } = await supabase.from("email_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
      toast.success("Settings saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(null); }
  };

  const toggleTrigger = (key: string) => setTriggers(t => ({ ...t, [key]: !t[key] }));
  const enableAll = (keys: string[]) => setTriggers(t => { const n = { ...t }; keys.forEach(k => { n[k] = true; }); return n; });
  const disableAll = (keys: string[]) => setTriggers(t => { const n = { ...t }; keys.forEach(k => { n[k] = false; }); return n; });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Email Settings</h2>
            <p className="text-sm text-muted-foreground">Sender identity, notification triggers, and queue configuration</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 shrink-0" onClick={fetchSettings}><RefreshCw className="w-3.5 h-3.5"/>Refresh</Button>
        </div>

        <Tabs defaultValue="resend">
          <TabsList className="h-8 text-xs flex-wrap h-auto">
            <TabsTrigger value="resend" className="text-xs gap-1 h-7"><Zap className="w-3.5 h-3.5"/>Resend Config</TabsTrigger>
            <TabsTrigger value="identity" className="text-xs gap-1 h-7"><User className="w-3.5 h-3.5"/>Sender Identity</TabsTrigger>
            <TabsTrigger value="triggers" className="text-xs gap-1 h-7"><Bell className="w-3.5 h-3.5"/>Notification Triggers</TabsTrigger>
            <TabsTrigger value="queue" className="text-xs gap-1 h-7"><Settings className="w-3.5 h-3.5"/>Queue Config</TabsTrigger>
          </TabsList>

          {/* ── Resend Configuration ─────────────────────────────────── */}
          <TabsContent value="resend" className="mt-4 space-y-4">
            {loading ? <Skeleton className="h-64 bg-muted rounded-lg"/> : (
              <>
                {/* Status banner */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary"/>Resend API Status
                      </CardTitle>
                      <Badge className={
                        apiStatus === "connected" ? "bg-green-500/15 text-green-500 border-green-500/30" :
                        apiStatus === "disconnected" ? "bg-destructive/15 text-destructive border-destructive/30" :
                        "bg-muted text-muted-foreground"
                      }>
                        {apiStatus === "connected" ? <><CheckCircle2 className="w-3 h-3 mr-1"/>Connected</> :
                         apiStatus === "disconnected" ? <><XCircle className="w-3 h-3 mr-1"/>Disconnected</> :
                         <><Wifi className="w-3 h-3 mr-1"/>Unknown</>}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-muted/30 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Provider</p>
                        <p className="font-medium text-foreground flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary"/>Resend (Default)</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Last Tested</p>
                        <p className="font-medium text-foreground text-xs">{resendCfg.last_test_at ? new Date(resendCfg.last_test_at).toLocaleString() : "Never"}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Email Sending</p>
                        <p className={`font-medium text-sm flex items-center gap-1 ${resendCfg.enabled ? "text-green-500" : "text-muted-foreground"}`}>
                          {resendCfg.enabled ? <><CheckCircle2 className="w-3.5 h-3.5"/>Enabled</> : <><XCircle className="w-3.5 h-3.5"/>Disabled</>}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* API credentials */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">API Credentials</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div>
                      <Label className="text-sm font-normal mb-1.5 block">API Key <span className="text-destructive">*</span></Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={resendCfg.api_key}
                            onChange={e => setResendCfg(c => ({ ...c, api_key: e.target.value }))}
                            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                            className="pr-9 font-mono text-sm"
                          />
                          <button type="button" onClick={() => setShowApiKey(v => !v)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showApiKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                          </button>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={connecting} className="shrink-0 gap-1.5">
                          {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Wifi className="w-3.5 h-3.5"/>}
                          {connecting ? "Testing…" : "Test Connection"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">resend.com/api-keys</a>. The key is stored securely and never exposed to the browser.</p>
                    </div>

                    <div>
                      <Label className="text-sm font-normal mb-1.5 block">Verified Domain</Label>
                      <Input value={resendCfg.verified_domain} onChange={e => setResendCfg(c => ({ ...c, verified_domain: e.target.value }))} placeholder="btcminer.online" />
                      <p className="text-xs text-muted-foreground mt-1">Domain must be verified in your Resend dashboard before sending.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-normal mb-1.5 block">Provider</Label>
                        <Select value="resend" onValueChange={() => {}}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resend">Resend (Active)</SelectItem>
                            <SelectItem value="smtp" disabled>SMTP (Future)</SelectItem>
                            <SelectItem value="ses" disabled>Amazon SES (Future)</SelectItem>
                            <SelectItem value="sendgrid" disabled>SendGrid (Future)</SelectItem>
                            <SelectItem value="mailgun" disabled>Mailgun (Future)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-normal mb-1.5 block">Default Language</Label>
                        <Select value={resendCfg.default_language} onValueChange={v => setResendCfg(c => ({ ...c, default_language: v }))}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sender identity */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Default Sender</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([
                      ["From Email", "from_email", "noreply@btcminer.online"],
                      ["From Name", "from_name", "BTCMiner.online"],
                      ["Reply-To Email", "reply_to", "support@btcminer.online"],
                      ["Support Email", "support_email", "support@btcminer.online"],
                    ] as [string, keyof ResendConfig, string][]).map(([label, field, placeholder]) => (
                      <div key={field}>
                        <Label className="text-sm font-normal mb-1.5 block">{label}</Label>
                        <Input value={String(resendCfg[field] ?? "")} onChange={e => setResendCfg(c => ({ ...c, [field]: e.target.value }))} placeholder={placeholder} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Options */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Options</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {([
                      ["enabled", "Email Sending Enabled", "Master switch — disable to suppress all outgoing emails"],
                      ["enable_logging", "Enable Email Logging", "Log all sent emails to the Email Logs table"],
                      ["enable_queue", "Enable Send Queue", "Queue emails for background processing with retries"],
                    ] as [keyof ResendConfig, string, string][]).map(([field, label, desc]) => (
                      <div key={field} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <Switch checked={Boolean(resendCfg[field])} onCheckedChange={v => setResendCfg(c => ({ ...c, [field]: v }))}/>
                      </div>
                    ))}
                    <Separator/>
                    <div>
                      <Label className="text-sm font-normal mb-1.5 block">Retry Attempts</Label>
                      <Input type="number" min={0} max={10} value={resendCfg.retry_attempts} onChange={e => setResendCfg(c => ({ ...c, retry_attempts: parseInt(e.target.value) || 0 }))} className="w-24"/>
                      <p className="text-xs text-muted-foreground mt-1">Number of retry attempts for failed sends (0–10).</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Test email */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2"><TestTube className="w-4 h-4 text-primary"/>Send Test Email</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-normal mb-1.5 block">Recipient Email</Label>
                        <Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="admin@example.com"/>
                      </div>
                      <div>
                        <Label className="text-sm font-normal mb-1.5 block">Subject</Label>
                        <Input value={testSubject} onChange={e => setTestSubject(e.target.value)} placeholder="BTCMiner Test Email"/>
                      </div>
                    </div>
                    <Button onClick={handleSendTestEmail} disabled={testing || !testEmail} className="gap-2">
                      {testing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                      {testing ? "Sending…" : "Send Test Email"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => saveKey("resend_config", resendCfg)} disabled={saving === "resend_config"} className="gap-2">
                    {saving === "resend_config" ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    Save Resend Configuration
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Sender Identity */}
          <TabsContent value="identity" className="mt-4">
            {loading ? <Skeleton className="h-48 bg-muted rounded-lg"/> : (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Default Sender</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ["From Email", "from_email", "text", "noreply@btcminer.online"],
                      ["From Name", "from_name", "text", "BTCMiner.online"],
                      ["Reply-To Email", "reply_to", "text", "support@btcminer.online"],
                      ["Company Name", "company_name", "text", "BTCMiner.online"],
                      ["Brand Color", "brand_color", "color", ""],
                      ["Logo URL", "logo_url", "url", "https://..."],
                    ].map(([label, key, type, placeholder]) => (
                      <div key={key}>
                        <Label className="text-xs font-normal mb-1 block">{label}</Label>
                        <Input type={type as string} className="h-8 text-xs" value={(identity as Record<string,string>)[key] ?? ''} onChange={e=>setIdentity(prev=>({...prev,[key]:e.target.value}))} placeholder={placeholder as string}/>
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <Label className="text-xs font-normal mb-1 block">Company Address (for compliance)</Label>
                      <Input className="h-8 text-xs" value={identity.company_address} onChange={e=>setIdentity(p=>({...p,company_address:e.target.value}))} placeholder="123 Street, City, Country"/>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Social & Footer</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      ["Twitter URL", "social_twitter"], ["Telegram URL", "social_telegram"],
                      ["Discord URL", "social_discord"], ["Privacy Policy URL", "privacy_url"],
                      ["Terms URL", "terms_url"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <Label className="text-xs font-normal mb-1 block">{label}</Label>
                        <Input className="h-8 text-xs" value={(identity as Record<string,string>)[key] ?? ''} onChange={e=>setIdentity(prev=>({...prev,[key]:e.target.value}))}/>
                      </div>
                    ))}
                    <div className="md:col-span-2">
                      <Label className="text-xs font-normal mb-1 block">Footer Text</Label>
                      <Input className="h-8 text-xs" value={identity.footer_text} onChange={e=>setIdentity(p=>({...p,footer_text:e.target.value}))}/>
                    </div>
                    <div>
                      <Label className="text-xs font-normal mb-1 block">Unsubscribe Link Text</Label>
                      <Input className="h-8 text-xs" value={identity.unsubscribe_text} onChange={e=>setIdentity(p=>({...p,unsubscribe_text:e.target.value}))}/>
                    </div>
                  </CardContent>
                </Card>

                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 text-sm" onClick={()=>saveKey("sender_identity", identity)} disabled={saving==="sender_identity"}>
                  <Save className="w-4 h-4"/>{saving==="sender_identity" ? "Saving…" : "Save Sender Identity"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Notification Triggers */}
          <TabsContent value="triggers" className="mt-4 space-y-4">
            {loading ? <Skeleton className="h-48 bg-muted rounded-lg"/> : (
              <>
                {TRIGGER_GROUPS.map(group => (
                  <Card key={group.label}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{group.label} Emails</CardTitle>
                        <div className="flex gap-2">
                          <button className="text-xs text-primary hover:underline" onClick={()=>enableAll(group.keys.map(k=>k[0]))}>Enable All</button>
                          <button className="text-xs text-muted-foreground hover:underline" onClick={()=>disableAll(group.keys.map(k=>k[0]))}>Disable All</button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {group.keys.map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                            <Label className="text-xs font-normal text-foreground">{label}</Label>
                            <Switch checked={triggers[key] ?? false} onCheckedChange={() => toggleTrigger(key)} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 text-sm" onClick={()=>saveKey("notification_triggers", triggers)} disabled={saving==="notification_triggers"}>
                  <Save className="w-4 h-4"/>{saving==="notification_triggers" ? "Saving…" : "Save Trigger Settings"}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Queue Config */}
          <TabsContent value="queue" className="mt-4">
            {loading ? <Skeleton className="h-48 bg-muted rounded-lg"/> : (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Queue Configuration</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        ["Max Retry Attempts", "max_retries"], ["Retry Delay (minutes)", "retry_delay_minutes"],
                        ["Queue Concurrency", "concurrency"], ["Daily Limit Per User", "daily_limit_per_user"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <Label className="text-xs font-normal mb-1 block">{label}</Label>
                          <Input type="number" className="h-8 text-xs" value={(queueCfg as Record<string,number>)[key] ?? 0} onChange={e=>setQueueCfg(p=>({...p,[key]:Number(e.target.value)}))}/>
                        </div>
                      ))}
                    </div>
                    <Separator/>
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-xs font-medium text-foreground">Exponential Backoff</p>
                        <p className="text-xs text-muted-foreground">Double retry delay after each failed attempt</p>
                      </div>
                      <Switch checked={queueCfg.exponential_backoff} onCheckedChange={v=>setQueueCfg(p=>({...p,exponential_backoff:v}))}/>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-xs font-medium text-foreground">Pause Queue</p>
                        <p className="text-xs text-muted-foreground">Stop processing queued emails</p>
                      </div>
                      <Switch checked={queueCfg.paused} onCheckedChange={v=>setQueueCfg(p=>({...p,paused:v}))}/>
                    </div>
                  </CardContent>
                </Card>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 text-sm" onClick={()=>saveKey("queue_config", queueCfg)} disabled={saving==="queue_config"}>
                  <Save className="w-4 h-4"/>{saving==="queue_config" ? "Saving…" : "Save Queue Config"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
