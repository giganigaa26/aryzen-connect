import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge, Rarity } from "@/lib/badges";

const RARITY_RING: Record<Rarity, string> = {
  Common:    "border-accent/40",
  Rare:      "border-accent/60",
  Epic:      "border-accent shadow-[0_0_14px_-4px_hsl(var(--accent)/0.55)]",
  Legendary: "border-accent shadow-[0_0_18px_-3px_hsl(var(--accent)/0.7)]",
};

const RARITY_ICON_BG: Record<Rarity, string> = {
  Common:    "bg-accent/10 text-accent",
  Rare:      "bg-accent/15 text-accent",
  Epic:      "bg-accent/20 text-accent",
  Legendary: "bg-accent/25 text-accent",
};

/**
 * Compact badge tile used in the Trophy Case and Achievements grid.
 * Pure CSS transitions for performance — no JS animation loops.
 */
export function BadgeCard({
  badge,
  onClick,
  size = "md",
}: {
  badge: Badge;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  const Icon = badge.icon;
  const pct = Math.min(100, Math.round((badge.currentProgress / badge.targetProgress) * 100));
  const showProgress = !badge.isUnlocked && pct > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press relative w-full aspect-square text-center rounded-2xl border bg-zinc-900 p-3 overflow-hidden flex flex-col items-center justify-center",
        "transition-all duration-200 hover:-translate-y-0.5",
        badge.isUnlocked ? RARITY_RING[badge.rarity] : "border-white/5 opacity-75",
      )}
    >
      <div
        className={cn(
          "mx-auto rounded-xl flex items-center justify-center relative",
          size === "sm" ? "h-10 w-10" : "h-12 w-12",
          badge.isUnlocked ? RARITY_ICON_BG[badge.rarity] : "bg-white/5 text-muted-foreground/60",
        )}
      >
        <Icon size={size === "sm" ? 20 : 24} />
        {!badge.isUnlocked && (
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Lock size={10} className="text-muted-foreground" />
          </span>
        )}
      </div>

      <div className={cn("font-semibold leading-tight mt-2", size === "sm" ? "text-[11px]" : "text-xs")}>
        {badge.name}
      </div>
      <div className="text-[9px] uppercase tracking-wider font-bold mt-0.5 text-muted-foreground">
        {badge.rarity}
      </div>

      {showProgress && (
        <div className="mt-2 h-1 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </button>
  );
}
