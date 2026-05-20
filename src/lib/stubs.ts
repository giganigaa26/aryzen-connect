// Stub data + stub network functions. Will be replaced with Supabase calls in Cursor.

import type { ModeKind } from "@/lib/config";
export type { ModeKind };

export type Match = {
  id: string;
  name: string;
  game: "freefire" | "bgmi" | "stumble" | "codm";
  // Free Fire modes — keep loosely typed; admin can create any label.
  mode: string;
  /** Admin-set kind drives player-table layout + prize template shape. */
  modeKind?: ModeKind;
  date: string;        // ISO
  slotsFilled: number;
  slotsTotal: number;
  entryFee: number;    // AX
  /** Admin-set per-kill reward (Kill Mode only). */
  killReward?: number;
  /** Admin-set match-specific rule chips (e.g. "All weapons", "No airdrop"). */
  customRules?: string[];
  // TODO: replace with Supabase Storage URL
  imageUrl?: string;
  /** Admin-controlled lifecycle. Replace with `matches.status` column. */
  status?: "open" | "declaring_result";
  /** Admin flag — match is free to enter. Replace with `matches.is_free`. */
  isFree?: boolean;
};

/** Possible join states for the universal Join button. */
export type JoinState = "joined" | "declaring" | "full" | "free" | "open";

export type Slot = { slot: number; player: string; isYou?: boolean; kills?: number };
/**
 * Prize template row — supports single ranks ("1st") or ranges ("4th-10th").
 * Admin-driven; frontend renders whatever shape the template has.
 */
export type PrizeRow = { rank: number; prize: number; label?: string };
export type PrizeTemplate = {
  totalPool?: number;
  rows: PrizeRow[];
  /** For Kill Mode only — per-kill reward in AX. */
  killReward?: number;
  /** For Kill Mode — entry fee is refundable. */
  entryRefundable?: boolean;
};
/**
 * Wallet transaction — represents one row from the unified ax_transactions
 * view (deposits + withdrawals + match entries + prizes + admin credits).
 */
export type TxKind = "deposit" | "withdrawal" | "match-entry" | "prize" | "bonus";
export type TxStatus = "pending" | "completed" | "rejected";
export type Tx = {
  id: string;
  kind: TxKind;
  type: "credit" | "debit";
  title: string;          // "Match Entry", "Prize Won", "AX Added", etc.
  subtitle?: string;      // e.g. match name
  amount: number;         // AX
  date: string;           // ISO
  status: TxStatus;
  /** Failure reason when status === "rejected". */
  reason?: string;
  /** Machine-readable reason code for special-case rendering (e.g. match refund tags). */
  reasonCode?: "match_cancelled";
  /** Linked match id when the tx relates to a match (refund, entry, prize). */
  matchId?: string;
};

/**
 * Announcement banner shown after login. Stored per-id in localStorage so
 * dismissed announcements stay dismissed but new ones still appear.
 */
export type Announcement = {
  id: string;            // unique — bump when content changes
  title: string;
  body: string;
  cta?: { label: string; url: string };
};

export const DUMMY_MATCHES: Match[] = [
  { id: "m1", name: "Bermuda Blitz #18",   game: "freefire", mode: "Bermuda (BR)", modeKind: "br-squad", date: new Date(Date.now() + 2*60*60*1000).toISOString(),  slotsFilled: 32, slotsTotal: 48, entryFee: 50,  customRules: ["All weapons", "No airdrop", "Screen record top 3"] },
  { id: "m2", name: "Lone Wolf Showdown",  game: "freefire", mode: "Solo BR",      modeKind: "br-solo",  date: new Date(Date.now() + 5*60*60*1000).toISOString(),  slotsFilled: 3,  slotsTotal: 48, entryFee: 30,  customRules: ["Solo only", "No teaming"] },
  { id: "m3", name: "Clash Squad Cup",     game: "freefire", mode: "Clash Squad",  modeKind: "cs-4v4",   date: new Date(Date.now() + 26*60*60*1000).toISOString(), slotsFilled: 6,  slotsTotal: 8,  entryFee: 75,  customRules: ["Best of 7", "Custom loadout"] },
  { id: "m4", name: "Kill Rush Friday",    game: "freefire", mode: "Kill Mode",    modeKind: "kill",     date: new Date(Date.now() - 5*60*1000).toISOString(),     slotsFilled: 48, slotsTotal: 48, entryFee: 50,  killReward: 10, customRules: ["Entry refundable", "10 AX per kill"], status: "declaring_result" },
  { id: "m5", name: "Duo Domination",      game: "freefire", mode: "Duo BR",       modeKind: "br-duo",   date: new Date(Date.now() + 8*60*60*1000).toISOString(),  slotsFilled: 14, slotsTotal: 48, entryFee: 40,  customRules: ["Duo only", "Bring your partner"] },
  { id: "m6", name: "1v1 Sniper Duel",     game: "freefire", mode: "Clash 1v1",    modeKind: "cs-1v1",   date: new Date(Date.now() + 90*60*1000).toISOString(),    slotsFilled: 1,  slotsTotal: 2,  entryFee: 0,  customRules: ["Snipers only", "Winner takes all"], isFree: true },
];

/**
 * Default prize templates per mode kind. Admin can override per match in Supabase
 * (table: match_prize_templates). Rendered dynamically — no hardcoded length.
 */
export const DUMMY_PRIZE_TEMPLATES: Record<ModeKind, PrizeTemplate> = {
  "br-solo": {
    rows: [
      { rank: 1, prize: 800, label: "1st" },
      { rank: 2, prize: 400, label: "2nd" },
      { rank: 3, prize: 250, label: "3rd" },
      { rank: 4, prize: 80,  label: "4th–10th" },
      { rank: 11, prize: 40, label: "11th–15th" },
    ],
  },
  "br-duo": {
    rows: [
      { rank: 1, prize: 1000, label: "1st (split)" },
      { rank: 2, prize: 500,  label: "2nd (split)" },
      { rank: 3, prize: 300,  label: "3rd (split)" },
      { rank: 4, prize: 100,  label: "4th–8th (split)" },
    ],
  },
  "br-squad": {
    rows: [
      { rank: 1, prize: 1500, label: "1st (per squad)" },
      { rank: 2, prize: 800,  label: "2nd (per squad)" },
      { rank: 3, prize: 400,  label: "3rd (per squad)" },
    ],
  },
  "kill": {
    killReward: 10,
    entryRefundable: true,
    rows: [],
  },
  "cs-4v4": {
    rows: [
      { rank: 1, prize: 600, label: "Winner team" },
    ],
  },
  "cs-1v1": {
    rows: [
      { rank: 1, prize: 180, label: "Winner takes all" },
    ],
  },
  "custom": {
    rows: [
      { rank: 1, prize: 500, label: "1st" },
      { rank: 2, prize: 300, label: "2nd" },
      { rank: 3, prize: 150, label: "3rd" },
    ],
  },
};

// Legacy export (kept for any other consumer)
export const DUMMY_PRIZES: PrizeRow[] = DUMMY_PRIZE_TEMPLATES["br-squad"].rows;

