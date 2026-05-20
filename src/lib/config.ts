// ─────────────────────────────────────────────────────────────────────────────
// Aryzen — central config for content that may change without a code update.
// Edit values here (logos, text, mode lists, tier thresholds, payouts, etc.)
// without touching feature components.
// ─────────────────────────────────────────────────────────────────────────────

// Brand / app identity. logoUrl is dynamic — paste the real Aryzen logo URL
// here (or set it from a remote-config call) and the <AppLogo /> component
// will pick it up everywhere (splash, welcome, app header).
export const APP_CONFIG = {
  name: "Aryzen",
  tagline: "Dominate. Compete. Win.",
  // TODO: paste actual Aryzen logo URL here. Empty = falls back to "A" mark.
  logoUrl: "",
  logoMark: "",
  supportEmail: "support@aryzen.app",
  supportWhatsapp: "+91 00000 00000",
};

// Languages supported in onboarding. Add/remove freely; the picker renders
// whatever lives in this list. `flag` is an emoji used as a quick visual cue.
export type LangCode = "en" | "hi" | "gu" | "pa" | "ta" | "te" | "bn";
export const LANGUAGES: { code: LangCode; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English",   native: "English",   flag: "🇬🇧" },
  { code: "hi", label: "Hindi",     native: "हिन्दी",      flag: "🇮🇳" },
  { code: "gu", label: "Gujarati",  native: "ગુજરાતી",   flag: "🇮🇳" },
  { code: "pa", label: "Punjabi",   native: "ਪੰਜਾਬੀ",     flag: "🇮🇳" },
  { code: "ta", label: "Tamil",     native: "தமிழ்",     flag: "🇮🇳" },
  { code: "te", label: "Telugu",    native: "తెలుగు",    flag: "🇮🇳" },
  { code: "bn", label: "Bengali",   native: "বাংলা",     flag: "🇮🇳" },
];

// Game catalogue — edit names, swap gameImageUrl, toggle `active` to gate access.
// `accent` drives the soft tint behind the icon tile (semantic tokens only).
//
// gameImageUrl: dynamic. Replace with Supabase Storage URL in Cursor.
//   Empty = falls back to short-code badge so the UI never breaks.
export type Game = {
  id: "freefire" | "bgmi" | "stumble" | "codm";
  name: string;
  short: string;
  count: number;          // # of live/scheduled matches (admin-driven)
  accent: string;         // tailwind classes for icon tile
  active: boolean;
  gameImageUrl: string;   // TODO: Replace with Supabase Storage URL in Cursor
  /** @deprecated use gameImageUrl */
  iconUrl?: string;
};

export const GAMES: Game[] = [
  { id: "freefire", name: "Free Fire",    short: "FF",  count: 4, accent: "bg-warning/15 text-warning",  active: true,  gameImageUrl: "" },
  { id: "bgmi",     name: "BGMI",         short: "BG",  count: 0, accent: "bg-success/15 text-success",  active: false, gameImageUrl: "" },
  { id: "stumble",  name: "Stumble Guys", short: "SG",  count: 0, accent: "bg-accent/15 text-accent",    active: false, gameImageUrl: "" },
  { id: "codm",     name: "CODM",         short: "CD",  count: 0, accent: "bg-primary/15 text-primary",  active: false, gameImageUrl: "" },
];

// Game modes — `playersPerSlot` defines room layout (drives the FF-style grid).
// `kind` describes the table/scoring shape (admin-driven). modeImageUrl is dynamic.
export type ModeKind = "br-solo" | "br-duo" | "br-squad" | "kill" | "cs-4v4" | "cs-1v1" | "custom";

export type GameMode = {
  id: string;
  label: string;
  short?: string;
  slots: number;          // total slots in a room (admin can override per match)
  playersPerSlot: number; // 1 = solo, 2 = duo, 4 = squad
  kind?: ModeKind;        // drives players-table layout & prize template type
  modeImageUrl?: string;  // TODO: Replace with Supabase Storage URL in Cursor
};

