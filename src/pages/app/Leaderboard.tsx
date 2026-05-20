import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Medal, Trophy } from "lucide-react";

import { ScreenHeader } from "@/components/ScreenHeader";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";
import { axToInr } from "@/lib/config";
import {
  fetchLeaderboard,
  getUserRank,
  type LeaderboardEntry,
  type LeaderboardPeriod,
} from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";

/** Page size for incremental render — keeps list snappy with large boards. */
const PAGE_SIZE = 50;

/** Map any level string from the data into one of 4 visual tiers. */
type LevelTier = "Rookie" | "Warrior" | "Champion" | "Legend";
function levelTier(level: string): LevelTier {
  const l = level.toLowerCase();
  if (l === "legend") return "Legend";
  if (l === "champion" || l === "diamond" || l === "platinum") return "Champion";
  if (l === "rookie") return "Rookie";
  return "Warrior"; // Bronze / Silver / Gold and any unknown
}
const LEVEL_COLOR: Record<LevelTier, string> = {
  Rookie: "#9CA3AF",
  Warrior: "#CD7F32",
  Champion: "#C0C0C0",
  Legend: "#FFD700",
};
function LevelBadge({ level }: { level: string }) {
  const tier = levelTier(level);
  const bg = LEVEL_COLOR[tier];
  return (
    <span
      className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-extrabold uppercase tracking-wide shrink-0"
      style={{ backgroundColor: `${bg}33`, color: bg, border: `1px solid ${bg}66` }}
    >
      {tier}
    </span>
  );
}