/**
 * Platform-wide rules. Admin-editable from a `platform_rules` table — replace
 * the constant with a `fetchPlatformRules()` call in Cursor.
 */
export const PLATFORM_RULES: string[] = [
  "No hacking or cheating. Instant ban if caught.",
  "Saw a hacker? Record your screen. Full AX refund guaranteed.",
  "No teaming with enemies. Fair play only.",
  "Late join = no refund. Be on time.",
  "Any unfair issue? Full refund. We've got your back.",
  "Room ID shows 5 mins before match. Don't miss it.",
  "Don't invite randoms or you're out. Registered players only.",
  "Level 20+ required. Build your profile first.",
  "Results posted within 5 mins. Prizes credited fast.",
];

/**
 * UserMatch = a row from match_registrations JOIN matches.
 * Shape mirrors what the Supabase query in Cursor will return so the UI
 * doesn't need to change once it's wired.
 *
 *   SELECT m.*, r.position, r.ax_won, r.slot
 *   FROM match_registrations r
 *   JOIN matches m ON m.id = r.match_id
 *   WHERE r.user_id = :uid AND m.status = :status
 *   ORDER BY m.start_time ASC|DESC
 */
export type MatchStatus = "live" | "upcoming" | "completed" | "cancelled";
export type UserMatch = {
  id: string;
  name: string;
  game: "freefire" | "bgmi" | "stumble" | "codm";
  mode: string;
  status: MatchStatus;
  startTime: string;          // ISO
  entryFee: number;           // AX
  slot?: number;              // user's slot number
  /** Filled by admin after match ends. */
  position?: number | null;
  /** AX prize awarded to user. */
  axWon?: number;
  /** True when admin refunded entry on cancellation. */
  refunded?: boolean;
};

const GAME_LABELS: Record<UserMatch["game"], string> = {
  freefire: "Free Fire",
  bgmi: "BGMI",
  stumble: "Stumble Guys",
  codm: "CODM",
};
export const gameLabel = (g: UserMatch["game"]) => GAME_LABELS[g];

const USER_MATCHES_SEED: UserMatch[] = [
  // LIVE
  { id: "l1", name: "Bermuda Blitz #17", game: "freefire", mode: "Bermuda (BR)", status: "live",      startTime: new Date(Date.now() - 10*60*1000).toISOString(), entryFee: 50, slot: 12 },
  // UPCOMING
  { id: "s1", name: "Bermuda Blitz #18", game: "freefire", mode: "Bermuda (BR)", status: "upcoming",  startTime: new Date(Date.now() + 2*60*60*1000 + 14*60*1000).toISOString(), entryFee: 50, slot: 22 },
  { id: "s2", name: "Lone Wolf Showdown", game: "freefire", mode: "Solo BR",     status: "upcoming",  startTime: new Date(Date.now() + 5*60*60*1000).toISOString(), entryFee: 30, slot: 3 },
  // COMPLETED
  { id: "h1", name: "Friday Frenzy",      game: "freefire", mode: "Solo BR",     status: "completed", startTime: new Date(Date.now() - 4*86_400_000).toISOString(),  entryFee: 30, position: 1,    axWon: 500 },
  { id: "h2", name: "Solo Sniper Cup",    game: "freefire", mode: "Clash 1v1",   status: "completed", startTime: new Date(Date.now() - 7*86_400_000).toISOString(),  entryFee: 100, position: 4,   axWon: 75 },
  { id: "h3", name: "Bermuda Blitz #14",  game: "freefire", mode: "Bermuda (BR)",status: "completed", startTime: new Date(Date.now() - 11*86_400_000).toISOString(), entryFee: 50, position: 18,   axWon: 0 },
  { id: "h4", name: "Duo Domination",     game: "freefire", mode: "Duo BR",      status: "completed", startTime: new Date(Date.now() - 14*86_400_000).toISOString(), entryFee: 40, position: 2,    axWon: 300 },
  { id: "h5", name: "Results Pending Cup", game: "freefire", mode: "Solo BR",    status: "completed", startTime: new Date(Date.now() - 1*86_400_000).toISOString(),  entryFee: 30, position: null, axWon: 0 },
  { id: "h6", name: "Cancelled Clash",    game: "freefire", mode: "Clash Squad", status: "cancelled", startTime: new Date(Date.now() - 2*86_400_000).toISOString(),  entryFee: 75, refunded: true },
];

// Legacy exports kept for any other consumer during migration.
export const DUMMY_LIVE      = USER_MATCHES_SEED.filter((m) => m.status === "live");
export const DUMMY_SCHEDULED = USER_MATCHES_SEED.filter((m) => m.status === "upcoming");
export const DUMMY_HISTORY   = USER_MATCHES_SEED.filter((m) => m.status === "completed");

/**
 * Fetch user's joined matches by status.
 * Replace with:
 *   const { data } = await supabase
 *     .from('match_registrations')
 *     .select('position, ax_won, slot, match:matches(*)')
 *     .eq('user_id', userId)
 *     .eq('match.status', status)
 *     .order('match.start_time', { ascending: status !== 'completed' });
 */
export async function fetchUserMatches(
  _userId: string | null | undefined,
  status: MatchStatus | "completed-or-cancelled",
): Promise<UserMatch[]> {
  await new Promise((r) => setTimeout(r, 250));
  const list = USER_MATCHES_SEED.filter((m) =>
    status === "completed-or-cancelled"
      ? m.status === "completed" || m.status === "cancelled"
      : m.status === status
  );
  // Upcoming = soonest first; History = most recent first.
  return list.sort((a, b) => {
    const ta = new Date(a.startTime).getTime();
    const tb = new Date(b.startTime).getTime();
    return status === "upcoming" || status === "live" ? ta - tb : tb - ta;
  });
}

/**
 * Subscribe to user's match registration + status changes.
 * Replace with a Supabase realtime channel that listens to:
 *   - match_registrations (filter user_id = uid)
 *   - matches             (filter id IN user's match_ids; status changes)
 * and calls onChange() so the UI re-fetches.
 */
export function subscribeToUserMatches(
  _userId: string | null | undefined,
  _onChange: () => void,
): () => void {
  // No-op in stub. Returns unsubscribe.
  return () => {};
}

// Seed transactions covering every kind/status so the UI shows the full system.
const now = Date.now();
const iso = (daysAgo: number, h = 14) =>
  new Date(now - daysAgo * 86_400_000).toISOString().slice(0, 16) + ":00";
