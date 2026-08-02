import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  connectExtensionWallet,
  isValidBitcoinAddress,
  getAddressType,
  type WalletProvider,
} from "@/lib/walletConnect";

export interface UserWallet {
  id: string;
  user_id: string;
  wallet_type: "hot" | "cold";
  provider: WalletProvider;
  address: string;
  label: string | null;
  is_primary: boolean;
  network: string;
  created_at: string;
}

export function useWalletConnect() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchWallets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWallets(data ?? []);
    } catch (err) {
      toast.error("Failed to load connected wallets");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const connectWallet = useCallback(
    async (provider: WalletProvider, walletType: "hot" | "cold", label?: string, manualAddress?: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      setConnecting(true);
      try {
        let address: string;

        if (walletType === "cold" || provider === "manual") {
          if (!manualAddress || !isValidBitcoinAddress(manualAddress)) {
            throw new Error("Invalid Bitcoin address");
          }
          address = manualAddress;
        } else {
          address = await connectExtensionWallet(provider);
        }

        const { error } = await supabase.from("user_wallets").insert({
          user_id: user.id,
          wallet_type: walletType,
          provider: provider,
          address: address,
          label: label || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Wallet`,
          is_primary: wallets.length === 0,
          network: "bitcoin",
        });

        if (error) {
          if (error.message?.includes("duplicate")) {
            throw new Error("This wallet address is already connected to your account");
          }
          throw error;
        }

        await fetchWallets();
        toast.success(`Connected ${address.slice(0, 6)}...${address.slice(-4)}`);
        return address;
      } finally {
        setConnecting(false);
      }
    },
    [user?.id, wallets.length, fetchWallets]
  );

  const disconnectWallet = useCallback(
    async (walletId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_wallets")
        .delete()
        .eq("id", walletId)
        .eq("user_id", user.id);
      if (error) throw error;
      await fetchWallets();
      toast.success("Wallet disconnected");
    },
    [user?.id, fetchWallets]
  );

  const setPrimary = useCallback(
    async (walletId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_wallets")
        .update({ is_primary: true })
        .eq("id", walletId)
        .eq("user_id", user.id);
      if (error) throw error;
      await fetchWallets();
      toast.success("Primary wallet updated");
    },
    [user?.id, fetchWallets]
  );

  const primaryWallet = wallets.find(w => w.is_primary) ?? wallets[0] ?? null;

  return {
    wallets,
    primaryWallet,
    loading,
    connecting,
    fetchWallets,
    connectWallet,
    disconnectWallet,
    setPrimary,
    isValidBitcoinAddress,
    getAddressType,
  };
}
