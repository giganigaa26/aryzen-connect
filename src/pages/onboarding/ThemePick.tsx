import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { PALETTES, type PaletteId } from "@/lib/themes";
import type { LangCode } from "@/lib/config";

/**
 * Onboarding theme picker — "Choose Your Vibe".
 *
 * Each card renders a tiny mock match card (prize amount + progress bar)
 * tinted with the palette's accent, so the user sees the brand color in
 * context. Selection applies instantly via ThemeContext and the Continue
 * button picks up `bg-primary`, which transitions to the new accent.
 *
 * Performance: CSS-only transitions, no animation libs, no re-render of
 * sibling cards on hover. Scanline overlay is a single repeating-linear-
 * gradient — no images, no JS.
 */
export default function ThemePick() {
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { lang?: LangCode } };
  const { palette, setPalette } = useTheme();
  const [picked, setPicked] = useState<PaletteId>(palette);

  const apply = (id: PaletteId) => {
    setPicked(id);
    setPalette(id);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 safe-top safe-bottom bg-background">
      <button onClick={() => nav(-1)} className="press -ml-2 h-10 w-10 flex items-center justify-center text-muted-foreground shrink-0">
        <ArrowLeft size={22} />
      </button>

      <div className="pt-2 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">Choose Your Vibe</h1>
        <p className="text-muted-foreground mt-2">Pick an accent. You can change this anytime.</p>
      </div>

      <div className="mt-6 flex-1 -mx-6 px-6 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {PALETTES.map((p) => {
            const sel = picked === p.id;
            return (
              <button
                key={p.id}
                onClick={() => apply(p.id)}
                style={
                  sel
                    ? { borderColor: "hsl(var(--accent))", boxShadow: "0 0 10px hsl(var(--accent) / 0.55)" }
                    : undefined
                }
                className={cn(
                  "press relative rounded-2xl border-2 p-2.5 text-left bg-card transition-[border-color,box-shadow] duration-200",
                  !sel && "border-border"
                )}
              >
                <MiniMatchPreview
                  bg={p.preview.bg}
                  card={p.preview.card}
                  accent={p.preview.primary}
                />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="font-bold text-sm leading-tight truncate">{p.label}</div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      sel ? "bg-accent text-accent-foreground" : "border-2 border-border"
                    )}
                  >
                    {sel && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-4 shrink-0">
        <Button
          size="xl"
          onClick={() => nav("/auth", { state: { lang: state?.lang } })}
          className="transition-colors duration-200"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

/**
 * Mini-Match Preview — a compact mock of a match card:
 *  • accent-tinted prize amount
 *  • thin progress bar filled to ~65% in the accent color
 *  • diagonal scanline overlay (opacity 0.05) for tech vibe
 */
function MiniMatchPreview({
  bg,
  card,
  accent,
  fg,
}: {
  bg: string;
  card: string;
  accent: string;
  fg?: string;
}) {
  return (
    <div
      className="relative rounded-xl h-24 p-2 overflow-hidden border"
      style={{ background: `hsl(${bg})`, borderColor: `hsl(${bg})` }}
    >
      {/* Scanline overlay */}
      <div className="scanlines absolute inset-0" />

      {/* Mock mini match card */}
      <div
        className="relative rounded-md p-2 shadow-sm h-full flex flex-col justify-between"
        style={{ background: `hsl(${card})` }}
      >
        <div className="flex items-center justify-between">
          <span
            className="h-1.5 w-10 rounded"
            style={{ background: fg ? `hsl(${fg} / 0.25)` : `hsl(${bg} / 0.6)` }}
          />
          <span
            className="text-[10px] font-extrabold leading-none"
            style={{ color: `hsl(${accent})` }}
          >
            ₹2.5K
          </span>
        </div>
        <div>
          <div
            className="h-1 w-full rounded-full overflow-hidden"
            style={{ background: fg ? `hsl(${fg} / 0.15)` : `hsl(${bg} / 0.5)` }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: "65%", background: `hsl(${accent})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