/** ISO timestamp `hours` hours ago — used for the "fresh refund" 24h window demo. */
const isoHoursAgo = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
export const DUMMY_TX: Tx[] = [
  { id: "t0", kind: "deposit",     type: "credit", title: "AX Added",      subtitle: "via UPI",                amount: 1000, date: iso(0, 9), status: "pending" },
  { id: "t1", kind: "prize",       type: "credit", title: "Prize Won",     subtitle: "Friday Frenzy",          amount: 500,  date: iso(1),    status: "completed" },
  { id: "t2", kind: "match-entry", type: "debit",  title: "Match Entry",   subtitle: "Solo Sniper Cup",        amount: 30,   date: iso(2),    status: "completed" },
  { id: "tR", kind: "bonus",       type: "credit", title: "Match Refund",  subtitle: "Cancelled Clash",        amount: 75,   date: isoHoursAgo(6), status: "completed", reasonCode: "match_cancelled", matchId: "h6" },
  { id: "t3", kind: "deposit",     type: "credit", title: "AX Added",      subtitle: "via UPI",                amount: 200,  date: iso(3),    status: "completed" },
  { id: "t4", kind: "withdrawal",  type: "debit",  title: "Withdrawal",    subtitle: "to ****@ybl",            amount: 150,  date: iso(5),    status: "completed" },
  { id: "t5", kind: "withdrawal",  type: "debit",  title: "Withdrawal",    subtitle: "to ****@oksbi",          amount: 200,  date: iso(6),    status: "rejected", reason: "Invalid UPI ID — please check and retry." },
  { id: "t6", kind: "prize",       type: "credit", title: "Prize Won",     subtitle: "Duo Domination",         amount: 300,  date: iso(8),    status: "completed" },
  { id: "t7", kind: "bonus",       type: "credit", title: "Bonus Credit",  subtitle: "Welcome bonus",          amount: 50,   date: iso(10),   status: "completed" },
];

// ─── Leaderboard ───────────────────────────────────────────────────────────
/** A single row from the leaderboard. Mirrors the Supabase view shape. */
export type LeaderboardEntry = {
  userId: string;
  rank: number;
  name: string;
  /** Skill level label, e.g. "Champion", "Diamond". */
  level: string;
  matches: number;
  wins: number;
  /** AX earnings in the selected period. */
  ax: number;
  avatarUrl?: string;
};

export type LeaderboardPeriod = "week" | "month" | "all";

/** Per-period multipliers so the same seeded users feel like different boards. */
const PERIOD_MULT: Record<LeaderboardPeriod, number> = { week: 0.18, month: 0.55, all: 1 };

