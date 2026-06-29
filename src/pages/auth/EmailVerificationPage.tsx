import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Mail, CheckCircle, RefreshCw, AlertCircle, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";


export default function EmailVerificationPage() {
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "error" | "already_verified">("idle");
  const [verifyError, setVerifyError] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasVerified = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile, logout, isAdmin } = useAuth();

  // Email shown while waiting — from router state or from the auth user
  const email = (location.state as { email?: string } | null)?.email ?? user?.email ?? "";

  // ── If user is already verified, go straight to dashboard ────────────────
  useEffect(() => {
    if (user?.emailVerified && verifyStatus === "idle" && !searchParams.get("token")) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [user, isAdmin, verifyStatus, searchParams, navigate]);

  // ── Auto-verify when token + uid are present in URL ──────────────────────
  useEffect(() => {
    const token = searchParams.get("token");
    const uid   = searchParams.get("uid");
    if (!token || !uid || hasVerified.current) return;
    hasVerified.current = true; // prevent double-invocation (StrictMode)

    const doVerify = async () => {
      setVerifying(true);
      try {
        const { data, error } = await supabase.functions.invoke("verify-email-token", {
          body: { token, user_id: uid },
        });

        if (error) {
          // "already verified" is not a fatal error
          const msg: string = error.message ?? "";
          if (msg.toLowerCase().includes("already")) {
            setVerifyStatus("already_verified");
          } else {
            setVerifyStatus("error");
            setVerifyError(msg || "Verification failed. The link may have expired.");
          }
        } else if (!data?.ok) {
          const msg: string = data?.error ?? "Verification failed. The link may have expired.";
          if (msg.toLowerCase().includes("already")) {
            setVerifyStatus("already_verified");
          } else {
            setVerifyStatus("error");
            setVerifyError(msg);
          }
        } else {
          // Success — refresh profile so ProtectedRoute reads new email_verified = true
          await refreshProfile();
          setVerifyStatus("success");
          toast.success("Email verified! Redirecting…");
          setTimeout(() => navigate(isAdmin ? "/admin" : "/dashboard", { replace: true }), 2000);
        }
      } catch (err) {
        setVerifyStatus("error");
        setVerifyError(err instanceof Error ? err.message : "Verification failed.");
      } finally {
        setVerifying(false);
      }
    };
    doVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Countdown timer for resend button ────────────────────────────────────
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown(c => { if (c <= 1) { clearInterval(cooldownRef.current!); return 0; } return c - 1; });
      }, 1000);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending || !user) return;
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, email: user.email, first_name: user.firstName },
      });
      if (error) throw error;
      toast.success("Verification email sent — check your inbox.");
      setCooldown(60);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // ── Token processing ──────────────────────────────────────────────────────
  if (verifying) {
    return (
      <>
        <PageMeta
      title="Verify Your Email | BTCMiner.online"
      description="Verify your email address to activate your BTCMiner.online mining account and access your dashboard."
      canonical="/verify-email"
      noindex={true}
      />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-foreground font-medium">Verifying your email…</p>
          <p className="text-muted-foreground text-sm mt-1">Please wait a moment.</p>
        </div>
      </div>
    </>
    );
  }

  if (verifyStatus === "already_verified") {
    return (
      <>
      <PageMeta
      title="Verify Your Email | BTCMiner.online"
      description="Verify your email address to activate your BTCMiner.online mining account and gain full dashboard access."
      canonical="/verify-email"
      noindex={true}
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Already Verified</h1>
          <p className="text-muted-foreground mb-6">Your email address has already been verified. You can sign in normally.</p>
          <Button onClick={() => navigate("/login", { replace: true })} className="w-full">Go to Sign In</Button>
        </div>
      </div>
    </>
    );
  }

  if (verifyStatus === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
          <p className="text-muted-foreground mb-6">Your email has been verified. Redirecting to your dashboard…</p>
          <Button onClick={() => navigate(isAdmin ? "/admin" : "/dashboard", { replace: true })} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (verifyStatus === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <Cpu className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl text-foreground">BTC<span className="text-primary">Miner</span></span>
            </Link>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Verification Failed</h1>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{verifyError}</p>
              {user && (
                <Button onClick={handleResend} disabled={resending || cooldown > 0} className="w-full gap-2 mb-3">
                  <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Send new verification email"}
                </Button>
              )}
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">← Back to Sign In</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Default: waiting for user to click the link in their inbox ───────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">BTC<span className="text-primary">Miner</span></span>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-9 h-9 text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2 text-balance">Check Your Email</h1>
            {email && <p className="text-sm font-medium text-primary mb-1">{email}</p>}
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed text-pretty">
              We sent a verification link to your email address. Click the link to activate your account and access your mining dashboard.
            </p>

            <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 text-sm text-left space-y-2.5">
              {[
                "Check your spam/junk folder if not found in inbox",
                "The verification link expires in 24 hours",
                "Dashboard access is blocked until your email is verified",
                "Request a new link using the button below if needed",
              ].map(tip => (
                <div key={tip} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{tip}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !user}
              className="w-full gap-2 mb-3"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend verification email"}
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="w-full gap-2 text-muted-foreground hover:text-foreground mb-3">
              <LogOut className="w-4 h-4" />
              Sign out and use a different account
            </Button>

            <Link to="/dashboard/support" className="text-xs text-muted-foreground hover:text-foreground">
              Need help? Contact support
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

