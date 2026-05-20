import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Check, Gift, Send, Smartphone, Ticket, Loader2 } from "lucide-react";
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
      <SheetContent side="bottom" className="dark rounded-t-3xl px-5 pb-8 pt-5 max-h-[92vh] overflow-y-auto bg-background text-foreground">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Gift className="text-accent" size={22} /> Refer &amp; Earn
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Share your code. Both of you get a free match ticket.
          </p>
        </SheetHeader>

        {/* Code card — borderless, subtle accent tint with a top hairline */}
        <div className="mt-4 rounded-2xl bg-accent/5 border-t border-accent/20 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your Code</div>
          <div className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-foreground select-all">
            {loading ? "…" : code}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              onClick={copy}
              size="sm"
              className="font-bold border-2 border-accent bg-transparent text-accent hover:bg-accent/10"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              onClick={share}
              size="sm"
              className="font-bold bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Share2 size={16} /> Share
            </Button>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{count}</span> friends referred
          </div>
        </div>

        {/* How it works */}
        <div className="mt-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">How it works</div>
          <ol className="space-y-2.5" style={{ contentVisibility: "auto" }}>
            <Step n={1} icon={<Send size={16} />} text="Share your code with a friend" />
            <Step n={2} icon={<Smartphone size={16} />} text="They sign up and enter your code" />
            <Step n={3} icon={<Ticket size={16} />} text="You both get a free Bermuda Survival ticket" />
          </ol>
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

        <p className="mt-5 text-[11px] text-muted-foreground text-center">
          Tickets valid for Bermuda Survival BR matches only (Solo / Duo / Squad)
        </p>
      </SheetContent>
    </Sheet>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="text-sm">
        <span className="font-bold text-muted-foreground mr-1">{n}.</span>
        {text}
      </div>
    </li>
  );
}
