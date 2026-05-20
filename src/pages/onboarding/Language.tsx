import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES, type LangCode } from "@/lib/config";

/**
 * Language picker — clean flag + name list (per spec, no helper subtext).
 *
 * The list is scrollable; we deliberately keep the last few items (Tamil,
 * Telugu, Bengali) peeking behind the footer so users can tell more options
 * exist below. After picking, we forward to the next onboarding step (Theme).
 */
export default function Language() {
  const nav = useNavigate();
  const [picked, setPicked] = useState<LangCode>("en");

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom bg-background">
      <div className="pt-6 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">Choose Language</h1>
        <p className="text-muted-foreground mt-2">Select your preferred language</p>
      </div>

      <div className="mt-6 flex-1 -mx-6 px-6 overflow-y-auto no-scrollbar">
        <div className="flex flex-col gap-2.5 pb-4">
          {LANGUAGES.map((l) => {
            const sel = picked === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setPicked(l.code)}
                className={cn(
                  "press flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-colors",
                  sel ? "border-primary bg-primary/5" : "border-border bg-card"
                )}
              >
                <span className="text-2xl leading-none shrink-0" aria-hidden="true">{l.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-bold leading-tight">{l.native}</div>
                  {l.label !== l.native && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">{l.label}</div>
                  )}
                </div>
                <div
                  className={cn(
                    "h-6 w-6 shrink-0 rounded-full flex items-center justify-center transition-colors",
                    sel ? "bg-primary text-primary-foreground" : "border-2 border-border"
                  )}
                >
                  {sel && <Check size={14} strokeWidth={3} />}
                </div>
              </button>
            );
          })}
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            More languages coming soon
          </p>
        </div>
      </div>

      <div className="pt-4 shrink-0">
        <Button size="xl" onClick={() => nav("/theme-pick", { state: { lang: picked } })}>
          Continue
        </Button>
      </div>
    </div>
  );
}