const PERIOD_LABEL: Record<LeaderboardPeriod, string> = {
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

// ─── Per-player deterministic helpers ──────────────────────────────────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
/** Unique avatar gradient per user — derived from userId, theme-token based. */
function avatarGradient(userId: string): string {
  const palettes = [
    "from-primary to-accent",
    "from-accent to-primary",
    "from-warning to-primary",
    "from-success to-accent",
    "from-primary to-success",
    "from-accent to-warning",
    "from-success to-warning",
    "from-warning to-accent",
  ];
  return palettes[hashStr(userId) % palettes.length];
}
/** Deterministic win-streak per user (0–6). 🔥 if >=3. */
function streakFor(userId: string): number {
  return hashStr(userId + "streak") % 7;
}
/** Whole-rupee formatter. */
function rupees(ax: number): string {
  return `₹${Math.round(axToInr(ax)).toLocaleString()}`;
}

/**
 * Leaderboard — period-tabbed ranking with podium, rich player cards, and a
 * tap-to-open profile sheet. All data comes from `fetchLeaderboard(period)`
 * (stub today, Supabase view in Cursor). Per-period results are cached so
 * switching tabs feels instant after the first load.
 */
export default function Leaderboard() {
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.phone ?? null;

  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const cacheRef = useRef<Partial<Record<LeaderboardPeriod, LeaderboardEntry[]>>>({});
  const [board, setBoard] = useState<LeaderboardEntry[] | null>(null);
  const [me, setMe] = useState<{ rank: number; entry: LeaderboardEntry } | null>(null);

  // Pagination — render up to `visibleCount` non-podium rows.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    const cached = cacheRef.current[period];
    if (cached) {
      setBoard(cached);
    } else {
      setBoard(null);
      fetchLeaderboard(period).then((data) => {
        if (cancelled) return;
        cacheRef.current[period] = data;
        setBoard(data);
      });
    }
    setVisibleCount(PAGE_SIZE);
    getUserRank(userId, period).then((r) => {
      if (!cancelled) setMe(r);
    });
    return () => {
      cancelled = true;
    };
  }, [period, userId]);

  const top3 = board?.slice(0, 3);
  const rest = board?.slice(3) ?? [];
  const visibleRest = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;
  const meInTop100 = me ? me.rank <= 100 : false;

  const aboveGap = useMemo(() => {
    if (!board || !me || me.rank <= 1) return null;
    const above = board[me.rank - 2];
    if (!above) return null;
    const diff = Math.max(0, Math.round(axToInr(above.ax) - axToInr(me.entry.ax)));
    return { rank: above.rank, diff };
  }, [board, me]);

  const top10Gap = useMemo(() => {
    if (!board || !me || me.rank <= 10) return null;
    const tenth = board[9];
    if (!tenth) return null;
    return Math.max(0, Math.round(axToInr(tenth.ax) - axToInr(me.entry.ax)));
  }, [board, me]);

  return (
    <>
      <ScreenHeader title="Leaderboard" />

      <div className="px-4 pt-4 pb-4">
        {/* Period selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-secondary rounded-full">
          {(["week", "month", "all"] as LeaderboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "relative h-9 rounded-full text-sm font-semibold transition-colors duration-150 active:scale-[0.97]",
                period === p ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {period === p && (
                <motion.span
                  layoutId="lbPeriodPill"
                  className="absolute inset-0 rounded-full bg-primary shadow-sm"
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                />
              )}
              <span className="relative z-10">{PERIOD_LABEL[p]}</span>
            </button>
          ))}
        </div>

        {top10Gap !== null && top10Gap > 0 && (
          <div className="mt-3 text-xs text-muted-foreground text-center font-medium">
            🎯 ₹{top10Gap.toLocaleString()} more to reach Top 10
          </div>
        )}

        <AnimatePresence mode="wait">
          {board === null ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <PodiumSkeleton />
              <ListSkeleton />
            </motion.div>
          ) : board.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <EmptyBoard onBrowse={() => nav("/app")} />
            </motion.div>
          ) : (
            <motion.div key={period} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mt-6 grid grid-cols-3 items-end gap-2">
                <PodiumCard player={top3![1]} place={2} />
                <PodiumCard player={top3![0]} place={1} />
                <PodiumCard player={top3![2]} place={3} />
              </div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.02, delayChildren: 0.1 } } }}
                className="mt-6 space-y-2"
              >
                {visibleRest.map((p) => (
                  <motion.div
                    key={p.userId}
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
                    }}
                  >
                    <PlayerRow
                      entry={p}
                      isYou={meInTop100 && me?.entry.userId === p.userId}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky my-rank card — sits above bottom nav, always visible */}
        {me && (
          <div className="sticky bottom-[80px] z-30 mt-6 -mx-4 px-4">
            <YourRankSticky entry={me.entry} rank={me.rank} aboveGap={aboveGap} />
          </div>
        )}

        <div className="h-20" />
      </div>
    </>
  );
}

// ─── Podium ────────────────────────────────────────────────────────────────

function PodiumCard({ player, place }: { player: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const isFirst = place === 1;
  const ring =
    place === 1
      ? "ring-warning shadow-[0_8px_30px_-6px_hsl(var(--warning)/0.5)]"
      : place === 2
      ? "ring-muted-foreground/40"
      : "ring-[hsl(25_60%_50%)]";
  const icon =
    place === 1 ? (
      <Crown size={isFirst ? 22 : 18} className="text-warning" />
    ) : place === 2 ? (
      <Medal size={18} className="text-muted-foreground" />
    ) : (
      <Medal size={18} className="text-[hsl(25_60%_50%)]" />
    );
  const onStreak = streakFor(player.userId) >= 3;
  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1], delay: place === 1 ? 0.2 : 0.05 + place * 0.05 }}
      className="flex flex-col items-center will-change-transform select-none rounded-2xl p-1 -m-1"
    >
      <div className="h-5 flex items-center">{icon}</div>
      <div
        className={cn(
          "mt-1 rounded-full bg-gradient-to-br text-primary-foreground flex items-center justify-center font-extrabold ring-4 ring-offset-2 ring-offset-background",
          avatarGradient(player.userId),
          isFirst ? "h-20 w-20 text-xl" : "h-14 w-14 text-base",
          ring
        )}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="mt-2 text-xs font-bold text-center truncate max-w-full px-1 inline-flex items-center gap-1 justify-center">
        <span className="truncate">{player.name}</span>
        {onStreak && <span aria-hidden>🔥</span>}
      </div>
      <div
        className={cn(
          "mt-1 font-extrabold tabular-nums leading-none",
          isFirst ? "text-2xl text-warning" : "text-xl text-foreground"
        )}
      >
        {rupees(player.ax)}
      </div>
      <div
        className={cn(
          "mt-2 w-full rounded-t-xl flex items-start justify-center pt-2 font-extrabold",
          isFirst
            ? "h-16 bg-gradient-to-b from-warning to-warning/70 text-warning-foreground"
            : place === 2
            ? "h-12 bg-secondary text-foreground"
            : "h-10 bg-secondary text-foreground"
        )}
      >
        #{place}
      </div>
    </motion.div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-3 items-end gap-2">
      {[2, 1, 3].map((p, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={cn("rounded-full bg-secondary animate-pulse", p === 1 ? "h-20 w-20" : "h-14 w-14")} />
          <div className="h-3 w-16 rounded bg-secondary mt-2 animate-pulse" />
          <div className="h-4 w-14 rounded bg-secondary mt-2 animate-pulse" />
          <div className={cn("mt-2 w-full bg-secondary rounded-t-xl animate-pulse", p === 1 ? "h-16" : p === 2 ? "h-12" : "h-10")} />
        </div>
      ))}
    </div>
  );
}

