import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { CheckCircle, XCircle, Eye, MapPin, FileText, Clock, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type KycStatus = "pending" | "approved" | "rejected";

interface KycRow {
  id: string;
  user_id: string;
  user_email: string;
  full_name: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  doc_url: string | null;
  selfie_url: string | null;
  status: KycStatus;
  rejection_reason: string | null;
  created_at: string;
}

const kycColors: Record<string, string> = {
  approved:     "bg-success/10 text-success border-success/20",
  pending:      "bg-warning/10 text-warning border-warning/20",
  rejected:     "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminKYC() {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [acting, setActing] = useState<string | null>(null);

  // View modal
  const [viewing, setViewing] = useState<KycRow | null>(null);

  // Reject dialog
  const [rejecting, setRejecting] = useState<KycRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSaving, setRejectSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch KYC submissions joined with profiles for email
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*, profiles:user_id(email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: KycRow[] = (data ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_email: r.profiles?.email ?? r.user_id,
        full_name: r.full_name,
        street: r.street,
        city: r.city,
        state: r.state,
        postal_code: r.postal_code,
        country: r.country,
        doc_url: r.doc_url,
        selfie_url: r.selfie_url,
        status: r.status,
        rejection_reason: r.rejection_reason,
        created_at: r.created_at,
      }));
      setRows(mapped);
    } catch {
      toast.error("Failed to load KYC submissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (row: KycRow) => {
    setActing(row.id);
    try {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({ status: "approved", rejection_reason: null })
        .eq("id", row.id);
      if (error) throw error;
      await supabase.from("profiles").update({ kyc_status: "approved" }).eq("id", row.user_id);
      setRows(rs => rs.map(r => r.id === row.id ? { ...r, status: "approved", rejection_reason: null } : r));
      setViewing(null);
      toast.success(`KYC approved for ${row.user_email}`);
    } catch { toast.error("Failed to approve KYC."); }
    finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason."); return; }
    setRejectSaving(true);
    try {
      const { error } = await supabase
        .from("kyc_submissions")
        .update({ status: "rejected", rejection_reason: rejectReason.trim() })
        .eq("id", rejecting.id);
      if (error) throw error;
      await supabase.from("profiles").update({ kyc_status: "rejected" }).eq("id", rejecting.user_id);
      setRows(rs => rs.map(r => r.id === rejecting.id ? { ...r, status: "rejected", rejection_reason: rejectReason.trim() } : r));
      setViewing(null);
      setRejecting(null);
      setRejectReason("");
      toast.error(`KYC rejected for ${rejecting.user_email}`);
    } catch { toast.error("Failed to reject KYC."); }
    finally { setRejectSaving(false); }
  };

  const filtered = rows.filter(r => filter === "all" || r.status === filter);
  const pending = rows.filter(r => r.status === "pending").length;

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">KYC Review</h2>
            <p className="text-sm text-muted-foreground">
              {pending > 0 && <span className="text-warning font-medium">{pending} pending · </span>}
              {rows.length} total submissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1" onClick={load}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 bg-muted rounded" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No {filter !== "all" ? filter : ""} KYC submissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["User", "Full Name", "Address", "Status", "Submitted", "Actions"].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(row => (
                      <tr key={row.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${row.status === "pending" ? "bg-warning/5" : ""}`}>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="text-xs text-muted-foreground font-mono">{row.user_email}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-foreground text-sm">{row.full_name ?? <span className="text-muted-foreground">—</span>}</p>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap max-w-[200px]">
                          {row.city || row.country ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {[row.city, row.state, row.country].filter(Boolean).join(", ")}
                            </p>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge className={`text-xs ${kycColors[row.status] ?? "bg-muted text-muted-foreground"}`}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">{fmtDate(row.created_at)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs"
                              onClick={() => setViewing(row)}>
                              <Eye className="w-3 h-3" />Review
                            </Button>
                            {row.status === "pending" && (<>
                              <Button size="sm"
                                className="h-7 px-2 bg-success text-success-foreground hover:bg-success/90 text-xs gap-1"
                                disabled={acting === row.id}
                                onClick={() => handleApprove(row)}>
                                <CheckCircle className="w-3 h-3" />Approve
                              </Button>
                              <Button size="sm" variant="outline"
                                className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/30"
                                disabled={acting === row.id}
                                onClick={() => { setRejecting(row); setRejectReason(""); }}>
                                <XCircle className="w-3 h-3" />Reject
                              </Button>
                            </>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Review Modal */}
      <Dialog open={!!viewing} onOpenChange={v => !v && setViewing(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">KYC Review — {viewing?.user_email}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${kycColors[viewing.status] ?? "bg-muted text-muted-foreground"}`}>
                  {viewing.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                  {viewing.status === "approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                  {viewing.status === "rejected" && <XCircle className="w-3 h-3 mr-1" />}
                  {viewing.status}
                </Badge>
                <span className="text-xs text-muted-foreground">Submitted {fmtDate(viewing.created_at)}</span>
              </div>

              {/* Address details */}
              <div className="p-4 bg-muted/30 border border-border rounded space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />Residential Address</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><span className="text-muted-foreground">Full Name:</span> <span className="text-foreground font-medium">{viewing.full_name ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Country:</span> <span className="text-foreground font-medium">{viewing.country ?? "—"}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Street:</span> <span className="text-foreground font-medium">{viewing.street ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">City:</span> <span className="text-foreground font-medium">{viewing.city ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">State:</span> <span className="text-foreground font-medium">{viewing.state ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">Postal Code:</span> <span className="text-foreground font-medium">{viewing.postal_code ?? "—"}</span></div>
                </div>
              </div>

              {/* Documents */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Government-Issued ID", url: viewing.doc_url },
                  { label: "Proof of Address", url: viewing.selfie_url },
                ].map(doc => (
                  <div key={doc.label} className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">{doc.label}</p>
                    {doc.url ? (
                      <div className="border border-border rounded overflow-hidden bg-muted/20">
                        {doc.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={doc.url} alt={doc.label} className="w-full h-40 object-cover" />
                        ) : (
                          <div className="h-40 flex flex-col items-center justify-center gap-2">
                            <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
                            <p className="text-xs text-muted-foreground">PDF Document</p>
                          </div>
                        )}
                        <a href={doc.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 py-1.5 text-xs text-primary hover:text-primary/80 border-t border-border bg-card transition-colors">
                          <ExternalLink className="w-3 h-3" />Open full document
                        </a>
                      </div>
                    ) : (
                      <div className="h-40 border border-dashed border-border rounded flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Not uploaded</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {viewing.rejection_reason && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                  <strong>Rejection reason:</strong> {viewing.rejection_reason}
                </div>
              )}
            </div>
          )}
          {viewing?.status === "pending" && (
            <DialogFooter className="gap-2">
              <Button variant="outline" className="gap-1 text-destructive border-destructive/30"
                onClick={() => { setRejecting(viewing); setRejectReason(""); setViewing(null); }}>
                <XCircle className="w-3.5 h-3.5" />Reject
              </Button>
              <Button className="bg-success text-success-foreground hover:bg-success/90 gap-1"
                disabled={acting === viewing?.id}
                onClick={() => viewing && handleApprove(viewing)}>
                <CheckCircle className="w-3.5 h-3.5" />
                {acting === viewing?.id ? "Approving…" : "Approve KYC"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject with Reason Dialog */}
      <Dialog open={!!rejecting} onOpenChange={v => !v && setRejecting(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Reject KYC — {rejecting?.user_email}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-xs text-muted-foreground">The reason will be shown to the user so they know what to fix before resubmitting.</p>
            <div className="space-y-1.5">
              <Label className="text-sm font-normal">Rejection Reason <span className="text-destructive">*</span></Label>
              <Textarea
                rows={3}
                placeholder="e.g. ID document is blurry, address on proof doesn't match the address provided…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={rejectSaving} onClick={() => setRejecting(null)}>Cancel</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1"
              disabled={!rejectReason.trim() || rejectSaving} onClick={handleReject}>
              <XCircle className="w-3.5 h-3.5" />
              {rejectSaving ? "Rejecting…" : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