const LEVELS = ["Rookie", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion", "Legend"];

const LB_NAMES = [
  "Phantom","Ghost","Reaper","Nova","Blaze","Vortex","Saber","Echo","Onyx","Falcon",
  "ShadowOps","NovaX","ReaperZ","KnightOwl","SaberKing","FalconEye","ToxicRain","ApexLion",
  "RogueAce","SilentX","IronWolf","CobraStrike","ViperGod","RamboFF","NeonStorm","KaalSniper",
  "AlphaTitan","DesiGamer","NoScope","WolfPack","JetBlackX","Crimson","ZenithFF","Maverick",
  "ArclightX","Comet","Trident","NebulaOP","StormFox","Krait","HellBoy","DarkMoon",
  "Thunder99","MysticOP","GamerXY","BetaRay","RushHour","HackProof","RedMist","Phoenix",
];

/** Stable seeded board so rank/name pairings don't change between renders. */
const LEADERBOARD_SEED: LeaderboardEntry[] = LB_NAMES.map((name, i) => {
  const matches = 80 - i;
  const wins = Math.max(1, Math.round(matches * (0.55 - i * 0.008)));
  return {
    userId: `u${i + 1}`,
    rank: i + 1,                         // base ranking — re-sorted per period
    name: i < 10 ? name : `${name}${i}`,
    level: LEVELS[Math.min(LEVELS.length - 1, Math.floor((50 - i) / 7))],
    matches,
    wins,
    ax: Math.max(50, 5000 - i * 87),     // base AX in "all-time"
  };
});

// Legacy export.
export const DUMMY_LEADERBOARD = LEADERBOARD_SEED;

/** Last 5 matches per user — placement-based history shown in the profile sheet. */
export type PlayerMatchHistory = {
  matchId: string;
  name: string;
  mode: string;
  date: string;       // ISO
  position: number;
  axWon: number;
};

function seedHistory(userId: string): PlayerMatchHistory[] {
  // Deterministic per user so the sheet is stable.
  const seed = userId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const modes = ["Solo BR", "Duo BR", "Bermuda (BR)", "Clash Squad", "Kill Mode"];
  return Array.from({ length: 5 }).map((_, i) => {
    const pos = ((seed + i * 7) % 24) + 1;
    return {
      matchId: `${userId}-h${i}`,
      name: ["Friday Frenzy", "Bermuda Blitz", "Solo Sniper Cup", "Duo Domination", "Clash Cup"][i],
      mode: modes[(seed + i) % modes.length],
      date: new Date(Date.now() - (i + 1) * 86_400_000).toISOString(),
      position: pos,
      axWon: pos === 1 ? 500 : pos === 2 ? 300 : pos === 3 ? 150 : pos <= 10 ? 50 : 0,
    };
  });
}

export type PlayerProfile = LeaderboardEntry & {
  nickname: string;
  /** XP within current level, 0–1. */
  xpProgress: number;
  losses: number;
  /** Lifetime AX (across all periods). */
  lifetimeAx: number;
  history: PlayerMatchHistory[];
};


// ─── stub network functions ────────────────────────────────────────────────
// TODO(supabase): replace with `from('matches').select(...).eq('game', game)`
//   filtered by mode + status='open'. Keep the same Match shape so the UI
//   doesn't need to change. The artificial delay below simulates network
//   latency so the skeleton state is exercised in dev.
export async function fetchMatches(_game: string, _mode: string): Promise<Match[]> {
  await new Promise((r) => setTimeout(r, 650));
  return DUMMY_MATCHES;
}
const FF_NICKS = [
  "ShadowOps","NovaX","Phantom","ReaperZ","Blaze77","KnightOwl","VortexFF","SaberKing",
  "OnyxPro","FalconEye","GhostKill","EchoPlay","ToxicRain","NinjaJX","ApexLion","StormFox",
  "ZeroChill","RogueAce","HellBoy","SilentX","DarkMoon","IronWolf","Thunder99","CobraStrike",
  "ViperGod","MysticOP","RamboFF","GamerXY","NeonStorm","BetaRay","KaalSniper","RushHour",
  "AlphaTitan","DesiGamer","HackProof","NoScope","WolfPack","RedMist","JetBlackX","Crimson",
  "Phoenix","ZenithFF","Maverick","Krait","ArclightX","Comet","Trident","NebulaOP",
];
export async function fetchSlots(matchId: string): Promise<Slot[]> {
  const match = DUMMY_MATCHES.find((m) => m.id === matchId) ?? DUMMY_MATCHES[0];
  const total = match.slotsTotal;
  const filled = match.slotsFilled;
  const youAt = Math.min(5, filled - 1 < 0 ? 0 : filled - 1);
  const isKill = match.modeKind === "kill";
  return Array.from({ length: total }).map((_, i) => ({
    slot: i + 1,
    player: i >= filled ? "" : i === youAt ? "You" : FF_NICKS[i % FF_NICKS.length],
    isYou: i === youAt,
    kills: isKill && i < filled ? Math.floor(Math.random() * 12) : undefined,
  }));
}

/**
 * Fetch the prize template for a match. Replace with:
 *   const { data } = await supabase.from('match_prize_templates')
 *     .select('*').eq('match_id', matchId).single();
 */
export async function fetchPrizeTemplate(matchId: string): Promise<PrizeTemplate> {
  const match = DUMMY_MATCHES.find((m) => m.id === matchId) ?? DUMMY_MATCHES[0];
  const kind: ModeKind = match.modeKind ?? "br-squad";
  const tpl = DUMMY_PRIZE_TEMPLATES[kind];
  const totalPool = tpl.totalPool ?? (kind === "kill"
    ? match.slotsTotal * (match.killReward ?? tpl.killReward ?? 0)
    : tpl.rows.reduce((s, r) => s + r.prize, 0));
  return { ...tpl, totalPool, killReward: match.killReward ?? tpl.killReward };
}

/**
 * Top 3 prize positions for a match's linked prize template.
 * Returns [] when no template attached so the UI can fall back to total pool.
 * Replace with:
 *   supabase.from('match_prize_templates').select('rows').eq('match_id', id).single();
 */
export function getMatchPrizePreview(matchId: string): PrizeRow[] {
  const match = DUMMY_MATCHES.find((m) => m.id === matchId);
  if (!match) return [];
  const kind: ModeKind = match.modeKind ?? "br-squad";
  const tpl = DUMMY_PRIZE_TEMPLATES[kind];
  if (!tpl || tpl.rows.length === 0) return [];
  return tpl.rows.slice(0, 3);
}
export async function fetchMatchPrizePreview(matchId: string): Promise<PrizeRow[]> {
  return getMatchPrizePreview(matchId);
}

/** Match-specific rule chips. Replace with supabase select. */
export async function fetchCustomRules(matchId: string): Promise<string[]> {
  const match = DUMMY_MATCHES.find((m) => m.id === matchId);
  return match?.customRules ?? [];
}

/** Global platform rules (admin-editable). Replace with supabase select. */
export async function fetchPlatformRules(): Promise<string[]> {
  return PLATFORM_RULES;
}

/** Atomic join RPC stub. Replace with Supabase RPC. */
export async function joinMatch(_matchId: string): Promise<{ ok: true; slot: number }> {
  await new Promise((r) => setTimeout(r, 350));
  return { ok: true, slot: 1 };
}

/**
 * Stub: matches the current user is registered in. Used by JoinButton +
 * persistent countdown bar.
 *
 * Replace with:
 *   supabase.from('match_registrations').select('match_id').eq('user_id', uid)
 */
const USER_JOINED_MATCH_IDS = new Set<string>(["m1"]);

/**
 * Returns the user's nearest UPCOMING joined match (start_time > now and not
 * yet in declaring/live state). Returns null when there isn't one.
 *
 * Replace with:
 *   supabase.from('match_registrations')
 *     .select('match:matches(*)')
 *     .eq('user_id', userId)
 *     .gt('match.start_time', new Date().toISOString())
 *     .order('match.start_time', { ascending: true })
 *     .limit(1).single();
 */
export async function fetchUserUpcomingMatches(
  _userId: string | null | undefined,
): Promise<Match | null> {
  await new Promise((r) => setTimeout(r, 120));
  const now = Date.now();
  const upcoming = DUMMY_MATCHES
    .filter((m) => USER_JOINED_MATCH_IDS.has(m.id))
    .filter((m) => m.status !== "declaring_result")
    .filter((m) => new Date(m.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}

/**
 * Resolves the join button state for a given match + user. Priority order:
 *   joined → declaring → full → free → open
 *
 * Replace with a single Supabase RPC `check_join_status(match_id, user_id)` so
 * the priority logic lives server-side and can't drift between clients.
 */
export async function checkJoinStatus(
  matchId: string,
  _userId: string | null | undefined,
): Promise<JoinState> {
  await new Promise((r) => setTimeout(r, 80));
  const m = DUMMY_MATCHES.find((x) => x.id === matchId);
  if (!m) return "open";
  const isJoined = USER_JOINED_MATCH_IDS.has(matchId);
  if (isJoined) return "joined";
  if (m.status === "declaring_result") return "declaring";
  if (m.slotsFilled >= m.slotsTotal) return "full";
  if (m.isFree) return "free";
  return "open";
}
export async function revealRoomID(_matchId: string): Promise<{ roomId: string; password: string }> {
  return { roomId: "FF82471", password: "ARYZEN" };
}
export async function fetchLiveMatches() { return DUMMY_LIVE; }
export async function fetchScheduledMatches() { return DUMMY_SCHEDULED; }
export async function fetchMatchHistory() { return DUMMY_HISTORY; }
export async function viewRoom(_matchId: string) { return { ok: true }; }
/**
 * Fetch wallet transactions, optionally filtered.
 * Replace with: supabase.from('ax_transactions').select('*').order('date', desc).
 */
export type TxFilter = "all" | "credit" | "debit" | "pending";
export async function fetchTransactions(filter: TxFilter = "all"): Promise<Tx[]> {
  await new Promise((r) => setTimeout(r, 200));
  switch (filter) {
    case "credit":  return DUMMY_TX.filter((t) => t.type === "credit");
    case "debit":   return DUMMY_TX.filter((t) => t.type === "debit");
    case "pending": return DUMMY_TX.filter((t) => t.status === "pending");
    default:        return DUMMY_TX;
  }
}

/**
 * Live wallet balance. Replace with:
 *   supabase.from('profiles').select('ax_balance').eq('id', uid).single();
 *   + realtime subscription via subscribeToBalance().
 */
export async function fetchBalance(): Promise<number> {
  await new Promise((r) => setTimeout(r, 150));
  return 1240;
}

/**
 * Create a deposit request. Returns a request id once admin verification queues.
 * Replace with: supabase.from('deposits').insert({ user_id, amount_ax, status: 'pending' }).
 */
export async function createDepositRequest(amountAx: number): Promise<{ ok: true; id: string }> {
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true, id: `dep_${Date.now()}` };
}

/**
 * Request withdrawal. Server-side RPC deducts AX immediately into "pending".
 * Replace with: supabase.rpc('request_withdrawal', { amount_ax, upi_id, account_name }).
 */
export async function requestWithdrawal(
  amountAx: number,
  upiId: string,
  accountName: string,
): Promise<{ ok: true; id: string }> {
  await new Promise((r) => setTimeout(r, 500));
  return { ok: true, id: `wd_${Date.now()}` };
}

// Legacy aliases (kept so nothing else breaks during migration).
export const initiatePayment = (a: number) => createDepositRequest(a);
export const initiateWithdrawal = (upi: string, a: number) => requestWithdrawal(a, upi, "");
export async function fetchProfile() { return null; }
/**
 * Update user profile fields. Replace with:
 *   supabase.from('profiles').update({ display_name, game_uid }).eq('id', uid)
 */
export async function updateProfile(
  _displayName?: string,
  _gameUid?: string,
): Promise<{ ok: true }> {
  await new Promise((r) => setTimeout(r, 250));
  return { ok: true };
}

/**
 * Sum of all completed prize transactions for a user, returned in INR.
 * Replace with:
 *   supabase.rpc('get_total_earned_inr', { user_id: uid });
 */
export async function fetchTotalEarned(_userId: string | null | undefined): Promise<number> {
  await new Promise((r) => setTimeout(r, 150));
  const totalAx = DUMMY_TX
    .filter((t) => t.kind === "prize" && t.status === "completed")
    .reduce((s, t) => s + t.amount, 0);
  // axToInr is defined in lib/config but we avoid a circular import; inline ratio.
  return Math.round(totalAx / 10);
}
/**
 * Fetch leaderboard for a period.
 * Replace with:
 *   const { data } = await supabase
 *     .from('leaderboard_view')
 *     .select('user_id, name, level, matches, wins, ax_earned, avatar_url')
 *     .eq('period', period)
 *     .order('ax_earned', { ascending: false });
 */
export async function fetchLeaderboard(period: LeaderboardPeriod = "week"): Promise<LeaderboardEntry[]> {
  await new Promise((r) => setTimeout(r, 300));
  const mult = PERIOD_MULT[period];
  const scored = LEADERBOARD_SEED.map((p) => ({
    ...p,
    ax: Math.max(0, Math.round(p.ax * mult)),
    matches: Math.max(1, Math.round(p.matches * mult)),
    wins: Math.max(0, Math.round(p.wins * mult)),
  }));
  scored.sort((a, b) => b.ax - a.ax);
  return scored.map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Fetch a single player's full profile + last 5 matches.
 * Replace with two Supabase queries: profiles + match_registrations(JOIN matches).
 */
export async function fetchPlayerProfile(userId: string): Promise<PlayerProfile | null> {
  await new Promise((r) => setTimeout(r, 200));
  const base = LEADERBOARD_SEED.find((p) => p.userId === userId);
  if (!base) return null;
  const losses = Math.max(0, base.matches - base.wins);
  return {
    ...base,
    nickname: `@${base.name.toLowerCase()}`,
    xpProgress: ((base.userId.length * 17) % 100) / 100,
    losses,
    lifetimeAx: base.ax + 1500,        // pretend lifetime > current period
    history: seedHistory(base.userId),
  };
}

/**
 * Get current user's rank for a period. Returns null if unranked.
 * Replace with: supabase.rpc('get_user_rank', { user_id, period }).
 */
export async function getUserRank(
  userId: string | null | undefined,
  period: LeaderboardPeriod = "week",
): Promise<{ rank: number; entry: LeaderboardEntry } | null> {
  if (!userId) return null;
  const board = await fetchLeaderboard(period);
  // Stub: pretend the current user is rank #47 in the seeded board.
  const entry = board[46];
  if (!entry) return null;
  return { rank: entry.rank, entry: { ...entry, name: "You", userId } };
}
export async function verifyOTP(_phone: string, _code: string) { return { ok: true }; }

// ─── auth stubs (Cursor will wire these to Supabase) ───────────────────────
export async function createAuthWithPhone(_phone: string) {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true };
}
export async function createAuthWithEmail(_email: string) {
  await new Promise((r) => setTimeout(r, 600));
  return { ok: true };
}
export async function createAuthWithGoogle() {
  await new Promise((r) => setTimeout(r, 800));
  return { ok: true, email: "player@gmail.com", displayName: "Google Player" };
}
export async function saveGameUID(uid: string) {
  localStorage.setItem("aryzen.gameUid", uid);
  return { ok: true };
}

// ─── referrals ─────────────────────────────────────────────────────────────
/**
 * Referral system stubs.
 *
 * Supabase columns required (add via migration when wiring):
 *   profiles.referral_code   text unique  -- "NOVA1234" (nickname + 4 digits)
 *   profiles.referred_by     uuid null    -- references profiles.id
 *   profiles.referral_count  int  default 0
 *
 * Issued ticket row (table: tickets):
 *   { user_id, type: 'free_entry', scope: 'br', reason: 'referral', expires_at: null }
 *   scope 'br' = Bermuda Survival BR (solo/duo/squad).
 */

const REFERRAL_KEY = "aryzen.referral.v1";
type ReferralLocal = {
  myCode: string;
  referredBy: string | null;        // referrer's code
  referredByName: string | null;
  referralCount: number;
};

// Seed: a few demo codes so "apply" can validate against something.
// Replace with: supabase.from('profiles').select('referral_code, nickname').eq('referral_code', code).single();
const DEMO_REFERRAL_CODES: Record<string, string> = {
  NOVA1234: "Nova",
  PHANTOM7: "Phantom",
  REAPER42: "Reaper",
  BLAZE999: "Blaze",
};

function loadReferral(nickname?: string | null): ReferralLocal {
  try {
    const raw = localStorage.getItem(REFERRAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Generate deterministic-ish code: nickname + 4 random digits.
  const base = (nickname ?? "ARYZEN").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "ARYZEN";
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  const fresh: ReferralLocal = {
    myCode: `${base}${digits}`,
    referredBy: null,
    referredByName: null,
    referralCount: 0,
  };
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveReferral(r: ReferralLocal) {
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(r));
}

/**
 * Validates a referral code without applying it. Used for inline input feedback.
 * Replace with: supabase.from('profiles').select('id, nickname, referral_code')
 *   .eq('referral_code', code).maybeSingle();
 */
export async function validateReferralCode(
  code: string,
  ownCode: string | null,
): Promise<{ ok: boolean; nickname?: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 200));
  const c = code.trim().toUpperCase();
  if (!c) return { ok: false, error: "Enter a code" };
  if (ownCode && c === ownCode.toUpperCase()) {
    return { ok: false, error: "You can't use your own referral code" };
  }
  const nickname = DEMO_REFERRAL_CODES[c];
  if (!nickname) return { ok: false, error: "Invalid code" };
  return { ok: true, nickname };
}

/**
 * Apply a referral code to the current user. Issues a free BR ticket to both
 * referrer + referee, increments referrer's count, sets referred_by.
 *
 * Replace with Supabase RPC `apply_referral_code(p_user_id, p_code)`:
 *   1. select id, referral_code from profiles where referral_code = p_code
 *   2. assert profile.id <> p_user_id
 *   3. assert (select referred_by from profiles where id = p_user_id) is null
 *   4. update profiles set referred_by = referrer.id where id = p_user_id
 *   5. update profiles set referral_count = referral_count + 1 where id = referrer.id
 *   6. insert into tickets (user_id, type, scope, reason)
 *      values (p_user_id, 'free_entry', 'br', 'referral'),
 *             (referrer.id, 'free_entry', 'br', 'referral');
 */
export async function applyReferralCode(
  userId: string | null | undefined,
  code: string,
): Promise<{ ok: boolean; error?: string; nickname?: string }> {
  await new Promise((r) => setTimeout(r, 350));
  const local = loadReferral(userId);
  if (local.referredBy) {
    return { ok: false, error: `Already referred by ${local.referredByName ?? "a friend"}` };
  }
  const v = await validateReferralCode(code, local.myCode);
  if (!v.ok) return { ok: false, error: v.error };
  saveReferral({ ...local, referredBy: code.trim().toUpperCase(), referredByName: v.nickname ?? null });
  return { ok: true, nickname: v.nickname };
}

/**
 * Returns current user's referral stats + own code.
 * Replace with: supabase.from('profiles').select('referral_code, referral_count, referred_by')
 *   .eq('id', uid).single();
 */
export async function fetchReferralStats(
  userId: string | null | undefined,
): Promise<{ code: string; count: number; referredByName: string | null }> {
  await new Promise((r) => setTimeout(r, 150));
  const r = loadReferral(userId);
  return { code: r.myCode, count: r.referralCount, referredByName: r.referredByName };
}

/**
 * Open native share sheet with the referral code. Falls back to clipboard.
 * No Supabase hook — pure client.
 */
export async function shareReferralCode(code: string): Promise<{ shared: boolean }> {
  const text = `Join me on Aryzen Arena! Use my code ${code} when you sign up — we both get a free Bermuda Survival ticket. https://aryzen-arena.lovable.app`;
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: "Aryzen Arena", text });
      return { shared: true };
    } catch {
      // user cancelled or unsupported
    }
  }
  try {
    await navigator.clipboard?.writeText(text);
  } catch {}
  return { shared: false };
}

