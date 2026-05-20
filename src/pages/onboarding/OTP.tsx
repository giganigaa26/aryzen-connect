import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { verifyOTP } from "@/lib/stubs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LangCode } from "@/lib/config";

/**
 * Verify OTP — works for both phone and email flows.
 *
 * Source identifier comes from router state:
 *   - { phone, lang } → phone flow
 *   - { email, lang, via: "email" } → email flow
 */
export default function OTP() {
  const nav = useNavigate();
  const { state } = useLocation() as {
    state?: { phone?: string; email?: string; lang?: LangCode; via?: "phone" | "email" };
  };
  const phone = state?.phone ?? "";
  const email = state?.email ?? "";
  const isEmail = state?.via === "email" || !!email;

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(30);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const code = digits.join("");
  const valid = code.length === 6;

  const setDigit = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev]; next[i] = ch; return next;
    });
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await verifyOTP(phone || email, code);
      if (res.ok) {
        nav("/setup-profile", { state: { phone, email, lang: state?.lang } });
      } else {
        toast.error("Invalid OTP");
      }
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
        <h1 className="text-3xl font-extrabold tracking-tight">Verify OTP</h1>
        <p className="text-muted-foreground mt-2">
          Sent to{" "}
          <span className="font-semibold text-foreground">
            {isEmail ? email : `+91 ${phone}`}
          </span>
        </p>
      </div>

      <div className="mt-8 shrink-0">
        <div className="grid grid-cols-6 gap-2">
          {digits.map((d, i) => (
            <motion.input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              animate={d ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn(
                "h-14 text-center text-xl font-bold rounded-button border-2 bg-card outline-none transition-colors will-change-transform",
                d ? "border-primary" : "border-border",
                "focus:border-primary"
              )}
            />
          ))}
        </div>
        <div className="mt-6 text-center text-sm">
          {seconds > 0 ? (
            <span className="text-muted-foreground">Resend OTP in <span className="font-semibold text-foreground">{seconds}s</span></span>
          ) : (
            <button
              onClick={() => { setSeconds(30); toast.success("OTP resent"); }}
              className="text-primary font-semibold press"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 shrink-0">
        <Button size="xl" disabled={!valid || loading} onClick={handleVerify}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying…</> : "Verify"}
        </Button>
      </div>
    </div>
  );
}
