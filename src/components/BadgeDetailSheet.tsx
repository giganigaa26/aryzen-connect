import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Badge } from "@/lib/badges";
import { RARITY_LABEL_CLASS } from "@/lib/badges";

export function BadgeDetailSheet({
  badge,
  onOpenChange,
}: {
  badge: Badge | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!badge;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        {badge && <BadgeBody badge={badge} />}
      </SheetContent>
    </Sheet>
  );
}

function BadgeBody({ badge }: { badge: Badge }) {
  const Icon = badge.icon;
  const pct = Math.min(100, Math.round((badge.currentProgress / badge.targetProgress) * 100));
  const fmt = badge.format ?? ((c: number, t: number) => `${c} / ${t}`);
  return (
    <div className="pt-2">
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "h-20 w-20 rounded-2xl flex items-center justify-center mb-3 relative",
            badge.isUnlocked
              ? "bg-accent/15 text-accent shadow-[0_0_24px_-6px_hsl(var(--accent)/0.7)]"
              : "bg-secondary text-muted-foreground/60",
          )}
        >
          <Icon size={40} />
          {!badge.isUnlocked && (
            <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center">
              <Lock size={12} className="text-muted-foreground" />
            </span>
          )}
        </div>
        <SheetTitle className="text-xl">{badge.name}</SheetTitle>
        <span className={cn(
          "mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
          RARITY_LABEL_CLASS[badge.rarity],
        )}>
          {badge.rarity}
        </span>
        <SheetDescription className="mt-3 max-w-xs">{badge.description}</SheetDescription>
      </div>

      <div className="mt-5 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground uppercase tracking-wider">Progress</span>
          <span>{fmt(badge.currentProgress, badge.targetProgress)}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700",
              badge.isUnlocked ? "bg-accent" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {badge.isUnlocked && badge.unlockedAt && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-success">
            <CheckCircle2 size={14} />
            Unlocked on {new Date(badge.unlockedAt).toLocaleDateString(undefined, {
              day: "numeric", month: "short", year: "numeric",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
