import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  HOT_WALLET_PROVIDERS,
  COLD_WALLET_PROVIDERS,
  isValidBitcoinAddress,
  type WalletProvider,
} from "@/lib/walletConnect";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import {
  Wallet, Shield, ExternalLink, CheckCircle, Loader2,
  AlertCircle, ArrowRight, Bitcoin, Zap,
} from "lucide-react";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletConnectModal({ open, onOpenChange }: WalletConnectModalProps) {
  const { connectWallet, connecting } = useWalletConnect();
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider | null>(null);
  const [walletType, setWalletType] = useState<"hot" | "cold">("hot");
  const [manualAddress, setManualAddress] = useState("");
  const [label, setLabel] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");

  const providers = walletType === "hot" ? HOT_WALLET_PROVIDERS : COLD_WALLET_PROVIDERS;

  const reset = () => {
    setSelectedProvider(null);
    setManualAddress("");
    setLabel("");
    setStep("select");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleSelect = (provider: WalletProvider) => {
    setSelectedProvider(provider);
    setLabel("");
    setStep("confirm");
  };

  const handleConnect = async () => {
    if (!selectedProvider) return;

    try {
      await connectWallet(
        selectedProvider,
        walletType,
        label || undefined,
        selectedProvider === "manual" ? manualAddress : undefined
      );
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      toast.error(msg);
    }
  };

  const selectedInfo = providers.find(p => p.id === selectedProvider);
  const canConnect = selectedProvider && (selectedProvider !== "manual" || isValidBitcoinAddress(manualAddress));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="p-5 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-4 h-4 text-primary" />
              Connect External Wallet
            </DialogTitle>
          </DialogHeader>
        </div>

        {step === "select" ? (
          <div className="p-5 pt-3 space-y-4">
            <Tabs value={walletType} onValueChange={(v) => { setWalletType(v as "hot" | "cold"); setSelectedProvider(null); }}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="hot" className="text-xs gap-1">
                  <Zap className="w-3 h-3" /> Hot Wallet
                </TabsTrigger>
                <TabsTrigger value="cold" className="text-xs gap-1">
                  <Shield className="w-3 h-3" /> Cold Wallet
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hot" className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Connect a software wallet installed in your browser or device.
                </p>
                {HOT_WALLET_PROVIDERS.map((provider) => {
                  const detected = provider.detect();
                  return (
                    <button
                      key={provider.id}
                      onClick={() => detected && handleSelect(provider.id)}
                      disabled={!detected}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        detected
                          ? "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                          : "border-border/50 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <span className="text-xl">{provider.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{provider.name}</span>
                          {detected ? (
                            <Badge className="bg-success/10 text-success border-success/20 text-[10px] h-4 px-1.5">
                              <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Detected
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground text-[10px] h-4 px-1.5">
                              Not installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{provider.description}</p>
                      </div>
                      {!detected && (
                        <a
                          href={provider.installUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary shrink-0"
                          title="Install wallet"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {detected && <ArrowRight className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </TabsContent>

              <TabsContent value="cold" className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Connect a hardware or air-gapped wallet by entering its address.
                </p>
                {COLD_WALLET_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSelect(provider.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xl">{provider.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{provider.name}</span>
                      <p className="text-xs text-muted-foreground truncate">{provider.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                  </button>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-5 pt-3 space-y-4">
            <button
              onClick={() => setStep("select")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3 rotate-180" /> Back to wallet list
            </button>

            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedInfo?.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{selectedInfo?.name}</p>
                <Badge className={`text-[10px] h-4 px-1.5 mt-0.5 ${
                  walletType === "hot"
                    ? "bg-warning/10 text-warning border-warning/20"
                    : "bg-success/10 text-success border-success/20"
                }`}>
                  {walletType === "hot" ? "Hot Wallet" : "Cold Wallet"}
                </Badge>
              </div>
            </div>

            {/* Manual address input for cold wallets or manual mode */}
            {(walletType === "cold" || selectedProvider === "manual") && (
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1">
                  <Bitcoin className="w-3 h-3" /> Bitcoin Address
                </Label>
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="bc1... or 1... or 3..."
                  className="font-mono text-xs"
                />
                {manualAddress && !isValidBitcoinAddress(manualAddress) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Invalid Bitcoin address
                  </p>
                )}
                {manualAddress && isValidBitcoinAddress(manualAddress) && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Valid address
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. My Ledger, Savings Wallet"
                className="text-xs"
              />
            </div>

            <Button
              onClick={handleConnect}
              disabled={connecting || !canConnect}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> Connecting…
                </>
              ) : (
                <>Connect {selectedInfo?.name}</>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
