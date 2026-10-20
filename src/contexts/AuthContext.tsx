import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/db/supabase";
import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  country: string;
  role: "user" | "admin";
  kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  twoFAEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAdmin: boolean;
  isImpersonating: boolean;
  realAdmin: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshProfile: () => Promise<void>;
  impersonateUser: (targetUserId: string) => Promise<boolean>;
  stopImpersonating: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  country: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Always reads fresh email_verified from DB — never trusts stale session ──
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, first_name, last_name, country, role, kyc_status, twofa_enabled, email_verified, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("[AuthContext] fetchProfile error:", error.message);
      return null;
    }
    if (!data) return null;
    return {
      id: data.id,
      email: data.email ?? "",
      firstName: data.first_name ?? "",
      lastName: data.last_name ?? "",
      username: data.username ?? "",
      country: data.country ?? "",
      role: (data.role ?? "user") as "user" | "admin",
      kycStatus: (data.kyc_status ?? "not_submitted") as UserProfile["kycStatus"],
      twoFAEnabled: data.twofa_enabled ?? false,
      emailVerified: data.email_verified === true, // strict boolean — never trust falsy coercion
      createdAt: data.created_at,
    };
  } catch (e) {
    console.error("[AuthContext] fetchProfile fatal:", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<UserProfile | null>(() => {
    try {
      const stored = sessionStorage.getItem("btcminer_impersonate_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track the current session's user id so we don't double-load on rapid events
  const loadingForId = useRef<string | null>(null);

  const loadSession = async (s: Session | null) => {
    setSession(s);
    if (s?.user?.id) {
      // Deduplicate rapid onAuthStateChange events for the same user
      if (loadingForId.current === s.user.id) return;
      loadingForId.current = s.user.id;
      const profile = await fetchProfile(s.user.id);
      // Only update if this is still the relevant session
      setUser(profile);
      loadingForId.current = null;
    } else {
      loadingForId.current = null;
      setUser(null);
    }
    setLoading(false);
  };

  const impersonateUser = async (targetUserId: string): Promise<boolean> => {
    // Current user or realAdmin must be admin
    const isAdminUser = user?.role === "admin";
    if (!isAdminUser && !impersonatedUser) {
      return false;
    }
    try {
      const targetProfile = await fetchProfile(targetUserId);
      if (!targetProfile) return false;
      if (targetProfile.role === "admin") return false;
      setImpersonatedUser(targetProfile);
      sessionStorage.setItem("btcminer_impersonate_user", JSON.stringify(targetProfile));
      return true;
    } catch (err) {
      console.error("[AuthContext] Impersonation failed:", err);
      return false;
    }
  };

  const stopImpersonating = () => {
    sessionStorage.removeItem("btcminer_impersonate_user");
    setImpersonatedUser(null);
  };

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session: s } }) => loadSession(s));

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      loadSession(s);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // Force an immediate profile fetch so emailVerified is fresh before any redirect
    if (data.user) {
      const profile = await fetchProfile(data.user.id);
      setSession(data.session);
      setUser(profile);
      return profile;
    }
    return null;
  };

  const logout = async () => {
    sessionStorage.removeItem("btcminer_impersonate_user");
    setImpersonatedUser(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    loadingForId.current = null;
  };

  const register = async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // No emailRedirectTo — we handle verification ourselves
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          username: data.username,
          country: data.country,
        },
      },
    });
    if (error) throw new Error(error.message);
    if (authData.user) {
      // Update profile fields (trigger may have already created the row)
      await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        country: data.country,
        email_verified: false,
      }, { onConflict: "id" });

      // Send our custom verification email — fully non-blocking; failures are silent
      supabase.functions.invoke("send-verification-email", {
        body: {
          user_id: authData.user.id,
          email: data.email,
          first_name: data.firstName || data.username,
        },
      }).catch(() => {/* resend button available on verify-email page */});

      // Link popup lead to new user and update funnel — non-blocking
      const popupData = JSON.parse(localStorage.getItem("btcminer_welcome_popup") ?? "{}");
      supabase.functions.invoke("marketing-automation", {
        body: {
          action: "convert_lead",
          user_id: authData.user.id,
          email: data.email,
          source: "popup",
          variant: popupData.capturedVariant || "control",
        },
      }).catch(() => {});

      // Notify admin of new registration — non-blocking
      supabase.functions.invoke("notify-admin", {
        body: {
          type:       "user_registered",
          user_id:    authData.user.id,
          email:      data.email,
          full_name:  `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || data.username,
          username:   data.username,
          country:    data.country ?? "",
        },
      }).catch(() => {});
    }
  };

  // Refresh profile from DB — call this after email verification completes
  const refreshProfile = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    const uid = s?.user?.id ?? session?.user?.id;
    if (uid) {
      const profile = await fetchProfile(uid);
      setUser(profile);
    }
  };

  const effectiveUser = impersonatedUser ?? user;
  const isRealAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      session,
      isAdmin: isRealAdmin,
      isImpersonating: Boolean(impersonatedUser),
      realAdmin: user,
      loading,
      login, logout, register, refreshProfile,
      impersonateUser, stopImpersonating,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
