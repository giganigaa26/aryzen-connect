import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Slot } from "@/lib/stubs";
import type { ModeKind } from "@/lib/config";
import { Crosshair } from "lucide-react";

/**
 * Mode-aware players table. Layout adapts to `kind` (admin-driven), so a
 * Solo BR room renders a clean list, Duo pairs into 2-cols, Squad renders
 * team boxes, Kill Mode shows a kills column, etc.
 *
 * `playersPerSlot` is kept as a fallback when `kind` isn't supplied.
 */
export function SlotGrid({
  slots,
  playersPerSlot = 1,
  kind,
}: {
  slots: Slot[];
  playersPerSlot?: number;
  kind?: ModeKind;
}) {
  // Kill Mode — single-column list with kills column.
  if (kind === "kill") {
    return (
      <div className="space-y-1.5">
        {slots.map((s, i) => (
          <motion.div
            key={s.slot}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.012, duration: 0.18 }}
          >
            <SlotRow s={s} showKills />
          </motion.div>
        ))}
      </div>
    );
  }

  // 1v1 — two stacked rows, full-width.
  if (kind === "cs-1v1") {
    return (
      <div className="space-y-1.5">
        {slots.map((s) => (
          <SlotRow key={s.slot} s={s} />
        ))}
      </div>
    );
  }

  // Solo BR (or any solo-style mode) — single column list.
  const effectivePerSlot =
    kind === "br-solo" ? 1 :
    kind === "br-duo"  ? 2 :
    kind === "br-squad" || kind === "cs-4v4" ? 4 :
    playersPerSlot;

  if (effectivePerSlot <= 1) {
    // Solo — 2 column list of numbered rows.
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((s, i) => (
          <motion.div
            key={s.slot}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.012, duration: 0.18 }}
          >
            <SlotRow s={s} />
          </motion.div>
        ))}
      </div>
    );
  }

  // Duo / Squad / 4v4 — 2-column grid of team boxes, players stacked vertically.
  const teams: Slot[][] = [];
  for (let i = 0; i < slots.length; i += effectivePerSlot) {
    teams.push(slots.slice(i, i + effectivePerSlot));
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {teams.map((team, ti) => (
        <motion.div
          key={ti}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: ti * 0.02, duration: 0.18 }}
          className="rounded-xl border border-border bg-secondary/40 p-2"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 px-0.5">
            Team {String(ti + 1).padStart(2, "0")}
          </div>
          <div className="space-y-1">
            {team.map((s) => <SlotRow key={s.slot} s={s} />)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SlotRow({ s, showKills }: { s: Slot; showKills?: boolean }) {
  const empty = !s.player;
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-9 px-2 rounded-lg border",
        empty
          ? "border-dashed border-border bg-background/40"
          : s.isYou
          ? "border-primary bg-primary/10"
          : "border-border bg-card"
      )}
    >
      <div
        className={cn(
          "h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold",
          s.isYou ? "bg-primary text-primary-foreground"
          : empty ? "bg-secondary text-muted-foreground"
          : "bg-secondary text-foreground"
        )}
      >
        {s.slot}
      </div>
      <div
        className={cn(
          "flex-1 text-xs font-semibold truncate min-w-0",
          empty ? "text-muted-foreground italic font-medium"
          : s.isYou ? "text-primary"
          : "text-foreground"
        )}
      >
        {empty ? "Empty" : s.player}
      </div>
      {showKills && !empty && (
        <div className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-foreground tabular-nums">
          <Crosshair size={11} className="text-destructive" />
          {s.kills ?? 0}
        </div>
      )}
    </div>
  );
}
