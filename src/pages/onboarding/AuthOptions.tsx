import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone as PhoneIcon, Mail, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAuthWithGoogle } from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { LangCode } from "@/lib/config";

/**
 * Auth options screen — three large cards (Phone / Email / Google).
 * All three flows funnel into the same /setup-profile screen on success.
 *
 * Phone & Email open dedicated screens (existing /phone, new /email).
 * Google is a one-tap stub — it sets a placeholder user and skips OTP.
 */
export default function AuthOptions() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { lang?: LangCode } };
  const { setUser } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGoogle = async () => {
    setLoadingGoogle(true);
    try {
      const res = await createAuthWithGoogle();
      if (!res.ok) throw new Error("Google sign-in failed");
      // Pre-seed user from Google profile so SetupProfile can prefill.
      setUser({
        phone: "",
        displayName: res.displayName ?? "",
        nickname: "",
        language: state?.lang ?? "en",
      });
      nav("/setup-profile", { state: { lang: state?.lang } });
    } catch (e) {
      toast.error("Couldn't sign in with Google");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom bg-background overflow-y-auto">
      <button onClick={() => nav(-1)} className="press -ml-2 h-10 w-10 flex items-center justify-center text-muted-foreground shrink-0">
        <ArrowLeft size={22} />
      </button>

      <div className="pt-2 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
          How do you want to sign in?
        </h1>
        <p className="text-muted-foreground mt-2">Pick the option that's easiest for you</p>
      </div>

      <div className="mt-7 space-y-3 shrink-0">
        <AuthCard
          icon={<PhoneIcon size={22} />}
          iconClass="bg-primary/15 text-primary"
          title="Continue with Phone"
          sub="We'll send an OTP to your number"
          onClick={() => nav("/phone", { state: { lang: state?.lang } })}
        />
        <AuthCard
          icon={<Mail size={22} />}
          iconClass="bg-accent/15 text-accent"
          title="Continue with Email"
          sub="OTP sent to your inbox"
          onClick={() => nav("/email", { state: { lang: state?.lang } })}
        />
        <AuthCard
          icon={
            loadingGoogle
              ? <Loader2 size={22} className="animate-spin" />
              : <GoogleGlyph />
          }
          iconClass="bg-secondary text-foreground"
          title="Continue with Google"
          sub="One-tap sign in"
          onClick={handleGoogle}
          disabled={loadingGoogle}
        />
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-auto pt-8">
        By continuing you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
}

function AuthCard({
  icon, iconClass, title, sub, onClick, disabled,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "press w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card text-left",
        "active:border-primary disabled:opacity-60"
      )}
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", iconClass)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>
      </div>
      <ChevronRight size={18} className="text-muted-foreground shrink-0" />
    </button>
  );
}

/** Inline Google "G" glyph — avoids a logo dep. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.7-5.4 3.7-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.5 2.2 2 6.7 2 12.2s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.8H12z"/>
    </svg>
  );
}
