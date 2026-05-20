import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Info, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { applyReferralCode, saveGameUID, validateReferralCode } from "@/lib/stubs";
import { cn } from "@/lib/utils";
import type { LangCode } from "@/lib/config";

/**
 * Final onboarding step — high-end esports registration vibe.
 *
 * Game UID is OPTIONAL: different games (BGMI, CODM, Stumble) use different
 * UIDs, so we don't force one at signup. Users can fill it later from Profile.
 */
export default function SetupProfile() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { phone?: string; email?: string; lang?: LangCode } };
  const { setUser, setOnboarded, currentUser } = useAuth();
  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [nick, setNick] = useState("");
  const [uid, setUid]   = useState("");
  const [refCode, setRefCode] = useState("");
  const [refState, setRefState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uidHelpOpen, setUidHelpOpen] = useState(false);
  const uidHelpRef = useRef<HTMLDivElement>(null);

  const valid =
    name.trim().length >= 2 &&
    nick.trim().length >= 2 &&
    (uid.length === 0 || (uid.length >= 9 && uid.length <= 10)) &&
    (refCode.length === 0 || refState?.ok === true);

  // Live validation for referral code (debounced).
  useEffect(() => {
    if (!refCode.trim()) {
      setRefState(null);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      const v = await validateReferralCode(refCode, null);
      if (!alive) return;
      setRefState(v.ok ? { ok: true, msg: `Valid — ${v.nickname}'s code` } : { ok: false, msg: v.error ?? "Invalid" });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [refCode]);

  // Dismiss the UID tooltip when tapping outside.
  useEffect(() => {
    if (!uidHelpOpen) return;
    const handler = (e: Event) => {
      if (uidHelpRef.current && !uidHelpRef.current.contains(e.target as Node)) {
        setUidHelpOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [uidHelpOpen]);

  const finish = async () => {
    setSaving(true);
    try {
      if (uid) await saveGameUID(uid);
      setUser({
        phone: state?.phone ?? "",
        displayName: name.trim(),
        nickname: nick.trim(),
        gameUid: uid || undefined,
        language: state?.lang ?? "en",
      });
      // TODO(supabase): replace with `apply_referral_code` RPC.
      if (refCode.trim()) {
        await applyReferralCode(state?.phone ?? "", refCode.trim());
      }
      setOnboarded(true);
      nav("/app", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom bg-background overflow-y-auto">
      <div className="pt-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          Set up your profile
        </h1>
        <p className="text-muted-foreground mt-2">Tell us how you want to be known on Aryzen</p>
      </div>

      {/* ─── Primary Identity ─────────────────────────────────────────── */}
      <section className="mt-7 shrink-0">
        <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Primary Identity
        </h2>
        <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-4">
          <Field
            label="Full name"
            placeholder="e.g. Aman Kumar"
            value={name}
            onChange={setName}
            enterKeyHint="next"
            autoComplete="name"
          />
          <Field
            label="In-game name"
            placeholder="e.g. ShadowOps"
            value={nick}
            onChange={setNick}
            maxLength={16}
            enterKeyHint="next"
            autoComplete="username"
          />
        </div>
      </section>

      {/* ─── Secondary (optional) fields ──────────────────────────────── */}
      <div className="mt-5 space-y-4 shrink-0">
        {/* Game UID with info tooltip */}
        <div>
          <div className="flex items-center gap-1.5 relative" ref={uidHelpRef}>
            <label
              className="font-semibold text-foreground"
              style={{ opacity: 0.7, fontSize: "0.85rem" }}
            >
              Game UID (optional)
            </label>
            <button
              type="button"
              aria-label="What is a Game UID?"
              onClick={() => setUidHelpOpen((v) => !v)}
              className="p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
            >
              <Info size={14} />
            </button>
            {uidHelpOpen && (
              <div
                role="tooltip"
                className="absolute left-0 top-full mt-1.5 z-10 px-3 py-2 rounded-lg bg-foreground text-background text-xs font-medium shadow-lg max-w-[240px] animate-in fade-in-0 zoom-in-95"
              >
                Enter your Free Fire Game UID.
              </div>
            )}
          </div>
          <input
            value={uid}
            onChange={(e) => setUid(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="e.g. 1234567890"
            inputMode="numeric"
            enterKeyHint="next"
            maxLength={10}
            autoComplete="off"
            className="mt-2 w-full px-4 py-3 rounded-button border-2 border-border bg-card focus:border-accent outline-none transition-colors text-base font-medium placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Referral code */}
        <div>
          <label
            className="font-semibold text-foreground"
            style={{ opacity: 0.7, fontSize: "0.85rem" }}
          >
            Referral code (optional)
          </label>
          <div className="relative mt-2">
            <input
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 16))}
              placeholder="e.g. NOVA1234"
              enterKeyHint="done"
              autoComplete="off"
              className={cn(
                "w-full px-4 py-3 pr-10 rounded-button border-2 bg-card outline-none transition-colors text-base font-mono tracking-wider uppercase placeholder:text-muted-foreground/60 placeholder:font-sans placeholder:tracking-normal",
                refState?.ok === true ? "border-success" :
                refState?.ok === false ? "border-destructive" :
                "border-border focus:border-accent",
              )}
            />
            {refState?.ok === true && (
              <Check size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-success" />
            )}
            {refState?.ok === false && (
              <X size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-destructive" />
            )}
          </div>
          {refState && (
            <p className={cn(
              "text-xs mt-1.5 font-medium",
              refState.ok ? "text-success" : "text-destructive",
            )}>
              {refState.msg}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 shrink-0">
        <Button
          size="xl"
          disabled={!valid || saving}
          onClick={finish}
          className="bg-accent text-white uppercase tracking-wider font-bold hover:bg-accent/90"
        >
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : "Enter Arena"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label, placeholder, value, onChange, maxLength, inputMode, enterKeyHint, autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  inputMode?: "text" | "numeric";
  enterKeyHint?: "next" | "done" | "go" | "search" | "send" | "enter" | "previous";
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        autoComplete={autoComplete}
        className="mt-2 w-full px-4 py-3 rounded-button border-2 border-border bg-card focus:border-accent outline-none transition-colors text-base font-medium placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
