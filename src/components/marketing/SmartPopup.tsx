/**
 * SmartPopup — premium conversion-optimized welcome offer popup.
 * Triggers: time on page, scroll depth, exit intent, multi-page visits.
 */
import React, { useEffect, useRef, useState } from "react";
import { X, Zap, ShieldCheck, Lock, TrendingUp, Check, Gift, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/db/supabase";
import { toast } from "sonner";

interface PopupVariant {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  cta_url: string;
  discount_pct: number;
  is_control?: boolean;
}

interface PopupConfig {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  button_text: string;
  cta_url: string;
  background_image: string | null;
  banner_image: string | null;
  display_frequency: string;
  cooldown_hours: number;
  trigger_delay_seconds: number;
  trigger_scroll_pct: number;
  trigger_exit_intent: boolean;
  trigger_multi_page: boolean;
  multi_page_threshold: number;
  variant_name: string;
  variants: PopupVariant[];
}

const STORAGE_KEY = "btcminer_welcome_popup";
const PAGE_COUNT_KEY = "btcminer_page_count";

function getStoredData(): { dismissedAt?: number; capturedEmail?: string; capturedVariant?: string; registered?: boolean } {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}
function setStoredData(data: Partial<{ dismissedAt: number; capturedEmail: string; capturedVariant: string; registered: boolean }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...getStoredData(), ...data }));
}

function selectVariant(cfg: PopupConfig): PopupVariant {
  const list = Array.isArray(cfg.variants) && cfg.variants.length ? cfg.variants : [];
  if (cfg.variant_name) {
    const found = list.find(v => v.name === cfg.variant_name);
    if (found) return found;
  }
  if (list.length) {
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }
  return {
    name: "control",
    title: cfg.title,
    subtitle: cfg.subtitle || "",
    description: cfg.description || "",
    button_text: cfg.button_text,
    cta_url: cfg.cta_url,
    discount_pct: 10,
  };
}

