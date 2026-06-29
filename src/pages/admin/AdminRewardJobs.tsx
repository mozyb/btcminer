import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import {
  Play, RefreshCw, CheckCircle2, XCircle, Clock,
  Zap, Bitcoin, TrendingUp, Activity, AlertTriangle,
} from "lucide-react";

interface RewardJob {
  id: string;
  run_date: string;
  status: "pending" | "running" | "completed" | "failed";
  btc_price: number | null;
  network_hashrate: number | null;
  network_difficulty: number | null;
  block_reward: number | null;
  contracts_processed: number;
  total_btc_credited: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface RewardCredit {
  id: string;
  job_id: string;
  user_id: string;
  contract_id: string;
  btc_amount: number;
  usd_value: number;
  network_hashrate: number;
  created_at: string;
}

function StatusBadge({ status }: { status: RewardJob["status"] }) {
  const map: Record<RewardJob["status"], { label: string; className: string; icon: React.ReactNode }> = {
    completed: { label: "Completed", className: "bg-success/10 text-success border-success/20", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed:    { label: "Failed",    className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="w-3 h-3" /> },
    running:   { label: "Running",   className: "bg-primary/10 text-primary border-primary/20", icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    pending:   { label: "Pending",   className: "bg-muted text-muted-foreground border-border", icon: <Clock className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.pending;
  return (
    <Badge className={`${s.className} flex items-center gap-1 text-xs`}>
      {s.icon}{s.label}
    </Badge>
  );
}

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtBtc(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(8);
}
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminRewardJobs() {
  const [jobs, setJobs] = useState<RewardJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [selectedJob, setSelectedJob] = useState<RewardJob | null>(null);
  const [credits, setCredits] = useState<RewardCredit[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("daily_reward_jobs")
      .select("*")
      .order("run_date", { ascending: false })
      .limit(30);
    if (error) toast.error("Failed to load jobs: " + error.message);
    else setJobs((data as RewardJob[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const loadCredits = useCallback(async (jobId: string) => {
    setCreditsLoading(true);
    const { data, error } = await supabase
      .from("reward_credits")
      .select("*")
      .eq("job_id", jobId)
      .order("btc_amount", { ascending: false })
      .limit(50);
    if (error) toast.error("Failed to load credits");
    else setCredits((data as RewardCredit[]) ?? []);
    setCreditsLoading(false);
  }, []);

  const selectJob = useCallback((job: RewardJob) => {
    setSelectedJob(job);
    loadCredits(job.id);
  }, [loadCredits]);

  const triggerJob = useCallback(async (runDate?: string) => {
    setTriggering(true);
    const date = runDate ?? new Date().toISOString().slice(0, 10);
    try {
      const { data, error } = await supabase.functions.invoke("credit-daily-rewards", {
        body: { run_date: date },
      });
      if (error) throw error;
      const result = data as { ok: boolean; message?: string; error?: string; contracts_processed?: number; total_btc_credited?: number };
      if (!result.ok) throw new Error(result.error ?? "Unknown error");
      toast.success(
        result.message ??
        `Job complete — ${result.contracts_processed} contracts, ${fmtBtc(result.total_btc_credited ?? 0)} BTC credited`
      );
      await loadJobs();
    } catch (err) {
      toast.error("Job failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTriggering(false);
    }
  }, [loadJobs]);

  // Summary stats
  const completedJobs = jobs.filter(j => j.status === "completed");
  const totalBtcAllTime = completedJobs.reduce((s, j) => s + (j.total_btc_credited ?? 0), 0);
  const totalContractsAllTime = completedJobs.reduce((s, j) => s + (j.contracts_processed ?? 0), 0);
  const lastJob = completedJobs[0] ?? null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayJobDone = jobs.some(j => j.run_date === todayStr && j.status === "completed");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">Daily Reward Jobs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Scheduled BTC mining reward distribution — runs daily at 00:05 UTC
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadJobs} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
              onClick={() => triggerJob()}
              disabled={triggering || todayJobDone}
            >
              {triggering
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Running…</>
                : <><Play className="w-3.5 h-3.5" />{todayJobDone ? "Today Done ✓" : "Run Today's Job"}</>}
            </Button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total BTC Credited", value: fmtBtc(totalBtcAllTime), icon: Bitcoin, color: "text-primary" },
            { label: "Jobs Completed", value: completedJobs.length.toString(), icon: CheckCircle2, color: "text-success" },
            { label: "Contracts (last run)", value: lastJob ? lastJob.contracts_processed.toString() : "—", icon: Zap, color: "text-info" },
            { label: "Last BTC Price", value: lastJob?.btc_price ? `$${fmt(lastJob.btc_price, 0)}` : "—", icon: TrendingUp, color: "text-primary" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Job History */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Job History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 bg-muted rounded" />)}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No jobs run yet.</p>
                  <p className="text-xs text-muted-foreground">Click "Run Today's Job" to process today's rewards.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {jobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => selectJob(job)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selectedJob?.id === job.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{job.run_date}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {fmtBtc(job.total_btc_credited)} BTC · {job.contracts_processed} contracts
                          </p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      {job.error_message && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{job.error_message}</span>
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Detail */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedJob ? `Job Detail — ${selectedJob.run_date}` : "Select a Job"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedJob ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click a job to view its details and credit breakdown.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Network snapshot */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Status", <StatusBadge key="s" status={selectedJob.status} />],
                      ["BTC Price", selectedJob.btc_price ? `$${fmt(selectedJob.btc_price, 0)}` : "—"],
                      ["Hashrate", selectedJob.network_hashrate ? `${fmt(selectedJob.network_hashrate)} EH/s` : "—"],
                      ["Difficulty", selectedJob.network_difficulty ? `${fmt(selectedJob.network_difficulty)}T` : "—"],
                      ["Block Reward", selectedJob.block_reward ? `${selectedJob.block_reward} BTC` : "—"],
                      ["Contracts", selectedJob.contracts_processed.toString()],
                      ["Total BTC", <span key="b" className="font-mono text-primary">{fmtBtc(selectedJob.total_btc_credited)}</span>],
                      ["Started", fmtDate(selectedJob.started_at)],
                      ["Completed", fmtDate(selectedJob.completed_at)],
                    ].map(([k, v], i) => (
                      <div key={i} className={`${i % 2 === 0 ? "" : ""} p-2 bg-muted/30 rounded`}>
                        <p className="text-muted-foreground mb-0.5">{k}</p>
                        <div className="font-medium text-foreground">{v}</div>
                      </div>
                    ))}
                  </div>

                  {selectedJob.error_message && (
                    <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="break-words">{selectedJob.error_message}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Per-contract credits */}
                  <div>
                    <p className="text-xs font-medium text-foreground mb-2">Credit Breakdown (top 50)</p>
                    {creditsLoading ? (
                      <div className="space-y-1.5">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 bg-muted rounded" />)}
                      </div>
                    ) : credits.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No credits recorded for this job.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              {["Contract", "BTC Credited", "USD Value"].map(h => (
                                <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {credits.map(c => (
                              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                <td className="py-1.5 px-2 font-mono text-foreground">{c.contract_id.slice(0, 8)}…</td>
                                <td className="py-1.5 px-2 font-mono text-primary">{fmtBtc(c.btc_amount)}</td>
                                <td className="py-1.5 px-2 font-mono text-muted-foreground">${fmt(c.usd_value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Re-run failed jobs */}
                  {selectedJob.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1.5 text-xs"
                      onClick={() => triggerJob(selectedJob.run_date)}
                      disabled={triggering}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
                      Retry {selectedJob.run_date}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info box */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">How rewards are calculated</p>
            <p>
              For each active contract: <span className="font-mono text-foreground">dailyBTC = (hashrateTH / networkTH) × 144 blocks × 3.125 BTC − maintenance</span>
            </p>
            <p>
              Network hashrate is fetched live from mempool.space (fallback: blockchain.info). Maintenance fee: <span className="font-mono">$0.0028/TH/day</span>.
            </p>
            <p>
              Each run is idempotent — re-running the same date skips if already completed. Failed jobs can be retried.
              Without pg_cron, trigger manually or schedule via an external cron service hitting the <span className="font-mono">credit-daily-rewards</span> Edge Function.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
