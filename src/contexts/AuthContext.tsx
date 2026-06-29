import React, { createContext, useContext, useState, useEffect } from "react";
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
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshProfile: () => Promise<void>;
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

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, first_name, last_name, country, role, kyc_status, twofa_enabled, email_verified, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email ?? "",
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    username: data.username ?? "",
    country: data.country ?? "",
    role: data.role as "user" | "admin",
    kycStatus: data.kyc_status as UserProfile["kycStatus"],
    twoFAEnabled: data.twofa_enabled ?? false,
    emailVerified: data.email_verified ?? false,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      const profile = await fetchProfile(s.user.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => loadSession(s));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      loadSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const register = async (data: RegisterData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
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
      await supabase.from("profiles").update({
        first_name: data.firstName,
        last_name: data.lastName,
        username: data.username,
        country: data.country,
      }).eq("id", authData.user.id);

      // Send branded verification email via Resend (non-blocking for UX)
      supabase.functions.invoke("send-verification-email", {
        body: {
          user_id: authData.user.id,
          email: data.email,
          first_name: data.firstName || data.username,
        },
      }).catch(() => {/* non-blocking — user will see resend option */});
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, isAdmin: user?.role === "admin",
      loading, login, logout, register, refreshProfile,
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
