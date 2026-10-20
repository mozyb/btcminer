import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset link sent.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
      title="Reset Password | BTCMiner.online"
      description="Reset your BTCMiner.online account password. Enter your email address and we'll send you a secure link to create a new password."
      canonical="/forgot-password"
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
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <CheckCircle className="w-6 h-6 text-success mx-auto" />
                <h2 className="font-semibold text-foreground">Reset Link Sent</h2>
                <p className="text-sm text-muted-foreground">
                  Check your inbox at <strong className="text-foreground">{email}</strong>.
                  The link expires in <strong className="text-foreground">1 hour</strong>.
                </p>
                <p className="text-xs text-muted-foreground">Don't see it? Check your spam folder.</p>
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">← Back to Sign In</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  
  </>);
}