/**
 * Returns the current announcement to show on app launch, or null.
 * Replace with a Supabase call in Cursor (e.g. select * from announcements
 * where active=true order by created_at desc limit 1).
 */
export async function fetchAnnouncement(): Promise<Announcement | null> {
  return null;
}

// ─── Squad Team Code (Stubs) ───────────────────────────────────────────────
export type MatchTeam = {
  id: string;
  matchId: string;
  teamCode: string;
  teamNumber: number;
  leaderId: string;
  isLocked: boolean;
  maxSize: number;
  memberCount: number;
};

export type TeamMember = {
  userId: string;
  displayName: string;
  isLeader: boolean;
};

/**
 * Fetch all teams for a match.
 * Replace with: supabase.from('match_teams').select('*').eq('match_id', matchId)
 */
export async function fetchMatchTeams(_matchId: string): Promise<MatchTeam[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [];
}

/**
 * Create a new team/squad for a match.
 * Replace with: supabase.from('match_teams').insert({ match_id, leader_id, max_size, is_locked, ... })
 */
export async function createTeam(
  _matchId: string,
  _leaderId: string,
  _maxSize: number,
): Promise<MatchTeam> {
  await new Promise((r) => setTimeout(r, 300));
  return { id: "", matchId: _matchId, teamCode: "", teamNumber: 0, leaderId: _leaderId, isLocked: false, maxSize: _maxSize, memberCount: 1 };
}

