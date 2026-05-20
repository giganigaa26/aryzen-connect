import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createAuthWithEmail } from "@/lib/stubs";
import { toast } from "sonner";
import type { LangCode } from "@/lib/config";

/**
 * Email entry screen — collects an address, sends OTP via stub, then routes
 * to /otp with a `via=email` flag so the OTP screen can show the right copy.
 */
export default function Email() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { lang?: LangCode } };
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const send = async () => {
    setLoading(true);
    try {
      const res = await createAuthWithEmail(email);
      if (!res.ok) throw new Error("Failed");
      nav("/otp", { state: { email, lang: state?.lang, via: "email" } });
    } catch {
      toast.error("Couldn't send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom bg-background overflow-y-auto">
      <button onClick={() => nav(-1)} className="press -ml-2 h-10 w-10 flex items-center justify-center text-muted-foreground shrink-0">
        <ArrowLeft size={22} />
      </button>
      <div className="pt-2 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">Enter your email</h1>
        <p className="text-muted-foreground mt-2">We'll send a verification code to your inbox</p>
      </div>

      <div className="mt-8 shrink-0">
        <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.trim())}
          placeholder="you@example.com"
          className="mt-2 w-full px-4 py-3 rounded-button border-2 border-border bg-card focus:border-primary outline-none transition-colors text-base font-medium placeholder:text-muted-foreground/60"
          autoFocus
        />
      </div>

      <div className="mt-auto pt-8 shrink-0">
        <Button size="xl" disabled={!valid || loading} onClick={send}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : "Send OTP"}
        </Button>
      </div>
    </div>
  );
}
