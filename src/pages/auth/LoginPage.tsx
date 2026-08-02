import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Eye, EyeOff, AlertCircle, Mail, RefreshCw, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [unverifiedUserId, setUnverifiedUserId] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Show success banner when redirected here after email verification
  const justVerified = (location.state as { emailVerified?: boolean } | null)?.emailVerified === true;

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.error("Please enter your email and password"); return; }
    setLoading(true);
    setUnverifiedEmail(null);
    try {
      // login() now returns the fresh profile immediately — no useEffect race needed
      const profile = await login(email, password);
      if (!profile) {
        toast.error("Failed to load profile. Please try again.");
        setLoading(false);
        return;
      }
      if (!profile.emailVerified) {
        // Show inline banner instead of redirecting
        setUnverifiedEmail(profile.email);
        setUnverifiedUserId(profile.id);
        setLoading(false);
        return;
      }
      toast.success("Welcome back!");
      navigate(profile.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid email or password");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || !unverifiedUserId || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: unverifiedUserId, email: unverifiedEmail },
      });
      if (error) throw error;
      toast.success("Verification email sent — check your inbox.");
      setResendCooldown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <PageMeta
      title="Sign In | BTCMiner.online Cloud Mining Dashboard"
      description="Sign in to your BTCMiner.online account to monitor your Bitcoin mining performance, track rewards, and manage your cloud mining contracts."
      canonical="/login"
      noindex={true}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">BTC<span className="text-primary">Miner</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
          <p className="text-muted-foreground text-sm mt-1">Access your mining dashboard</p>
        </div>

        {/* Email verified success banner */}
        {justVerified && (
          <div className="mb-4 rounded-lg border border-green-500/40 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">Email verified successfully!</p>
                <p className="text-sm text-muted-foreground">Your account is now active. Sign in below to access your mining dashboard.</p>
              </div>
            </div>
          </div>
        )}

        {/* Unverified email banner */}
        {unverifiedEmail && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-1">Email not verified</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Your email address has not been verified. Please check your inbox and click the verification link before signing in.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" onClick={handleResendVerification} disabled={resendLoading || resendCooldown > 0} className="gap-2">
                    <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? "Sending…" : "Resend verification email"}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/verify-email" state={{ email: unverifiedEmail }}>
                      <Mail className="w-3.5 h-3.5 mr-1.5" />Go to verify page
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Email Address</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-normal">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">Create account</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  
  </>);
}