/**
 * Join an unlocked team using team code.
 * Replace with: supabase.rpc('join_team_by_code', { p_user_id, p_team_code, ... })
 */
export async function joinTeamByCode(
  _userId: string,
  _teamCode: string,
): Promise<{ ok: true; team: MatchTeam }> {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, team: { id: "", matchId: "", teamCode: _teamCode, teamNumber: 0, leaderId: "", isLocked: false, maxSize: 0, memberCount: 0 } };
}

/**
 * Join an unlocked team directly without code.
 * Replace with: supabase.rpc('join_unlocked_team', { p_user_id, p_team_id, ... })
 */
export async function joinUnlockedTeam(
  _userId: string,
  _teamId: string,
): Promise<{ ok: true; team: MatchTeam }> {
  await new Promise((r) => setTimeout(r, 300));
  return { ok: true, team: { id: _teamId, matchId: "", teamCode: "", teamNumber: 0, leaderId: "", isLocked: false, maxSize: 0, memberCount: 0 } };
}

/**
 * Toggle team lock/unlock state (leader only).
 * Replace with: supabase.from('match_teams').update({ is_locked }).eq('id', teamId)
 */
export async function toggleTeamLock(
  _teamId: string,
  _isLocked: boolean,
): Promise<MatchTeam> {
  await new Promise((r) => setTimeout(r, 250));
  return { id: _teamId, matchId: "", teamCode: "", teamNumber: 0, leaderId: "", isLocked: _isLocked, maxSize: 0, memberCount: 0 };
}

/**
 * Fetch current user's team for a match (if joined).
 * Replace with: supabase.from('match_team_members').select('team:match_teams(*)').eq('user_id', userId).eq('team.match_id', matchId).single()
 */
export async function fetchUserTeam(
  _userId: string,
  _matchId: string,
): Promise<MatchTeam | null> {
  await new Promise((r) => setTimeout(r, 200));
  return null;
}

// ─── notifications (stubs) ─────────────────────────────────────────────────
/**
 * Notification kinds drive icon + colour + tap-target in the bell panel.
 * Wire to Supabase `notifications.type` column in Cursor.
 */
export type NotificationType =
  | "match_new"          // new match available
  | "prize"              // prize credited
  | "deposit"            // deposit confirmed
  | "withdrawal"         // withdrawal status update
  | "ticket"             // free ticket issued
  | "ban"                // ban / fair-play warning
  | "referral"           // referral reward
  | "match_result"       // your match result is ready
  | "match_cancelled"    // a joined match was cancelled
  | "broadcast";         // admin announcement

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO date */
  createdAt: string;
  read: boolean;
  /**
   * Optional in-app route to navigate to when the user taps the row.
   * e.g. "/app/match/m1", "/app/wallet?txId=...", "/app/matches?tab=history&matchId=h6"
   * Wire to Supabase `notifications.deeplink_path` column in Cursor.
   */
  deeplink?: string;
  /** Optional match id — used by resolveDeeplink() to auto-open the relevant match sheet. */
  matchId?: string;
};

/**
 * Map a notification to the in-app route it should open. Falls back to a
 * per-type default when the row has no explicit `deeplink`. Returns `null`
 * for notifications that should just close the panel (e.g. broadcasts).
 *
 * Wire to Supabase: replace the per-type defaults below with the
 * `notifications.deeplink_path` column when populated server-side.
 */
export function resolveDeeplink(n: Pick<Notification, "type" | "deeplink" | "matchId">): string | null {
  if (n.deeplink) return n.deeplink;
  const id = n.matchId;
  switch (n.type) {
    case "match_new":       return id ? `/app/match/${id}` : "/app";
    case "prize":           return "/app/wallet";
    case "deposit":         return "/app/wallet";
    case "withdrawal":      return "/app/wallet";
    case "ticket":          return "/app";
    case "referral":        return "/app/profile";
    case "match_result":    return `/app/matches?tab=history${id ? `&matchId=${id}` : ""}`;
    case "match_cancelled": return `/app/matches?tab=history${id ? `&matchId=${id}` : ""}`;
    case "ban":             return "/app/profile";
    case "broadcast":       return null;
    default:                return null;
  }
}

