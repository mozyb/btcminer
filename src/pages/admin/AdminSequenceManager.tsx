import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "@/components/layouts/AdminLayout";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { RefreshCw, Save, Plus, Trash2, GripVertical, Mail, ChevronDown, ChevronUp } from "lucide-react";

interface Sequence {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}
interface Step {
  id?: string;
  sequence_id?: string;
  step_order: number;
  delay_hours: number;
  subject: string;
  body_html: string;
}

const SEQ_LABELS: Record<string, string> = {
  unverified_reminder: "Unverified User Reminders",
  no_deposit: "Verified — No Deposit",
  no_contract: "Deposited — No Contract",
  abandoned_purchase: "Abandoned Purchase Recovery",
};
const SEQ_DEFAULTS: Record<string, Step[]> = {
  unverified_reminder: [
    { step_order: 1, delay_hours: 1, subject: "Please verify your BTCMiner.online email", body_html: "<p>Hi there,</p><p>Please verify your email to unlock your account.</p><p><a href='{{verification_link}}'>Verify Email →</a></p>" },
    { step_order: 2, delay_hours: 24, subject: "Reminder: Verify your email to start mining", body_html: "<p>Your account is waiting — verify to begin your mining journey.</p><p><a href='{{verification_link}}'>Verify Now →</a></p>" },
    { step_order: 3, delay_hours: 72, subject: "Don't miss out — verify your BTCMiner account", body_html: "<p>Your verification link is still active. Complete registration to access exclusive mining plans.</p>" },
    { step_order: 4, delay_hours: 168, subject: "Last reminder: Your mining account awaits", body_html: "<p>This is your final reminder to verify your email and start earning Bitcoin.</p>" },
  ],
  no_deposit: [
    { step_order: 1, delay_hours: 24, subject: "Getting started with BTCMiner.online", body_html: "<p>Welcome! Here's how to make your first deposit and start mining Bitcoin.</p>" },
    { step_order: 2, delay_hours: 72, subject: "How cloud mining works — a simple guide", body_html: "<p>Cloud mining lets you earn Bitcoin without hardware. Learn how it works.</p>" },
    { step_order: 3, delay_hours: 168, subject: "Choosing the right mining contract for you", body_html: "<p>We have plans for every budget. Here's how to pick the right one.</p>" },
    { step_order: 4, delay_hours: 336, subject: "Current mining opportunities on BTCMiner", body_html: "<p>Check out our latest contracts — limited availability. Fund your account today.</p>" },
  ],
  no_contract: [
    { step_order: 1, delay_hours: 24, subject: "You have funds — start mining now!", body_html: "<p>Your deposit is ready. Browse our mining contracts and start earning BTC.</p><p><a href='{{marketplace_link}}'>View Contracts →</a></p>" },
    { step_order: 2, delay_hours: 72, subject: "Your balance is waiting to work for you", body_html: "<p>Idle funds don't earn. Pick a mining contract and activate your earning potential.</p>" },
    { step_order: 3, delay_hours: 168, subject: "How mining rewards are calculated", body_html: "<p>Understand exactly how your daily BTC rewards are calculated before you buy.</p>" },
  ],
  abandoned_purchase: [
    { step_order: 1, delay_hours: 2, subject: "You left something behind on BTCMiner", body_html: "<p>You were so close! Complete your purchase of {{contract_name}} to start mining.</p><p><a href='{{purchase_link}}'>Resume Purchase →</a></p>" },
    { step_order: 2, delay_hours: 24, subject: "Your selected mining contract is still available", body_html: "<p>{{contract_name}} is still waiting. Complete your order and start earning Bitcoin today.</p>" },
    { step_order: 3, delay_hours: 72, subject: "Final notice — your cart is about to expire", body_html: "<p>This is your last chance to complete your {{contract_name}} purchase at the current price.</p>" },
  ],
};

