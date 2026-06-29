import { supabase } from "@/db/supabase";

// ─── Profiles ──────────────────────────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: {
  first_name?: string;
  last_name?: string;
  username?: string;
  country?: string;
}) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

// ─── Platform Wallets (internal balances) ──────────────────────────────────
export interface Wallet {
  id: string;
  currency: string;
  symbol: string;
  balance: number;
  address: string;
}

export async function getWallets(userId: string): Promise<Wallet[]> {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, currency, symbol, balance, address")
    .eq("user_id", userId)
    .order("currency");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ─── External User Wallets (hot/cold connected wallets) ────────────────────
export interface UserExternalWallet {
  id: string;
  user_id: string;
  wallet_type: "hot" | "cold";
  provider: string;
  address: string;
  label: string | null;
  is_primary: boolean;
  network: string;
  created_at: string;
}

export async function getUserExternalWallets(userId: string): Promise<UserExternalWallet[]> {
  const { data, error } = await supabase
    .from("user_wallets")
    .select("*")
    .eq("user_id", userId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function deleteUserExternalWallet(walletId: string, userId: string) {
  const { error } = await supabase
    .from("user_wallets")
    .delete()
    .eq("id", walletId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setPrimaryExternalWallet(walletId: string, userId: string) {
  const { error } = await supabase
    .from("user_wallets")
    .update({ is_primary: true })
    .eq("id", walletId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ─── Contracts ─────────────────────────────────────────────────────────────
export interface Contract {
  id: string;
  contract_name: string;
  algorithm: string;
  coin: string;
  hashrate: number;
  hashrate_unit: string;
  pool_allocation: string | null;
  hardware: string | null;
  status: string;
  start_date: string;
  expiry_date: string;
  rewards_generated: number;
  maintenance_paid: number;
  price_paid: number;
  created_at: string;
}

export async function getContracts(userId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ─── Transactions ──────────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  usd_value: number;
  status: string;
  hash: string | null;
  note: string | null;
  created_at: string;
}

export async function getTransactions(
  userId: string,
  page = 0,
  pageSize = 20
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, currency, usd_value, status, hash, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

// ─── Notifications ─────────────────────────────────────────────────────────
export interface DBNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export async function getNotifications(userId: string): Promise<DBNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

// ─── Affiliate ─────────────────────────────────────────────────────────────
export interface AffiliateLink {
  id: string;
  referral_code: string;
  referral_count: number;
  total_commissions: number;
}

export async function getAffiliateLink(userId: string): Promise<AffiliateLink | null> {
  const { data, error } = await supabase
    .from("affiliate_links")
    .select("id, referral_code, referral_count, total_commissions")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── Payment Methods ───────────────────────────────────────────────────────
export interface PaymentMethod {
  id: string;
  currency: string;
  direction: "deposit" | "withdrawal";
  mode: "manual" | "automatic";
  display_name: string;
  instructions: string | null;
  admin_address: string | null;
  network_tag: string | null;
  is_active: boolean;
  sort_order: number;
}

export async function getPaymentMethods(direction: "deposit" | "withdrawal"): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("direction", direction)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("direction")
    .order("sort_order");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function updatePaymentMethod(id: string, updates: Partial<Pick<PaymentMethod, "mode" | "instructions" | "admin_address" | "is_active" | "display_name" | "network_tag">>) {
  const { error } = await supabase
    .from("payment_methods")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Manual Transaction submission ─────────────────────────────────────────
export async function submitManualTransaction(params: {
  user_id: string;
  type: "deposit" | "withdrawal";
  currency: string;
  amount: number;
  usd_value: number;
  payment_method_id: string;
  destination_address?: string;
  note?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: params.user_id,
      type: params.type,
      currency: params.currency,
      amount: params.amount,
      usd_value: params.usd_value,
      status: "pending",
      payment_method_id: params.payment_method_id,
      destination_address: params.destination_address ?? null,
      note: params.note ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getPendingTransactions(): Promise<(Transaction & { user_email?: string; destination_address?: string | null })[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, currency, usd_value, status, hash, note, created_at, destination_address, user_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function approveDeposit(id: string) {
  const { error } = await supabase.rpc("approve_deposit", { tx_id: id });
  if (error) throw error;
}

export async function approveWithdrawal(id: string) {
  const { error } = await supabase.rpc("approve_withdrawal", { tx_id: id });
  if (error) throw error;
}

export async function approveTransaction(id: string, type: "deposit" | "withdrawal" = "deposit") {
  if (type === "withdrawal") return approveWithdrawal(id);
  return approveDeposit(id);
}

export async function rejectTransaction(id: string) {
  const { error } = await supabase.rpc("reject_transaction", { tx_id: id });
  if (error) throw error;
}

export async function notifyUser(payload: {
  type: "deposit" | "withdrawal";
  action: "approved" | "rejected";
  user_id: string;
  user_email: string;
  currency: string;
  amount: number;
  usd_value?: number;
  transaction_id: string;
  destination_address?: string;
}) {
  try {
    await supabase.functions.invoke("notify-user", { body: payload });
  } catch {
    // non-blocking
  }
}

// ─── Notify admin via Edge Function ────────────────────────────────────────
export async function notifyAdmin(payload: {
  type: "deposit" | "withdrawal";
  user_id: string;
  user_email: string;
  currency: string;
  amount: number;
  usd_value?: number;
  transaction_id: string;
  destination_address?: string;
}) {
  try {
    await supabase.functions.invoke("notify-admin", { body: payload });
  } catch {
    // non-blocking — notification failure must not break user flow
  }
}

// ─── Support Tickets ───────────────────────────────────────────────────────
export async function createSupportTicket(userId: string, ticket: {
  subject: string;
  message: string;
  category: string;
  priority: string;
}) {
  const { error } = await supabase
    .from("support_tickets")
    .insert({ user_id: userId, ...ticket });
  if (error) throw error;
}

export async function getSupportTickets(userId: string) {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
