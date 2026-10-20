import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageMeta from "@/components/common/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]                 = useState(false);
  const [loading, setLoading]               = useState(false);
  const [done, setDone]                     = useState(false);
  const [sessionReady, setSessionReady]     = useState(false);
  const [sessionError, setSessionError]     = useState(false);
  const navigate = useNavigate();

  // Supabase embeds the recovery token in the URL fragment.
  // onAuthStateChange fires PASSWORD_RECOVERY once the token is consumed.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    // Also check if we already have a valid session (user arrived via the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
      else {
        // Give it 3s for the fragment token to be processed
        setTimeout(() => {
          if (!sessionReady) setSessionError(true);
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strength =
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
      ? "strong"
      : password.length >= 8
      ? "medium"
      : "weak";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (password.length < 8)          { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/dashboard"), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <PageMeta
        title="Reset Password | BTCMiner.online"
        description="Create a new password for your BTCMiner.online mining account."
        canonical="/reset-password"
        noindex={true}
      />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">BTC<span className="text-primary">Miner</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            {done ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-success" />
                </div>
                <h2 className="font-semibold text-foreground">Password Updated!</h2>
                <p className="text-sm text-muted-foreground">Redirecting you to the dashboard…</p>
              </div>
            ) : sessionError ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="font-semibold text-foreground">Link Expired or Invalid</h2>
                <p className="text-sm text-muted-foreground">This reset link has expired or already been used.</p>
                <Button asChild className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/forgot-password">Request a new link</Link>
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Verifying reset link…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-1 flex-1">
                        {["weak", "medium", "strong"].map((s, i) => (
                          <div key={s} className={`h-1 flex-1 rounded-full ${
                            strength === "weak"   && i === 0 ? "bg-destructive" :
                            strength === "medium" && i <= 1  ? "bg-warning" :
                            strength === "strong"            ? "bg-success" : "bg-muted"
                          }`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{strength}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10"
                  disabled={loading || strength === "weak"}
                >
                  {loading ? "Updating…" : "Update Password"}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">← Back to Sign In</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