const NOTIFICATIONS_KEY = "aryzen.notifications.v2";

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "match_new",
    title: "New Free Fire Match Available!",
    body: "Bermuda Blitz #18 · Solo BR · Join now",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    deeplink: "/app/match/m1",
  },
  {
    id: "n2",
    type: "prize",
    title: "₹150 credited to your wallet!",
    body: "You finished 2nd in Bermuda Blitz #17",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: false,
    deeplink: "/app/wallet",
  },
  {
    id: "n3",
    type: "deposit",
    title: "₹50 added to your balance",
    body: "Deposit verified by admin",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
    deeplink: "/app/wallet",
  },
  {
    id: "n4",
    type: "withdrawal",
    title: "Withdrawal of ₹30 sent!",
    body: "Check your UPI within 24 hours",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    read: true,
    deeplink: "/app/wallet",
  },
  {
    id: "n5",
    type: "ticket",
    title: "You got a free match ticket!",
    body: "Valid for Bermuda Survival BR matches",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    read: true,
    deeplink: "/app",
  },
  {
    id: "n6",
    type: "referral",
    title: "Friend joined using your code!",
    body: "You both got a free Bermuda ticket",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
    deeplink: "/app/profile",
  },
  {
    id: "n7",
    type: "broadcast",
    title: "Server maintenance tonight",
    body: "Brief downtime expected between 2:00–2:15 AM IST.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    read: true,
  },
  {
    id: "n8",
    type: "ban",
    title: "Account Warning",
    body: "Fair play violation detected. UID: 123456789",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

function loadNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  return SEED_NOTIFICATIONS;
}

/**
 * Replace with: const { data } = await supabase.from('notifications')
 *   .select('*').eq('user_id', uid).order('created_at', { ascending: false });
 */
export async function fetchNotifications(): Promise<Notification[]> {
  await new Promise((r) => setTimeout(r, 200));
  return loadNotifications();
}

/**
 * Replace with: await supabase.from('notifications').update({ read: true }).eq('id', id);
 */
export async function markAsRead(id: string): Promise<{ ok: true }> {
  const list = loadNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  return { ok: true };
}

/**
 * Replace with: await supabase.from('notifications').update({ read: true }).eq('user_id', uid);
 */
export async function markAllAsRead(): Promise<{ ok: true }> {
  const list = loadNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  return { ok: true };
}

/**
 * Subscribe to realtime notification inserts for the current user (and
 * broadcasts where user_id IS NULL).
 *
 *   // Wire to Supabase realtime in Cursor:
 *   const channel = supabase
 *     .channel('notifications')
 *     .on('postgres_changes',
 *       { event: 'INSERT', schema: 'public', table: 'notifications',
 *         filter: `user_id=eq.${uid}` },
 *       (payload) => onNew(payload.new as Notification))
 *     .subscribe();
 *   return () => supabase.removeChannel(channel);
 */
export function subscribeToNotifications(
  _userId: string | null | undefined,
  _onNew: (n: Notification) => void,
): () => void {
  // No-op stub. Returns unsubscribe.
  return () => {};
}

// ─── persistent match bar (stubs) ─────────────────────────────────────────
/**
 * Lifecycle of the joined match the persistent bar should reflect.
 * Mirrors `matches.status` from Supabase.
 */
export type ActiveMatchStatus =
  | "upcoming"
  | "being_played"
  | "declaring_result"
  | "completed";

export type ActiveMatch = {
  id: string;
  name: string;
  /** ISO start time. */
  startTime: string;
  status: ActiveMatchStatus;
  /** Revealed by backend ~5 min before start (matches.room_revealed = true). */
  roomId?: string;
  roomPass?: string;
  /** When status flipped to declaring_result (drives the 5-min progress bar). */
  declaringSince?: string;
  /** When status flipped to completed (drives the 10s auto-dismiss on State E). */
  completedAt?: string;
};

/**
 * Returns the single match the persistent bar should track right now.
 * Priority: live (being_played) > declaring_result > completed (within 10s) >
 *           nearest upcoming joined match.
 *
 *   // Wire to Supabase in Cursor:
 *   const { data } = await supabase
 *     .from('match_registrations')
 *     .select('match:matches(id, title, start_time, status, room_id, room_pass, room_revealed, declaring_since, completed_at)')
 *     .eq('user_id', uid)
 *     .in('match.status', ['upcoming','being_played','declaring_result','completed'])
 *     .order('match.start_time', { ascending: true });
 */
export async function fetchUserActiveMatch(
  _userId: string | null | undefined,
): Promise<ActiveMatch | null> {
  await new Promise((r) => setTimeout(r, 80));
  const now = Date.now();
  const upcoming = DUMMY_MATCHES
    .filter((m) => USER_JOINED_MATCH_IDS.has(m.id))
    .filter((m) => new Date(m.date).getTime() > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!upcoming) return null;
  const ms = new Date(upcoming.date).getTime() - now;
  // Backend reveals room ~5 min before start.
  const reveal = ms <= 5 * 60_000;
  return {
    id: upcoming.id,
    name: upcoming.name,
    startTime: upcoming.date,
    status: "upcoming",
    roomId: reveal ? "FF82471" : undefined,
    roomPass: reveal ? "ARYZEN" : undefined,
  };
}

// ─── Match Result Sheet ────────────────────────────────────────────────────
/**
 * Mode-shape used by the result sheet. We collapse the granular ModeKind
 * into the two payout shapes the result UI needs:
 *   - "br":   placement-based prize pool
 *   - "kill": per-kill earnings + refundable entry
 * Anything else falls back to "br" since it's also placement-driven.
 */
export type ResultMatchMode = "br" | "kill";

export type ResultPlayer = {
  rank: number;
  nickname: string;
  isYou?: boolean;
  /** ₹ earnings for this player (prize + kill earnings combined). */
  earnings: number;
  /** Kills only matter for kill mode; UI ignores otherwise. */
  kills?: number;
};

export type MatchResult = {
  matchId: string;
  matchIdStr: string;       // human-friendly id shown in footer (e.g. ARY-00917)
  matchName: string;
  matchMode: ResultMatchMode;
  /** ₹ entry the user paid. For kill mode this is refunded. */
  entrySpent: number;
  /** ₹ refunded back (kill mode only; 0 otherwise). */
  entryRefunded: number;
  /** ₹ prize the user won by placement (0 if not in money). */
  prizeWon: number;
  /** ₹ kills × per-kill reward (kill mode only; 0 otherwise). */
  killEarnings: number;
  /** Sum of prizeWon + killEarnings + entryRefunded — the headline number. */
  userEarnings: number;
  /** User's final placement (1-based). */
  userPosition: number;
  /** User's kills, when kill mode. */
  userKills?: number;
  /** Top 10 leaderboard rows. May or may not include the user. */
  top10players: ResultPlayer[];
  /** Always present so the sticky "your row" can render even if rank > 10. */
  userRow: ResultPlayer;
};

/**
 * Stub — generates a deterministic-feeling result for a given match + user.
 * Replace with a Supabase query joining `match_results` + `match_registrations`:
 *
 *   const { data } = await supabase
 *     .from('match_results_view')
 *     .select('*')
 *     .eq('match_id', matchId)
 *     .single();
 */
