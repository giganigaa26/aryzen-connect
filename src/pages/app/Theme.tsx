import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { PALETTES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export default function ThemePage() {
  const nav = useNavigate();
  const { palette, setPalette } = useTheme();

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="h-14 px-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="press h-10 w-10 rounded-full flex items-center justify-center" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Appearance</h1>
        </div>
      </header>

      <div className="px-4 pt-4 pb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Theme</h2>
        <div className="grid grid-cols-2 gap-3">
          {PALETTES.map((p) => {
            const selected = palette === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                className={cn(
                  "press relative rounded-2xl border-2 p-2.5 text-left bg-card transition-colors",
                  selected ? "border-primary" : "border-border"
                )}
              >
                <div
                  className="rounded-xl h-24 p-2 flex flex-col justify-between overflow-hidden border"
                  style={{
                    background: `hsl(${p.preview.bg})`,
                    borderColor: `hsl(${p.preview.bg})`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-md" style={{ background: `hsl(${p.preview.primary})` }} />
                    <span className="h-1.5 w-8 rounded" style={{ background: `hsl(${p.preview.primary})`, opacity: 0.4 }} />
                  </div>
                  <div className="rounded-md p-1.5 shadow-sm" style={{ background: `hsl(${p.preview.card})` }}>
                    <div className="h-1 w-12 rounded mb-1" style={{ background: `hsl(${p.preview.primary})`, opacity: 0.35 }} />
                    <div className="flex items-center gap-1">
                      <span className="h-2.5 flex-1 rounded" style={{ background: `hsl(${p.preview.primary})` }} />
                      <span className="h-2.5 w-4 rounded" style={{ background: `hsl(${p.preview.accent})`, opacity: 0.7 }} />
                    </div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm leading-tight truncate">{p.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      selected ? "bg-primary text-primary-foreground" : "border-2 border-border"
                    )}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-[11px] text-muted-foreground leading-snug">
          Themes only change accent colors. Aryzen is dark-only — surfaces stay neutral across every theme.
        </p>
      </div>
    </>
  );
}