export default function SmartPopup({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [variant, setVariant] = useState<PopupVariant | null>(null);
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const triggered = useRef(false);

  // ── Load popup config ─────────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn) return;
    const stored = getStoredData();
    if (stored.registered) return;
    supabase.functions.invoke("popup-config").then(({ data, error }) => {
      if (error) return;
      const cfg = data?.config as PopupConfig | null;
      if (cfg) {
        setConfig(cfg);
        setVariant(selectVariant(cfg));
      }
    });
    const count = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) ?? "0") + 1;
    sessionStorage.setItem(PAGE_COUNT_KEY, String(count));
  }, [isLoggedIn]);

  // ── Check if popup should be suppressed ──────────────────────────────
  const shouldShow = (cfg: PopupConfig): boolean => {
    if (isLoggedIn) return false;
    const stored = getStoredData();
    if (stored.capturedEmail || stored.registered) return false;
    if (stored.dismissedAt) {
      const hoursAgo = (Date.now() - stored.dismissedAt) / 36e5;
      if (hoursAgo < cfg.cooldown_hours) return false;
    }
    return true;
  };

  const showPopup = (cfg: PopupConfig) => {
    if (triggered.current) return;
    if (!shouldShow(cfg)) return;
    triggered.current = true;
    const selected = selectVariant(cfg);
    setVariant(selected);
    setVisible(true);
    void supabase.from("popup_events").insert({ popup_id: cfg.id, event_type: "impression", variant: selected.name });
  };

  // ── Set up triggers once config is loaded ────────────────────────────
  useEffect(() => {
    if (!config || isLoggedIn) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    // 1. Time-based trigger
    const delay = (config.trigger_delay_seconds ?? 25) * 1000;
    timeoutId = setTimeout(() => showPopup(config), delay);

    // 2. Scroll-based trigger
    const scrollPct = config.trigger_scroll_pct ?? 60;
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrolled = (window.scrollY / docHeight) * 100;
      if (scrolled >= scrollPct) showPopup(config);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 3. Exit intent (desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (config.trigger_exit_intent && e.clientY <= 0) showPopup(config);
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    // 4. Multi-page visit trigger
    if (config.trigger_multi_page) {
      const pageCount = parseInt(sessionStorage.getItem(PAGE_COUNT_KEY) ?? "0");
      if (pageCount >= (config.multi_page_threshold ?? 2)) {
        setTimeout(() => showPopup(config), 2000);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, isLoggedIn]);

  const handleDismiss = () => {
    setVisible(false);
    setStoredData({ dismissedAt: Date.now() });
    if (config) void supabase.from("popup_events").insert({ popup_id: config.id, event_type: "dismiss", variant: variant?.name });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !consent) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("marketing-automation", {
        body: {
          action: "capture_lead",
          email: email.trim().toLowerCase(),
          first_name: firstName.trim() || undefined,
          source: "popup",
          marketing_consent: consent,
          variant: variant?.name,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      setShowSuccess(true);
      setStoredData({ capturedEmail: email, capturedVariant: variant?.name || "control" });
      if (config) void supabase.from("popup_events").insert({ popup_id: config.id, event_type: "email_captured", email, variant: variant?.name });
      toast.success("You're in! Your welcome discount is waiting.");
      // Redirect to registration with email and name pre-filled
      setTimeout(() => {
        const params = new URLSearchParams();
        params.set("email", email.trim().toLowerCase());
        if (firstName.trim()) params.set("first_name", firstName.trim());
        params.set("welcome", "1");
        const ctaUrl = variant?.cta_url || config?.cta_url || "/register?welcome=1";
        const separator = ctaUrl.includes("?") ? "&" : "?";
        window.location.href = `${ctaUrl}${separator}${params.toString()}`;
      }, 1800);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible || !config) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) handleDismiss(); }}
      aria-modal="true"
      role="dialog"
      aria-label="Exclusive welcome offer"
    >
      <div
        className="relative w-full max-w-[520px] rounded-2xl overflow-hidden shadow-[0_24px_80px_-16px_rgba(0,0,0,0.5)] border border-border/60 animate-in zoom-in-95 duration-300"
        style={{
          background: config.background_image
            ? `linear-gradient(rgba(10,10,18,0.82),rgba(10,10,18,0.95)), url(${config.background_image}) center/cover`
            : "hsl(var(--card))",
        }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-white/10"
          aria-label="Close offer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Banner image */}
        {config.banner_image && (
          <div className="w-full h-40 overflow-hidden relative">
            <img src={config.banner_image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
          </div>
        )}

        <div className="relative p-6 md:p-8">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/20">
              <Gift className="w-3.5 h-3.5" />
              NEW MEMBER OFFER
            </span>
          </div>

          {/* Icon + header */}
          {!config.banner_image && (
            <div className="w-14 h-14 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center mb-5 border border-primary/30 shadow-lg shadow-primary/10">
              <Zap className="w-7 h-7 text-primary" />
            </div>
          )}

          <h2 className="text-2xl md:text-[28px] font-extrabold text-foreground leading-tight mb-2">
            {variant?.title || config.title}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-5 text-pretty">
            {variant?.description || config.description || "Create your free account today, verify your email, and automatically unlock your welcome discount on your first eligible mining contract."}
          </p>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              { icon: ShieldCheck, text: "Secure Registration" },
              { icon: Check, text: "Email Verification Required" },
              { icon: Lock, text: "No Hidden Fees" },
              { icon: Check, text: "No Spam Ever" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: Zap, label: "Start Mining Faster", sub: "Instant hashrate" },
              { icon: Lock, label: "Secure Crypto Platform", sub: "Enterprise-grade" },
              { icon: TrendingUp, label: "Real-Time Analytics", sub: "Live earnings" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/40 border border-border/50">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">{sub}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 mb-6 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-card bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center text-[9px] font-bold text-foreground"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Trusted by miners worldwide.</span> Transparent mining infrastructure with enterprise-grade security.
            </p>
          </div>

          {showSuccess ? (
            <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">Welcome Bonus Unlocked!</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Redirecting you to complete your free account…</p>
              <div className="flex justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Your first name (optional)"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="h-11 bg-background/80 border-border/70 focus:border-primary"
                autoComplete="given-name"
              />
              <Input
                type="email"
                placeholder="Your email address *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11 bg-background/80 border-border/70 focus:border-primary"
                autoComplete="email"
              />

              <div className="flex items-start gap-2.5 py-1">
                <Checkbox
                  id="marketing-consent"
                  checked={consent}
                  onCheckedChange={v => setConsent(v === true)}
                  className="mt-0.5 border-border/80"
                />
                <label htmlFor="marketing-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to receive marketing emails about BTCMiner products, offers, and mining updates. I can unsubscribe anytime. Privacy protected.
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={submitting || !email.trim() || !consent}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Unlocking…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {variant?.button_text || config.button_text || "Unlock My 10% Discount"}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground leading-relaxed">
                No spam. Unsubscribe from marketing emails anytime. Transactional emails will still be sent when required.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