export async function fetchMatchResults(
  matchId: string,
  _userId: string | null | undefined,
): Promise<MatchResult> {
  await new Promise((r) => setTimeout(r, 220));

  // Try to ground the stub in any real match data we already have.
  const m = DUMMY_MATCHES.find((x) => x.id === matchId);
  const userMatch = USER_MATCHES_SEED.find((x) => x.id === matchId);

  const kindRaw: ModeKind = m?.modeKind ?? "br-squad";
  const matchMode: ResultMatchMode = kindRaw === "kill" ? "kill" : "br";

  // Stable seed so the same match shows the same numbers across opens.
  const seed = matchId.split("").reduce((s, c) => s + c.charCodeAt(0), 7);
  const rand = (i: number, mod: number) => ((seed * 9301 + i * 49297) % 233280) % mod;

  const entryAx = m?.entryFee ?? userMatch?.entryFee ?? 50;
  const entrySpent = Math.round(entryAx / 10);     // ₹
  const userPosition = userMatch?.position ?? (rand(1, 24) + 1);

  // Prize ladder for BR mode (₹). Mirrors common payout shapes.
  const brPrize = (rank: number): number => {
    if (matchMode !== "br") return 0;
    if (rank === 1) return 150;
    if (rank === 2) return 80;
    if (rank === 3) return 50;
    if (rank <= 5)  return 25;
    if (rank <= 10) return 12;
    return 0;
  };

  const userKills = matchMode === "kill" ? (rand(2, 14) + 1) : undefined;
  const killEarnings = matchMode === "kill" ? (userKills! * 1) : 0;     // ₹1 per kill
  const entryRefunded = matchMode === "kill" ? entrySpent : 0;
  const prizeWon = matchMode === "br" ? brPrize(userPosition) : 0;
  const userEarnings = prizeWon + killEarnings + entryRefunded;

  // Build top 10 — generate plausible nicknames + earnings.
  const pool = FF_NICKS;
  const top10players: ResultPlayer[] = Array.from({ length: 10 }).map((_, i) => {
    const rank = i + 1;
    const nick = pool[(seed + i * 13) % pool.length];
    const kills = matchMode === "kill" ? Math.max(0, 18 - i - rand(i + 3, 4)) : undefined;
    const earnings = matchMode === "br"
      ? brPrize(rank)
      : (kills ?? 0) * 1 + entrySpent;
    const isYou = rank === userPosition;
    return {
      rank,
      nickname: isYou ? "You" : nick,
      isYou,
      earnings,
      kills,
    };
  });

  const userRow: ResultPlayer = userPosition <= 10
    ? top10players[userPosition - 1]
    : {
        rank: userPosition,
        nickname: "You",
        isYou: true,
        earnings: userEarnings,
        kills: userKills,
      };

  // Make sure the user row inside top 10 reflects "You" + accurate earnings.
  if (userPosition <= 10) {
    top10players[userPosition - 1] = {
      ...top10players[userPosition - 1],
      nickname: "You",
      isYou: true,
      earnings: userEarnings,
      kills: userKills,
    };
  }

  // Human-friendly match id shown in the footer.
  const matchIdStr = `ARY-${(seed % 90000 + 10000).toString()}`;

  return {
    matchId,
    matchIdStr,
    matchName: m?.name ?? userMatch?.name ?? "Match",
    matchMode,
    entrySpent,
    entryRefunded,
    prizeWon,
    killEarnings,
    userEarnings,
    userPosition,
    userKills,
    top10players,
    userRow,
  };
}

/**
 * Build the share text for a finished match. Pure client — no backend call.
 * Used by the result sheet's share icon. Tries native share, falls back to
 * clipboard (toast handled by caller).
 */
export function buildMatchResultShareText(r: MatchResult): string {
  const APP_URL = "https://aryzen.app"; // TODO: replace with real marketing URL.
  if (r.userEarnings > 0) {
    return [
      `🏆 Just won ₹${r.userEarnings} on Aryzen!`,
      `Finished #${r.userPosition} in ${r.matchName}.`,
      `Play real-money matches & win daily → ${APP_URL}`,
    ].join("\n");
  }
  return [
    `Just played ${r.matchName} on Aryzen — finished #${r.userPosition}.`,
    `Join me, win real money in your next match → ${APP_URL}`,
  ].join("\n");
}

export async function shareMatchResult(r: MatchResult): Promise<{ shared: boolean }> {
  const text = buildMatchResultShareText(r);
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share({ title: "Aryzen Arena", text });
      return { shared: true };
    } catch { /* user cancelled */ }
  }
  try { await navigator.clipboard?.writeText(text); } catch {}
  return { shared: false };
}

/**
 * Subscribe to status changes for a single match so the persistent bar can
 * auto-transition between states (upcoming → being_played → declaring_result
 * → completed) without manual re-fetch.
 *
 *   // Wire to Supabase realtime in Cursor:
 *   const channel = supabase
 *     .channel(`match:${matchId}`)
 *     .on('postgres_changes',
 *       { event: 'UPDATE', schema: 'public', table: 'matches',
 *         filter: `id=eq.${matchId}` },
 *       (payload) => onChange(payload.new as ActiveMatch))
 *     .subscribe();
 *   return () => supabase.removeChannel(channel);
 */
export function subscribeToMatchStatus(
  _matchId: string,
  _onChange: (m: ActiveMatch) => void,
): () => void {
  // No-op stub. Returns unsubscribe.
  return () => {};
}

// ─── Cancelled match details ──────────────────────────────────────────────
/**
 * Detail payload for a cancelled match — shown in the History → cancelled card sheet.
 * Replace with:
 *   SELECT m.name AS title, m.mode, m.slots_filled, m.slots_total,
 *          m.rules AS cancellation_reason,
 *          m.entry_fee_paise, r.refund_tx_id
 *   FROM matches m
 *   JOIN match_registrations r ON r.match_id = m.id AND r.user_id = :uid
 *   WHERE m.id = :matchId AND m.status = 'cancelled'
 */
export type CancelledMatchDetails = {
  matchId: string;
  title: string;
  mode: string;
  filledSlots: number;
  totalSlots: number;
  /** Free-text reason set by admin on cancellation (mirrors `match.rules`). */
  cancellationReason: string;
  /** Original entry fee in paise (smallest unit). 0 = free match, refund row hidden. */
  entryFeePaise: number;
  /** Tx id of the refund row in ax_transactions. `null` when entry was 0. */
  refundTransactionId: string | null;
};

export async function fetchCancelledMatchDetails(
  matchId: string,
  _userId: string | null | undefined,
): Promise<CancelledMatchDetails | null> {
  await new Promise((r) => setTimeout(r, 180));
  const m = USER_MATCHES_SEED.find((x) => x.id === matchId && x.status === "cancelled");
  if (!m) return null;
  // Find the linked refund tx, if any. In Supabase this is a FK join.
  const refundTx = DUMMY_TX.find(
    (t) => t.reasonCode === "match_cancelled" && t.matchId === matchId,
  );
  // Demo slot fill — admin-driven in production.
  const totalSlots = 32;
  const filledSlots = 15;
  return {
    matchId,
    title: m.name,
    mode: m.mode,
    filledSlots,
    totalSlots,
    cancellationReason:
      "Not enough players joined before the start time. Match was called off by admin.",
    entryFeePaise: m.entryFee * 100, // 1 AX = ₹1 in this app; paise for API parity.
    refundTransactionId: refundTx?.id ?? null,
  };
}
