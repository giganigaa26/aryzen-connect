import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createAuthWithPhone } from "@/lib/stubs";
import { toast } from "sonner";
import type { LangCode } from "@/lib/config";

export default function Phone() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { lang?: LangCode } };
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = phone.length === 10;

  const send = async () => {
    setLoading(true);
    try {
      const res = await createAuthWithPhone(phone);
      if (!res.ok) throw new Error();
      nav("/otp", { state: { phone, lang: state?.lang, via: "phone" } });
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
        <h1 className="text-3xl font-extrabold tracking-tight">Enter your number</h1>
        <p className="text-muted-foreground mt-2">We'll send you a verification code</p>
      </div>

      <div className="mt-8 shrink-0">
        <label className="text-sm font-semibold text-muted-foreground">Phone Number</label>
        <div className="mt-2 flex items-stretch rounded-button border-2 border-border focus-within:border-primary transition-colors overflow-hidden bg-card">
          <div className="px-4 flex items-center font-semibold border-r border-border bg-secondary">+91</div>
          <input
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 9876543210"
            className="flex-1 px-4 py-3 bg-transparent outline-none text-base font-medium tracking-wide placeholder:text-muted-foreground/60"
            autoFocus
          />
        </div>
      </div>

      <div className="mt-auto pt-8 shrink-0">
        <Button size="xl" disabled={!valid || loading} onClick={send}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : "Send OTP"}
        </Button>
      </div>
    </div>
  );
}