export default function AdminSequenceManager() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [steps, setSteps] = useState<Record<string, Step[]>>({});
  const [activeSeq, setActiveSeq] = useState<string>("unverified_reminder");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));

  const load = useCallback(async () => {
    const { data: seqs } = await supabase.from("automation_sequences").select("*").order("created_at");
    if (seqs) setSequences(seqs);
    const stepsMap: Record<string, Step[]> = {};
    for (const seq of (seqs ?? [])) {
      const { data } = await supabase.from("automation_sequence_steps")
        .select("*").eq("sequence_id", seq.id).order("step_order");
      stepsMap[seq.type] = data?.length ? data : SEQ_DEFAULTS[seq.type] ?? [];
    }
    setSteps(stepsMap);
  }, []);

  useEffect(() => { load(); }, [load]);

  const curSeq = sequences.find(s => s.type === activeSeq);
  const curSteps = steps[activeSeq] ?? SEQ_DEFAULTS[activeSeq] ?? [];

  const toggleSeq = async (seqId: string, active: boolean) => {
    await supabase.from("automation_sequences").update({ is_active: active }).eq("id", seqId);
    setSequences(prev => prev.map(s => s.id === seqId ? { ...s, is_active: active } : s));
    toast.success(active ? "Sequence activated" : "Sequence paused");
  };

  const updateStep = (order: number, field: keyof Step, value: string | number) => {
    setSteps(prev => ({
      ...prev,
      [activeSeq]: (prev[activeSeq] ?? []).map(s => s.step_order === order ? { ...s, [field]: value } : s),
    }));
  };

  const addStep = () => {
    const next = (curSteps[curSteps.length - 1]?.step_order ?? 0) + 1;
    setSteps(prev => ({
      ...prev,
      [activeSeq]: [...(prev[activeSeq] ?? []), { step_order: next, delay_hours: 24, subject: "New Email", body_html: "<p>Email content here</p>" }],
    }));
    setExpanded(prev => new Set([...prev, next]));
  };

  const removeStep = (order: number) => {
    setSteps(prev => ({
      ...prev,
      [activeSeq]: (prev[activeSeq] ?? []).filter(s => s.step_order !== order).map((s, i) => ({ ...s, step_order: i + 1 })),
    }));
  };

  const saveSequence = async () => {
    if (!curSeq) return;
    setSaving(true);
    // Delete existing steps and re-insert
    await supabase.from("automation_sequence_steps").delete().eq("sequence_id", curSeq.id);
    const inserts = curSteps.map(s => ({ ...s, sequence_id: curSeq.id, id: undefined }));
    const { error } = await supabase.from("automation_sequence_steps").insert(inserts);
    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Sequence saved");
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Automation Sequences</h2>
            <p className="text-sm text-muted-foreground">Configure behavior-based email sequences</p>
          </div>
          <Button size="sm" onClick={saveSequence} disabled={saving} className="gap-1.5 h-8 text-xs">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Sequence
          </Button>
        </div>

        <Tabs value={activeSeq} onValueChange={setActiveSeq}>
          <TabsList className="flex-wrap h-auto gap-1">
            {Object.entries(SEQ_LABELS).map(([type, label]) => {
              const seq = sequences.find(s => s.type === type);
              return (
                <TabsTrigger key={type} value={type} className="text-xs relative">
                  {label}
                  {seq && (
                    <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${seq.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.keys(SEQ_LABELS).map(type => (
            <TabsContent key={type} value={type} className="space-y-4 mt-4">
              {/* Sequence header */}
              {curSeq && (
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{SEQ_LABELS[type]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type === "unverified_reminder" && "Stops when user verifies email"}
                        {type === "no_deposit" && "Stops when user makes first deposit"}
                        {type === "no_contract" && "Stops when user purchases first contract"}
                        {type === "abandoned_purchase" && "Stops when user completes purchase"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={curSeq.is_active ? "bg-green-500/10 text-green-500 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                        {curSeq.is_active ? "Active" : "Paused"}
                      </Badge>
                      <Switch checked={curSeq.is_active} onCheckedChange={v => toggleSeq(curSeq.id, v)} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Steps */}
              <div className="space-y-3">
                {(steps[type] ?? SEQ_DEFAULTS[type] ?? []).map((step, idx) => (
                  <Card key={step.step_order} className="bg-card border-border">
                    <CardHeader className="py-3 px-4 cursor-pointer flex flex-row items-center gap-3"
                      onClick={() => setExpanded(prev => {
                        const n = new Set(prev);
                        n.has(step.step_order) ? n.delete(step.step_order) : n.add(step.step_order);
                        return n;
                      })}>
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">Step {idx + 1}</Badge>
                          <span className="text-sm font-medium text-foreground truncate">{step.subject}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Send after {step.delay_hours}h</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={e => { e.stopPropagation(); removeStep(step.step_order); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        {expanded.has(step.step_order) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                    {expanded.has(step.step_order) && (
                      <CardContent className="pt-0 px-4 pb-4 space-y-3">
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Delay (hours)</Label>
                            <Input type="number" min={1} value={step.delay_hours}
                              onChange={e => updateStep(step.step_order, "delay_hours", Number(e.target.value))}
                              className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Step Order</Label>
                            <Input type="number" min={1} value={step.step_order}
                              onChange={e => updateStep(step.step_order, "step_order", Number(e.target.value))}
                              className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email Subject</Label>
                          <Input value={step.subject}
                            onChange={e => updateStep(step.step_order, "subject", e.target.value)}
                            className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email Body (HTML)</Label>
                          <Textarea rows={5} value={step.body_html}
                            onChange={e => updateStep(step.step_order, "body_html", e.target.value)}
                            className="text-sm font-mono resize-none" />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add Step
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