// ─── Player row ───────────────────────────────────────────────────────────

function PlayerRow({ entry, isYou }: { entry: LeaderboardEntry; isYou?: boolean }) {
  const onStreak = streakFor(entry.userId) >= 3;
  const [pressed, setPressed] = useState(false);
  // Tap feedback only — 150ms scale-down. No popup.
  const handlePress = () => {
    setPressed(true);
    window.setTimeout(() => setPressed(false), 150);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePress}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handlePress()}
      className={cn(
        "w-full text-left rounded-2xl border bg-card p-3 select-none",
        "transition-transform duration-150 ease-out",
        pressed && "scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isYou ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.25)]" : "border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 text-center font-extrabold text-sm tabular-nums text-muted-foreground">
          {entry.rank}
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-full bg-gradient-to-br text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0",
            avatarGradient(entry.userId)
          )}
        >
          {entry.name.slice(0, 2).toUpperCase()}
        </div>
        <LevelBadge level={entry.level} />
        <div className="flex-1 min-w-0 font-semibold text-sm truncate inline-flex items-center gap-1">
          <span className="truncate">{entry.name}</span>
          {onStreak && <span aria-hidden>🔥</span>}
        </div>
        <div className="font-extrabold text-sm tabular-nums">{rupees(entry.ax)}</div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-4 rounded bg-secondary" />
            <div className="h-10 w-10 rounded-full bg-secondary" />
            <div className="flex-1 h-3 rounded bg-secondary" />
            <div className="w-12 h-3 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Your-rank sticky ─────────────────────────────────────────────────────

function YourRankSticky({
  entry,
  rank,
  aboveGap,
}: {
  entry: LeaderboardEntry;
  rank: number;
  aboveGap: { rank: number; diff: number } | null;
}) {
  const ax = useCountUp(entry.ax, 800);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 px-4 py-3"
    >
      <div className="font-bold text-sm tabular-nums">
        You're #{rank}
        {aboveGap && aboveGap.diff > 0 && (
          <> · ₹{aboveGap.diff.toLocaleString()} away from #{aboveGap.rank}</>
        )}
      </div>
      <div className="mt-0.5 text-[11px] opacity-80 tabular-nums">{rupees(ax)} earned</div>
    </motion.div>
  );
}

function EmptyBoard({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="h-16 w-16 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mb-3">
        <Trophy size={28} />
      </div>
      <div className="font-bold">No rankings yet</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-xs">
        No rankings yet for this period. Play matches to get on the board!
      </div>
      <Button className="mt-4" onClick={onBrowse}>
        Browse Matches
      </Button>
    </div>
  );
}
