import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { BadgeCard } from "./BadgeCard";
import { BadgeDetailSheet } from "./BadgeDetailSheet";
import type { Badge } from "@/lib/badges";
import { RARITY_ORDER } from "@/lib/badges";

export function AchievementsSheet({
  open,
  onOpenChange,
  badges,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badges: Badge[];
}) {
  const [selected, setSelected] = useState<Badge | null>(null);

  // Unlocked first (rarity desc), then locked (rarity desc).
  const sorted = [...badges].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
    return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
  });
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetTitle>Achievements</SheetTitle>
          <SheetDescription>
            {unlockedCount} of {badges.length} unlocked · Tap a badge for details.
          </SheetDescription>
          <div className="grid grid-cols-3 gap-3 mt-4 pb-4">
            {sorted.map((b) => (
              <BadgeCard key={b.id} badge={b} onClick={() => setSelected(b)} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
      <BadgeDetailSheet badge={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </>
  );
}
