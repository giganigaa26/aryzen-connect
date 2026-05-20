// ─────────────────────────────────────────────────────────────────────────────
// Aryzen — Theme palettes (accent-only, dark-only model).
//
// CRITICAL DESIGN RULE:
//   The app is DARK-ONLY. Surfaces (background, card, foreground, border)
//   stay locked to the dark palette across every theme. Themes ONLY swap the
//   accent tokens (--primary, --accent, --ring) so the brand "vibe" changes
//   while the chrome stays consistent.
//
// Each palette has a unique `id` that maps to a `[data-theme="<id>"]` block
// in src/index.css. The Theme screen reads from this list to render previews.
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = "dark"; // dark-only — kept as a type for back-compat
export type PaletteId =
  | "system"
  | "midnight"
  | "sakura"
  | "ocean"
  | "forest"
  | "freefire";

export type Palette = {
  id: PaletteId;
  label: string;
  description: string;
  // Preview swatches (HSL strings — used inline for chips on the Theme screen).
  // All backgrounds are dark; only the accent shifts.
  preview: {
    bg: string;       // sample surface for the preview card (dark)
    card: string;     // inner mini-card (dark)
    primary: string;  // brand accent
    accent: string;   // secondary accent
  };
};

// Shared dark surface values — matches the .dark block in src/index.css.
const DARK_BG = "0 0% 7%";
const DARK_CARD = "0 0% 12%";

export const PALETTES: Palette[] = [
  {
    id: "system",
    label: "System",
    description: "Default. Aryzen red.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "0 72% 55%", accent: "0 72% 55%" },
  },
  {
    id: "midnight",
    label: "Vapor",
    description: "Vibrant neon purple.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "283 99% 54%", accent: "283 99% 60%" },
  },
  {
    id: "sakura",
    label: "Sakura",
    description: "Soft pink. Calm energy.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "330 81% 68%", accent: "340 82% 78%" },
  },
  {
    id: "ocean",
    label: "Cobalt",
    description: "Cool blue & cyan.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "199 89% 58%", accent: "187 85% 55%" },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Fresh emerald greens.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "160 70% 45%", accent: "152 60% 55%" },
  },
  {
    id: "freefire",
    label: "Free Fire",
    description: "Official Free Fire orange.",
    preview: { bg: DARK_BG, card: DARK_CARD, primary: "36 100% 51%", accent: "36 100% 58%" },
  },
];

export const DEFAULT_PALETTE: PaletteId = "system";
export const DEFAULT_MODE: ThemeMode = "dark";
