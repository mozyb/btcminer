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
  type: string;
  action?: string;
  user_id: string;
  user_email?: string;
  [key: string]: unknown;
}) {
  try {
    await supabase.functions.invoke("notify-user", { body: payload });
  } catch {
    // non-blocking
  }
}

// ─── Notify admin via Edge Function ────────────────────────────────────────
export async function notifyAdmin(payload: {
  type: string;
  user_id?: string;
  user_email?: string;
  [key: string]: unknown;
}) {
  try {
    await supabase.functions.invoke("notify-admin", { body: payload });
  } catch {
    // non-blocking — notification failure must not break user flow
  }
}

// ─── Contract Templates ───────────────────────────────────────────────────
export interface ContractTemplate {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  coin: string;
  algorithm: string;
  hashrate: number;
  hashrate_unit: string;
  mining_pool: string | null;
  mining_farm: string | null;
  hardware: string | null;
  duration: number;
  is_lifetime: boolean;
  estimated_daily_reward: number;
  estimated_monthly_reward: number;
  estimated_annual_reward: number;
  reward_method: string;
  maintenance_fee: number;
  electricity_fee: number;
  pool_fee: number;
  price: number;
  discount_price: number | null;
  promotional_price: number | null;
  currency: string;
  tax: number;
  min_purchase: number;
  max_purchase: number;
  estimated_btc_production: number;
  estimated_usd_value: number;
  network_difficulty_multiplier: number;
  pool_efficiency: number;
  hardware_efficiency: number;
  available_capacity: number;
  remaining_capacity: number;
  max_per_user: number;
  status: string;
  visibility: string;
  featured: boolean;
  badge: string | null;
  image_url: string | null;
  banner_url: string | null;
  seo_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  canonical_url: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getPublicContractTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("status", "active")
    .eq("visibility", "public")
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getContractTemplateBySlug(slug: string): Promise<ContractTemplate | null> {
  const { data, error } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createContractTemplate(payload: Omit<ContractTemplate, "id" | "created_at" | "updated_at">): Promise<ContractTemplate> {
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContractTemplate(id: string, payload: Partial<Omit<ContractTemplate, "id" | "created_at">>): Promise<void> {
  const { error } = await supabase
    .from("contract_templates")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteContractTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("contract_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateContractTemplate(id: string): Promise<ContractTemplate> {
  const { data: src, error: fetchErr } = await supabase
    .from("contract_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !src) throw fetchErr ?? new Error("Not found");
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = src;
  const newSlug = `${rest.slug}-copy-${Date.now()}`;
  const { data, error } = await supabase
    .from("contract_templates")
    .insert({ ...rest, name: `${rest.name} (Copy)`, display_name: `${rest.display_name} (Copy)`, slug: newSlug, status: "draft", updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Extended Payment Methods ─────────────────────────────────────────────
export interface PaymentMethodFull {
  id: string;
  currency: string;
  coin_symbol: string | null;
  direction: "deposit" | "withdrawal";
  mode: "manual" | "automatic";
  display_name: string;
  instructions: string | null;
  admin_address: string | null;
  network_tag: string | null;
  network: string | null;
  logo_url: string | null;
  description: string | null;
  memo_supported: boolean;
  memo_label: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_recommended: boolean;
  is_maintenance: boolean;
  sort_order: number;
  min_deposit: number;
  max_deposit: number | null;
  min_withdrawal: number;
  max_withdrawal: number | null;
  daily_limit: number | null;
  deposit_fee: number;
  withdrawal_fee: number;
  network_fee: number;
  required_confirmations: number;
  auto_deposit: boolean;
  auto_withdrawal: boolean;
  api_provider: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
  extra_addresses: { label: string; address: string }[];
  created_at: string;
  updated_at: string;
}

export async function getAllPaymentMethodsFull(): Promise<PaymentMethodFull[]> {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .order("direction")
    .order("sort_order");
  if (error) throw error;
  return Array.isArray(data) ? (data as PaymentMethodFull[]) : [];
}

export async function createPaymentMethodFull(payload: Omit<PaymentMethodFull, "id" | "created_at" | "updated_at">): Promise<PaymentMethodFull> {
  const { data, error } = await supabase
    .from("payment_methods")
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data as PaymentMethodFull;
}

export async function updatePaymentMethodFull(id: string, updates: Partial<Omit<PaymentMethodFull, "id" | "created_at">>): Promise<void> {
  const { error } = await supabase
    .from("payment_methods")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePaymentMethodRecord(id: string): Promise<void> {
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) throw error;
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
