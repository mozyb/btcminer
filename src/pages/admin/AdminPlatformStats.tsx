import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";

interface Stat { key: string; value: string; label: string | null; updated_at: string; }

export default function AdminPlatformStats() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("platform_stats").select("*").order("key");
    setStats(data ?? []);
    const init: Record<string, string> = {};
    (data ?? []).forEach((s: Stat) => { init[s.key] = s.value; });
    setEdits(init);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const promises = Object.entries(edits).map(([key, value]) =>
      supabase.from("platform_stats").update({ value, updated_at: new Date().toISOString() }).eq("key", key)
    );
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length) { toast.error("Some saves failed"); }
    else { toast.success("Platform stats updated"); }
    setSaving(false); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">Edit the live counter values shown on the homepage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save All"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {stats.map(s => (
            <Card key={s.key} className="bg-card border-border">
              <CardContent className="p-5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">{s.label ?? s.key}</Label>
                <div className="mt-2">
                  <Input
                    value={edits[s.key] ?? s.value}
                    onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                    className="font-mono text-lg font-bold"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Last updated: {new Date(s.updated_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
