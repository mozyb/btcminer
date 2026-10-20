import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ok(data: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  // ── Authenticate caller via their JWT ────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing Authorization header", 401);

  // Use anon client with caller's JWT to verify identity
  const callerDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: authErr } = await callerDb.auth.getUser();
  if (authErr || !caller) return err("Unauthorized", 401);

  // ── Check caller is admin ─────────────────────────────────────────────
  const adminDb = createClient(supabaseUrl, serviceKey);
  const { data: callerProfile, error: profileErr } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profileErr || callerProfile?.role !== "admin") {
    return err("Forbidden: admin access required", 403);
  }

  // ── Parse request body ────────────────────────────────────────────────
  let body: { action: string; target_user_id: string };
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const { action, target_user_id } = body;
  if (!action || !target_user_id) return err("Missing action or target_user_id");

  // ── Prevent self-action ───────────────────────────────────────────────
  if (target_user_id === caller.id) {
    return err("You cannot perform this action on your own account");
  }

  // ── Fetch target profile ──────────────────────────────────────────────
  const { data: target, error: targetErr } = await adminDb
    .from("profiles")
    .select("id, role, email")
    .eq("id", target_user_id)
    .single();

  if (targetErr || !target) return err("Target user not found", 404);

  // ── Dispatch action ───────────────────────────────────────────────────
  switch (action) {
    case "promote": {
      if (target.role === "admin") return err("User is already an admin");
      const { error } = await adminDb
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", target_user_id);
      if (error) return err("Failed to promote user: " + error.message, 500);
      return ok({ message: `${target.email} promoted to admin` });
    }

    case "demote": {
      if (target.role !== "admin") return err("User is not an admin");

      // Guard: don't allow demoting if only 1 admin remains
      const { count } = await adminDb
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return err("Cannot demote the last admin account");
      }

      const { error } = await adminDb
        .from("profiles")
        .update({ role: "user" })
        .eq("id", target_user_id);
      if (error) return err("Failed to demote admin: " + error.message, 500);
      return ok({ message: `${target.email} demoted to user` });
    }

    case "delete": {
      // Guard: don't allow deleting the last admin
      if (target.role === "admin") {
        const { count } = await adminDb
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1) {
          return err("Cannot delete the last admin account");
        }
      }

      // Delete from auth.users — profile cascades via FK
      const { error } = await adminDb.auth.admin.deleteUser(target_user_id);
      if (error) return err("Failed to delete user: " + error.message, 500);
      return ok({ message: `User ${target.email} deleted` });
    }

    default:
      return err(`Unknown action: ${action}`);
  }
});
