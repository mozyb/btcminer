// ─── Wallet Connection Utilities ──────────────────────────────────────────

export type WalletProvider =
  | "unisat"
  | "xverse"
  | "leather"
  | "okx"
  | "phantom"
  | "ledger"
  | "trezor"
  | "manual";

export interface WalletProviderInfo {
  id: WalletProvider;
  name: string;
  type: "hot" | "cold";
  icon: string;
  description: string;
  detect: () => boolean;
  installUrl: string;
}

// Bitcoin address validation patterns
const ADDRESS_PATTERNS = {
  legacy: /^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  p2sh: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
  bech32: /^(bc1)[a-zA-HJ-NP-Z0-9]{39,59}$/,
  taproot: /^bc1p[a-zA-HJ-NP-Z0-9]{58}$/,
};

export function isValidBitcoinAddress(addr: string): boolean {
  return (
    ADDRESS_PATTERNS.legacy.test(addr) ||
    ADDRESS_PATTERNS.p2sh.test(addr) ||
    ADDRESS_PATTERNS.bech32.test(addr) ||
    ADDRESS_PATTERNS.taproot.test(addr)
  );
}

export function getAddressType(addr: string): string {
  if (ADDRESS_PATTERNS.legacy.test(addr)) return "Legacy (P2PKH)";
  if (ADDRESS_PATTERNS.p2sh.test(addr)) return "SegWit (P2SH)";
  if (ADDRESS_PATTERNS.taproot.test(addr)) return "Taproot (P2TR)";
  if (ADDRESS_PATTERNS.bech32.test(addr)) return "Native SegWit (Bech32)";
  return "Unknown";
}

// Detect browser extension wallets
export function detectUnisat(): boolean {
  return typeof window !== "undefined" && "unisat" in window;
}

export function detectXverse(): boolean {
  return typeof window !== "undefined" && "XverseProviders" in window;
}

export function detectLeather(): boolean {
  return typeof window !== "undefined" && "LeatherProvider" in window;
}

export function detectOKX(): boolean {
  return typeof window !== "undefined" && "okxwallet" in window;
}

export function detectPhantom(): boolean {
  return typeof window !== "undefined" && "phantom" in window;
}

// Hot wallet providers
export const HOT_WALLET_PROVIDERS: WalletProviderInfo[] = [
  {
    id: "unisat",
    name: "UniSat Wallet",
    type: "hot",
    icon: "🔶",
    description: "Popular Bitcoin wallet with Ordinals support",
    detect: detectUnisat,
    installUrl: "https://unisat.io/download",
  },
  {
    id: "xverse",
    name: "Xverse",
    type: "hot",
    icon: "🔷",
    description: "Bitcoin & Stacks wallet with NFT support",
    detect: detectXverse,
    installUrl: "https://www.xverse.app/",
  },
  {
    id: "leather",
    name: "Leather",
    type: "hot",
    icon: "🟤",
    description: "Secure Bitcoin & Stacks wallet (formerly Hiro)",
    detect: detectLeather,
    installUrl: "https://leather.io/",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    type: "hot",
    icon: "⬛",
    description: "Multi-chain wallet with Bitcoin support",
    detect: detectOKX,
    installUrl: "https://www.okx.com/web3",
  },
  {
    id: "phantom",
    name: "Phantom",
    type: "hot",
    icon: "👻",
    description: "Multi-chain wallet with Bitcoin support",
    detect: detectPhantom,
    installUrl: "https://phantom.app/",
  },
];

// Cold/hardware wallet providers
export const COLD_WALLET_PROVIDERS: WalletProviderInfo[] = [
  {
    id: "ledger",
    name: "Ledger",
    type: "cold",
    icon: "🔒",
    description: "Hardware wallet with USB/NFC connection",
    detect: () => false,
    installUrl: "https://www.ledger.com/",
  },
  {
    id: "trezor",
    name: "Trezor",
    type: "cold",
    icon: "🛡️",
    description: "Open-source hardware wallet",
    detect: () => false,
    installUrl: "https://trezor.io/",
  },
  {
    id: "manual",
    name: "Manual Address",
    type: "cold",
    icon: "📝",
    description: "Enter any Bitcoin address manually",
    detect: () => true,
    installUrl: "",
  },
];

// Connect to browser extension wallet
export async function connectExtensionWallet(provider: WalletProvider): Promise<string> {
  if (provider === "unisat") {
    const unisat = (window as unknown as Record<string, unknown>).unisat as {
      requestAccounts: () => Promise<string[]>;
    } | undefined;
    if (!unisat) throw new Error("UniSat wallet not found");
    const accounts = await unisat.requestAccounts();
    if (!accounts.length) throw new Error("No accounts returned from UniSat");
    return accounts[0];
  }

  if (provider === "xverse") {
    const XverseProviders = (window as unknown as Record<string, unknown>).XverseProviders as {
      BitcoinProvider?: { request: (method: string) => Promise<string[]> };
    } | undefined;
    const provider_ = XverseProviders?.BitcoinProvider;
    if (!provider_) throw new Error("Xverse wallet not found");
    const accounts = await provider_.request("getAccounts");
    if (!accounts.length) throw new Error("No accounts returned from Xverse");
    return accounts[0];
  }

  if (provider === "leather") {
    const leather = (window as unknown as Record<string, unknown>).LeatherProvider as {
      request: (method: string) => Promise<{ result: string[] }>;
    } | undefined;
    if (!leather) throw new Error("Leather wallet not found");
    const resp = await leather.request("getAddresses");
    if (!resp.result.length) throw new Error("No accounts returned from Leather");
    return resp.result[0];
  }

  if (provider === "okx") {
    const okx = (window as unknown as Record<string, unknown>).okxwallet as {
      bitcoin?: { requestAccounts: () => Promise<string[]> };
    } | undefined;
    const btc = okx?.bitcoin;
    if (!btc) throw new Error("OKX Bitcoin provider not found");
    const accounts = await btc.requestAccounts();
    if (!accounts.length) throw new Error("No accounts returned from OKX");
    return accounts[0];
  }

  if (provider === "phantom") {
    const phantom = (window as unknown as Record<string, unknown>).phantom as {
      bitcoin?: { request: (args: { method: string }) => Promise<{ address: string }> };
    } | undefined;
    const btc = phantom?.bitcoin;
    if (!btc) throw new Error("Phantom Bitcoin provider not found");
    const resp = await btc.request({ method: "requestAccounts" });
    if (!resp.address) throw new Error("No account returned from Phantom");
    return resp.address;
  }

  throw new Error(`Extension wallet not supported: ${provider}`);
}
