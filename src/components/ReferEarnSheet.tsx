import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Gift, Send, Smartphone, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchReferralStats,
  shareReferralCode,
  applyReferralCode,
  validateReferralCode,
} from "@/lib/stubs";
import { cn } from "@/lib/utils";

/**
 * Refer & Earn bottom sheet.
 *
 * - Shows the user's own referral code (copy + share).
 * - Lets them enter a friend's code if they haven't used one yet.
 * - All persistence is stubbed locally; replace with Supabase RPC when wired.
 */
export function ReferEarnSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [referredByName, setReferredByName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Apply-code form state
  const [input, setInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; msg: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    const s = await fetchReferralStats(currentUser?.phone);
    setCode(s.code);
    setCount(s.count);
    setReferredByName(s.referredByName);
    setLoading(false);
  };

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser?.phone]);

  // Live validation as user types (debounced lightly).
  useEffect(() => {
    if (!input.trim()) {
      setValidation(null);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      const v = await validateReferralCode(input, code);
      if (!alive) return;
      setValidation(v.ok ? { ok: true, msg: `Valid — ${v.nickname}'s code` } : { ok: false, msg: v.error ?? "Invalid" });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [input, code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const share = async () => {
    const r = await shareReferralCode(code);
    if (!r.shared) toast.success("Share message copied");
  };

  const apply = async () => {
    setApplying(true);
    const res = await applyReferralCode(currentUser?.phone, input);
    setApplying(false);
    if (!res.ok) {
      toast.error(res.error ?? "Couldn't apply code");
      return;
    }
    toast.success(`Free ticket added! Referred by ${res.nickname}`);
    setInput("");
    setValidation(null);
    refresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="dark rounded-t-3xl px-5 pb-8 pt-5 max-h-[92vh] overflow-y-auto bg-zinc-900/50 backdrop-blur-none text-foreground border-0"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Gift className="text-accent" size={22} /> Refer &amp; Earn
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Share your code. Both of you get a free match ticket.
          </p>
        </SheetHeader>

        {/* Code — borderless, centered */}
        <div className="mt-5 text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your Code</div>
          <div className="mt-1 font-mono text-3xl font-black tracking-tighter text-foreground select-all">
            {loading ? "…" : code}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={copy}
              size="sm"
              variant="outline"
              className="font-bold border border-accent bg-transparent text-accent hover:bg-accent/10"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              onClick={share}
              size="sm"
              className="font-bold bg-[#25D366] text-white hover:bg-[#25D366]/90"
            >
              <WhatsAppIcon /> WhatsApp
            </Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{count}</span> friends referred
          </div>
        </div>

        {/* How it works — compact horizontal row */}
        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">How it works</div>
          <div className="grid grid-cols-3 gap-2">
            <Step icon={<Send size={16} />} text="Share" />
            <Step icon={<Smartphone size={16} />} text="Signup" />
            <Step icon={<Ticket size={16} />} text="Free ticket" />
          </div>
        </div>

        {/* Apply / referred-by */}
        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Enter a friend's code
          </div>
          {referredByName ? (
            <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-2.5 text-sm">
              <Check size={14} className="inline mr-1 text-success" />
              Referred by <span className="font-bold">{referredByName}</span>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 16))}
                  placeholder="e.g. NOVA1234"
                  className="font-mono uppercase tracking-wider"
                />
                <Button
                  onClick={apply}
                  disabled={applying || !input.trim() || validation?.ok === false}
                  size="default"
                  className="font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {applying ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                </Button>
              </div>
              {validation && (
                <p className={cn(
                  "text-xs mt-1.5 font-medium",
                  validation.ok ? "text-success" : "text-destructive"
                )}>
                  {validation.ok ? <Check size={12} className="inline mr-1" /> : null}
                  {validation.msg}
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-5 text-xs text-muted-foreground text-center opacity-60">
          Tickets valid for Bermuda Survival BR matches only (Solo / Duo / Squad)
        </p>
      </SheetContent>
    </Sheet>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-1">
      <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
        {icon}
      </div>
      <div className="text-[11px] font-semibold text-muted-foreground">{text}</div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.891-11.893 11.891a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414z"/>
    </svg>
  );
}