// Per-game mode catalogues. The "all" pill is added by the UI automatically.
export const MODES_BY_GAME: Record<Game["id"], GameMode[]> = {
  freefire: [
    { id: "solo-br",     label: "Solo BR",       short: "Solo BR", slots: 48, playersPerSlot: 1, kind: "br-solo" },
    { id: "duo-br",      label: "Duo BR",        short: "Duo BR",  slots: 48, playersPerSlot: 2, kind: "br-duo" },
    { id: "bermuda",     label: "Bermuda (BR)",  short: "BR",      slots: 48, playersPerSlot: 4, kind: "br-squad" },
    { id: "clash-squad", label: "Clash Squad",   short: "CS 4v4",  slots: 8,  playersPerSlot: 4, kind: "cs-4v4" },
    { id: "cs-1v1",      label: "Clash 1v1",     short: "1v1",     slots: 2,  playersPerSlot: 1, kind: "cs-1v1" },
    { id: "kill-mode",   label: "Kill Mode",     short: "Kills",   slots: 48, playersPerSlot: 1, kind: "kill" },
    { id: "lone-wolf",   label: "Lone Wolf",     short: "LW",      slots: 4,  playersPerSlot: 1, kind: "br-solo" },
    { id: "others",      label: "Others",        slots: 16, playersPerSlot: 1, kind: "custom" },
  ],
  bgmi: [
    { id: "solo",      label: "Solo",        short: "Solo", slots: 100, playersPerSlot: 1, kind: "br-solo" },
    { id: "duo",       label: "Duo",         short: "Duo",  slots: 100, playersPerSlot: 2, kind: "br-duo" },
    { id: "squad",     label: "Squad",       short: "Squad",slots: 100, playersPerSlot: 4, kind: "br-squad" },
    { id: "tdm",       label: "TDM",         short: "TDM",  slots: 8,   playersPerSlot: 4, kind: "cs-4v4" },
  ],
  stumble: [
    { id: "knockout",  label: "Knockout",    short: "KO",   slots: 32, playersPerSlot: 1, kind: "br-solo" },
    { id: "party",     label: "Party",       short: "Party",slots: 16, playersPerSlot: 1, kind: "custom" },
  ],
  codm: [
    { id: "br-solo",   label: "BR Solo",     short: "Solo", slots: 100, playersPerSlot: 1, kind: "br-solo" },
    { id: "br-squad",  label: "BR Squad",    short: "Squad",slots: 100, playersPerSlot: 4, kind: "br-squad" },
    { id: "tdm",       label: "TDM",         short: "TDM",  slots: 10,  playersPerSlot: 5, kind: "cs-4v4" },
    { id: "snd",       label: "Search & Destroy", short: "S&D", slots: 10, playersPerSlot: 5, kind: "cs-4v4" },
  ],
};

// Backwards-compat: existing imports of FF_MODES still work.
export const FF_MODES: GameMode[] = [
  { id: "all", label: "All", slots: 0, playersPerSlot: 0 },
  ...MODES_BY_GAME.freefire,
];

// Player skill tiers — shown next to nicknames. Edit thresholds freely.
export const TIERS = [
  { id: "bronze",   label: "Bronze",   minWins: 0,   color: "text-[#a16207]", bg: "bg-[#a16207]/15" },
  { id: "silver",   label: "Silver",   minWins: 10,  color: "text-muted-foreground", bg: "bg-muted" },
  { id: "gold",     label: "Gold",     minWins: 25,  color: "text-warning",   bg: "bg-warning/15" },
  { id: "platinum", label: "Platinum", minWins: 60,  color: "text-accent",    bg: "bg-accent/15" },
  { id: "diamond",  label: "Diamond",  minWins: 120, color: "text-primary",   bg: "bg-primary/15" },
] as const;

export function tierForWins(wins: number) {
  return [...TIERS].reverse().find((t) => wins >= t.minWins) ?? TIERS[0];
}

// Referral programme
export const REFERRAL = {
  rewardReferrer: 50,
  rewardReferee:  25,
  shareTemplate: (code: string) =>
    `Join me on Aryzen and get ${REFERRAL.rewardReferee} AX free. Use code ${code} → https://aryzen.app/r/${code}`,
};

// KYC requirements (used for withdrawal gating)
export const KYC = {
  required: true,
  minWithdrawal: 100,
  documents: ["Aadhaar", "PAN"] as const,
};

// Match-room countdown ring (seconds before start when reveal becomes hot)
export const ROOM_REVEAL = {
  unlockSecondsBefore: 5 * 60,
  ringSize: 44,
};

// ─── Wallet / payments config ────────────────────────────────────────────
// All money-flow knobs live here so admin can tune without a code edit.
// Real source of truth will be a Supabase `wallet_settings` row in Cursor.
export const WALLET = {
  axPerInr: 10,                  // internal: 1 ₹ = 10 AX (ledger unit)
  // User-facing limits — all in ₹ (rupees). Any whole-rupee amount allowed.
  minAddInr: 10,                 // min deposit in ₹
  maxAddInr: 1_000,              // max deposit per request in ₹
  minWithdrawInr: 10,            // min withdrawal in ₹
  stepInr: 1,                    // amounts must be multiples of this (₹)
  // Legacy AX-denominated fields (kept for back-compat with any consumer).
  minAdd: 100,                   // = minAddInr * axPerInr
  maxAdd: 10_000,
  minWithdraw: 100,
  step: 10,
  // Daily processing window (IST). Off-hours requests still queue.
  processingHours: { startHour: 11, endHour: 12, tz: "IST" },
  // Payment receiver — admin-driven. Replace with Supabase Storage URL.
  upiId: "aryzen@fampay",
  upiName: "Aryzen Esports",
  paymentQrUrl: "",              // TODO: hosted QR image URL
};

/** AX → INR helper. */
export const axToInr = (ax: number) => Math.round((ax / WALLET.axPerInr) * 100) / 100;
/** INR → AX helper. */
export const inrToAx = (inr: number) => Math.round(inr * WALLET.axPerInr);

