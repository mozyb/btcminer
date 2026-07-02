import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PageMeta from "@/components/common/PageMeta";


const countries = ["United States", "United Kingdom", "Germany", "Canada", "Australia", "Singapore", "Japan", "Brazil", "India", "South Korea", "France", "Netherlands", "Switzerland", "Norway", "Iceland"];

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", username: "", email: "", password: "", confirmPassword: "", country: "", referralCode: "" });
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Account created! Please check your email to verify.");
      navigate("/verify-email", { state: { email: form.email } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length >= 12 && /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? "strong" : form.password.length >= 8 ? "medium" : "weak";

  return (
    <>
      <PageMeta
      title="Create Account | Join BTCMiner.online Bitcoin Mining Platform"
      description="Create your free BTCMiner.online account and start earning Bitcoin through cloud mining today. Quick registration, instant access to mining plans."
      canonical="/register"
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">BTC<span className="text-primary">Miner</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Start mining Bitcoin today</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">First Name</Label>
                  <Input value={form.firstName} onChange={set("firstName")} required />
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Last Name</Label>
                  <Input value={form.lastName} onChange={set("lastName")} required />
                </div>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Username</Label>
                <Input value={form.username} onChange={set("username")} placeholder="your_username" required />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Email Address</Label>
                <Input type="email" value={form.email} onChange={set("email")} required />
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Country</Label>
                <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} required className="pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1 flex-1">
                      {["weak", "medium", "strong"].map((s, i) => (
                        <div key={s} className={`h-1 flex-1 rounded-full ${
                          (strength === "weak" && i === 0) ? "bg-destructive" :
                          (strength === "medium" && i <= 1) ? "bg-warning" :
                          (strength === "strong") ? "bg-success" : "bg-muted"
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{strength}</span>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Confirm Password</Label>
                <Input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} required />
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Referral Code <span className="text-muted-foreground">(Optional)</span></Label>
                <Input value={form.referralCode} onChange={set("referralCode")} placeholder="BTCM-XXXXX" />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 accent-primary" />
                <span className="text-xs text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>,{" "}
                  <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, and{" "}
                  <Link to="/risk" className="text-primary hover:underline">Risk Disclosure</Link>
                </span>
              </label>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10" disabled={loading || !agreed}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">A verification email will be sent after registration</p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  
  </>);
}
