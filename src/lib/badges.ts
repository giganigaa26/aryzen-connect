// Badge system — central definitions + progress resolution.
// Stats source: fetchTotalEarned (₹), getUserRank (leaderboard), plus
// hardcoded matchesJoined/wins until those stubs exist.

import {
  Award, Crown, Trophy, Target, Flame, Medal, Star, Coins, Gem, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { fetchTotalEarned, getUserRank } from "@/lib/stubs";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: LucideIcon;
  /** How to compute progress from PlayerStats. Returns 0..targetProgress. */
  metric: (s: PlayerStats) => number;
  targetProgress: number;
  /** Format the progress label (e.g. "₹120 / ₹500"). */
  format?: (cur: number, tgt: number) => string;
};

export type Badge = BadgeDef & {
  currentProgress: number;
  isUnlocked: boolean;
  unlockedAt?: string; // ISO
};

export type PlayerStats = {
  matchesJoined: number;
  wins: number;
  totalEarned: number; // ₹
  rank: number | null; // null = unranked
};

export const RARITY_ORDER: Record<Rarity, number> = {
  Common: 0, Rare: 1, Epic: 2, Legendary: 3,
};

export const RARITY_LABEL_CLASS: Record<Rarity, string> = {
  Common:    "bg-secondary text-muted-foreground",
  Rare:      "bg-primary/15 text-primary",
  Epic:      "bg-accent/20 text-accent-foreground",
  Legendary: "bg-gradient-to-r from-amber-400 to-yellow-300 text-black",
};

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_match",
    name: "First Blood",
    description: "Join your very first match.",
    rarity: "Common",
    icon: Target,
    metric: (s) => Math.min(1, s.matchesJoined > 0 ? 1 : 0),
    targetProgress: 1,
    format: (c, t) => `${c}/${t} match`,
  },
  {
    id: "first_win",
    name: "First Victory",
    description: "Win your first match.",
    rarity: "Common",
    icon: Award,
    metric: (s) => Math.min(1, s.wins > 0 ? 1 : 0),
    targetProgress: 1,
    format: (c, t) => `${c}/${t} win`,
  },
  {
    id: "earn_50",
    name: "First Payday",
    description: "Earn ₹50 in total prize money.",
    rarity: "Common",
    icon: Coins,
    metric: (s) => Math.min(50, s.totalEarned),
    targetProgress: 50,
    format: (c, t) => `₹${c} / ₹${t}`,
  },
  {
    id: "joined_50",
    name: "Grinder",
    description: "Join 50 matches.",
    rarity: "Rare",
    icon: Flame,
    metric: (s) => Math.min(50, s.matchesJoined),
    targetProgress: 50,
    format: (c, t) => `${c} / ${t}`,
  },
  {
    id: "earn_500",
    name: "Bankroll",
    description: "Earn ₹500 in total prize money.",
    rarity: "Rare",
    icon: Medal,
    metric: (s) => Math.min(500, s.totalEarned),
    targetProgress: 500,
    format: (c, t) => `₹${c} / ₹${t}`,
  },
  {
    id: "top100",
    name: "Top 100",
    description: "Break into the leaderboard Top 100.",
    rarity: "Rare",
    icon: Star,
    metric: (s) => (s.rank != null && s.rank <= 100 ? 1 : 0),
    targetProgress: 1,
    format: (c, t) => (c >= t ? "Reached" : "Not yet"),
  },
  {
    id: "joined_100",
    name: "Centurion",
    description: "Join 100 matches.",
    rarity: "Epic",
    icon: Sparkles,
    metric: (s) => Math.min(100, s.matchesJoined),
    targetProgress: 100,
    format: (c, t) => `${c} / ${t}`,
  },
  {
    id: "top10",
    name: "Elite Ten",
    description: "Climb into the leaderboard Top 10.",
    rarity: "Epic",
    icon: Crown,
    metric: (s) => (s.rank != null && s.rank <= 10 ? 1 : 0),
    targetProgress: 1,
    format: (c, t) => (c >= t ? "Reached" : "Not yet"),
  },
  {
    id: "earn_10k",
    name: "High Roller",
    description: "Earn ₹10,000 in total prize money.",
    rarity: "Legendary",
    icon: Gem,
    metric: (s) => Math.min(10000, s.totalEarned),
    targetProgress: 10000,
    format: (c, t) => `₹${c.toLocaleString()} / ₹${t.toLocaleString()}`,
  },
  {
    id: "rank_one",
    name: "Apex Predator",
    description: "Hold the #1 leaderboard spot.",
    rarity: "Legendary",
    icon: Trophy,
    metric: (s) => (s.rank === 1 ? 1 : 0),
    targetProgress: 1,
    format: (c, t) => (c >= t ? "Reached" : "Not yet"),
  },
];

/** Deterministic stub unlock dates per badge id. */
const FAKE_UNLOCK_DATES: Record<string, string> = {
  first_match: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  first_win:   new Date(Date.now() - 22 * 86_400_000).toISOString(),
  earn_50:     new Date(Date.now() - 18 * 86_400_000).toISOString(),
  joined_50:   new Date(Date.now() - 9  * 86_400_000).toISOString(),
  earn_500:    new Date(Date.now() - 4  * 86_400_000).toISOString(),
  top100:      new Date(Date.now() - 2  * 86_400_000).toISOString(),
};

export function resolveBadges(stats: PlayerStats): Badge[] {
  return BADGE_DEFS.map((def) => {
    const cur = def.metric(stats);
    const unlocked = cur >= def.targetProgress;
    return {
      ...def,
      currentProgress: cur,
      isUnlocked: unlocked,
      unlockedAt: unlocked ? FAKE_UNLOCK_DATES[def.id] : undefined,
    };
  });
}

/** Top 3 unlocked, sorted by rarity desc; tie-break by definition order. */
export function topUnlockedBadges(badges: Badge[], n = 3): Badge[] {
  return badges
    .filter((b) => b.isUnlocked)
    .sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
    .slice(0, n);
}

export async function loadPlayerStats(
  userId: string | null | undefined,
  matchesJoined: number,
  wins: number,
): Promise<PlayerStats> {
  const [totalEarned, rankRes] = await Promise.all([
    fetchTotalEarned(userId),
    getUserRank(userId ?? "me", "all"),
  ]);
  return {
    matchesJoined,
    wins,
    totalEarned,
    rank: rankRes?.rank ?? null,
  };
}
