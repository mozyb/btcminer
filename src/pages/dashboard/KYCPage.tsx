import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, CheckCircle, Clock, AlertCircle, FileText, X, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/db/supabase";

type KycStatus = "not_submitted" | "pending" | "approved" | "rejected";

interface KycDoc {
  doc_url: string | null;
  selfie_url: string | null;
  status: KycStatus;
  rejection_reason: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  full_name: string | null;
}

const COUNTRIES = [
  "United States","United Kingdom","Canada","Australia","Germany","France",
  "Singapore","Japan","South Korea","India","Brazil","Mexico","Nigeria",
  "South Africa","UAE","Netherlands","Switzerland","Hong Kong","Other",
];

function FilePicker({ label, hint, file, onPick, onClear }: {
  label: string; hint: string;
  file: File | null; onPick: (f: File) => void; onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <label className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${file ? "border-success/40 bg-success/5" : "border-dashed border-border hover:border-primary/40 hover:bg-muted/20"}`}>
        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="sr-only"
          onChange={e => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 5 * 1024 * 1024) { toast.error("File must be under 5 MB"); return; }
            onPick(f);
          }} />
        {file ? (
          <>
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
            <button type="button" onClick={e => { e.preventDefault(); onClear(); }}
              className="text-muted-foreground hover:text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Click to upload</span>
          </>
        )}
      </label>
    </div>
  );
}

export default function KYCPage() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KycStatus>("not_submitted");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Address form
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");

  // Files
  const [idFile, setIdFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("kyc_submissions")
      .select("doc_url, selfie_url, status, rejection_reason, street, city, state, postal_code, country, full_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const d = data as KycDoc;
          setKycStatus(d.status);
          setRejectionReason(d.rejection_reason);
          // Pre-fill address on rejected resubmission
          if (d.full_name) setFullName(d.full_name);
          if (d.street) setStreet(d.street);
          if (d.city) setCity(d.city);
          if (d.state) setState(d.state);
          if (d.postal_code) setPostalCode(d.postal_code);
          if (d.country) setCountry(d.country);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const addressComplete = fullName.trim() && street.trim() && city.trim() && country;
  const canSubmit = addressComplete && idFile && addressFile;

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    try {
      const idPath = `kyc/${user.id}/id-${Date.now()}-${idFile!.name}`;
      const { error: idErr } = await supabase.storage.from("kyc-documents").upload(idPath, idFile!, { upsert: true });
      if (idErr) throw idErr;
      const { data: idUrlData } = supabase.storage.from("kyc-documents").getPublicUrl(idPath);

      const addrPath = `kyc/${user.id}/address-${Date.now()}-${addressFile!.name}`;
      const { error: addrErr } = await supabase.storage.from("kyc-documents").upload(addrPath, addressFile!, { upsert: true });
      if (addrErr) throw addrErr;
      const { data: addrUrlData } = supabase.storage.from("kyc-documents").getPublicUrl(addrPath);

      const { error: insertErr } = await supabase.from("kyc_submissions").insert({
        user_id: user.id,
        doc_type: "id_and_address",
        doc_url: idUrlData.publicUrl,
        selfie_url: addrUrlData.publicUrl,
        status: "pending",
        full_name: fullName.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim() || null,
        postal_code: postalCode.trim() || null,
        country,
      });
      if (insertErr) throw insertErr;

      await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", user.id);
      setKycStatus("pending");
      toast.success("KYC documents submitted for review!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig: Record<KycStatus, { icon: React.FC<{ className?: string }>; color: string; bg: string; label: string }> = {
    not_submitted: { icon: FileText, color: "text-muted-foreground", bg: "bg-muted/30 border-border", label: "Not Submitted" },
    pending:       { icon: Clock,    color: "text-warning",          bg: "bg-warning/10 border-warning/20",     label: "Under Review" },
    approved:      { icon: CheckCircle, color: "text-success",       bg: "bg-success/10 border-success/20",     label: "Approved" },
    rejected:      { icon: AlertCircle, color: "text-destructive",   bg: "bg-destructive/10 border-destructive/20", label: "Rejected" },
  };
  const sc = statusConfig[kycStatus];

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 bg-muted rounded" />)}
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">KYC Verification</h2>
          <p className="text-sm text-muted-foreground">Identity verification for enhanced withdrawal limits</p>
        </div>

        {/* Status banner */}
        <div className={`flex items-start gap-3 p-4 rounded border ${sc.bg}`}>
          <sc.icon className={`w-5 h-5 mt-0.5 shrink-0 ${sc.color}`} />
          <div>
            <p className={`font-medium ${sc.color}`}>KYC Status: {sc.label}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kycStatus === "not_submitted" && "Complete KYC to increase withdrawal limits and access advanced features."}
              {kycStatus === "pending" && "Your documents are being reviewed. This typically takes 1–3 business days."}
              {kycStatus === "approved" && "Your identity has been verified. All platform features are unlocked."}
              {kycStatus === "rejected" && (rejectionReason ?? "Your submission was rejected. Please re-submit with clear, valid documents.")}
            </p>
          </div>
        </div>

        {(kycStatus === "not_submitted" || kycStatus === "rejected") && (<>
          {/* Step 1: Residential Address */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Step 1 — Residential Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Full Legal Name</Label>
                <Input placeholder="As it appears on your ID" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-normal">Street Address</Label>
                <Input placeholder="House number and street name" value={street} onChange={e => setStreet(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">City</Label>
                  <Input placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">State / Province</Label>
                  <Input placeholder="Optional" value={state} onChange={e => setState(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Postal / ZIP Code</Label>
                  <Input placeholder="Optional" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-normal">Country <span className="text-destructive">*</span></Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Document Upload */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Step 2 — Upload Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 p-3 bg-muted/30 border border-border rounded text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Documents must be clear, unobstructed, JPEG/PNG/PDF. Max 5 MB each.</span>
              </div>

              <FilePicker
                label="Government-Issued ID"
                hint="Passport, Driver License, or National ID card"
                file={idFile}
                onPick={setIdFile}
                onClear={() => setIdFile(null)}
              />

              <FilePicker
                label="Proof of Address"
                hint="Utility bill, bank statement, or government letter (last 3 months) — must match the address above"
                file={addressFile}
                onPick={setAddressFile}
                onClear={() => setAddressFile(null)}
              />

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Uploading…" : !addressComplete ? "Fill in address details above" : !idFile || !addressFile ? "Upload both documents to continue" : "Submit for Review"}
              </Button>
            </CardContent>
          </Card>
        </>)}

        {/* Benefits */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Benefits of KYC Verification</h3>
            <div className="space-y-2">
              {["Increased daily withdrawal limits","Access to higher-tier hashrate contracts","Priority support queue","Regulatory compliance for your protection"].map(b => (
                <div key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />{b}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
