import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Trophy, Users, Clock, ChevronRight } from "lucide-react";
import { checkJoinStatus, fetchMatches, type Match, type JoinState } from "@/lib/stubs";
import { GAMES, MODES_BY_GAME, APP_CONFIG, axToInr, type Game } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AnimatedProgress } from "@/components/AnimatedProgress";
import { MatchCardSkeleton } from "@/components/MatchCardSkeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { AppLogo } from "@/components/AppLogo";
import { JoinButton } from "@/components/JoinButton";
import { HeaderBell } from "@/components/HeaderBell";
import { useAuth } from "@/contexts/AuthContext";

// TODO: Replace with live wallet balance from Supabase in Cursor.
const WALLET_BALANCE = 1240;

export default function Home() {
  const nav = useNavigate();
  const [game, setGame] = useState<Game["id"]>("freefire");

  // Active game's modes — prefixed with "All" for the unfiltered view.
  const modes = useMemo(
    () => [{ id: "all", label: "All", short: "All", slots: 0, playersPerSlot: 0 }, ...MODES_BY_GAME[game]],
    [game]
  );
  const [modeId, setModeId] = useState<string>("all");

  const activeMode = modes.find((m) => m.id === modeId) ?? modes[0];
  const activeGame = GAMES.find((g) => g.id === game);

  // Match list — fetched via stub (artificial delay) so the skeleton state
  // gets exercised. TODO(supabase): swap fetchMatches for a realtime query.
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (game !== "freefire") {
      setMatches([]);
      setIsLoading(false);
      return;
    }
    let alive = true;
    setIsLoading(true);
    fetchMatches(game, modeId).then((rows) => {
      if (!alive) return;
      setMatches(rows);
      setIsLoading(false);
    });
    return () => { alive = false; };
  }, [game, modeId]);

  const filtered = useMemo(
    () =>
      game === "freefire"
        ? matches.filter((m) => m.game === game && (modeId === "all" || m.mode === activeMode.label))
        : [],
    [matches, game, modeId, activeMode.label],
  );

  const balance = useCountUp(WALLET_BALANCE, 700);

  // Notifications panel + unread badge are now shared globally via
  // NotificationsContext (mounted in AppLayout). HeaderBell handles both.

  return (
    <>
      {/* Header — logo + name on the left, AX balance pill (now bolder &
          larger) + notifications bell with unread badge on the right. */}
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="h-14 px-4 flex items-center justify-between gap-2">
          <button
            onClick={() => nav("/app/profile")}
            className="press flex items-center gap-2 min-w-0"
          >
            <AppLogo size={32} rounded="rounded-lg" />
            <span className="text-lg font-extrabold tracking-tight truncate">
              {APP_CONFIG.name}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("/app/wallet")}
              className="press inline-flex items-center gap-1.5 h-10 px-3 rounded-full bg-secondary border border-border"
              aria-label="Wallet balance"
            >
              <span className="text-base font-extrabold tabular-nums leading-none">
                ₹{axToInr(balance).toLocaleString()}
              </span>
            </button>
            <HeaderBell />
          </div>
        </div>
      </header>

      {/* Game selector — image-first cards, no blur, theme-aware scroll fade. */}
      <section className="pt-4">
        <div className="px-4 flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Choose Game
          </h2>
        </div>
        <div className="scroll-fade-x">
          <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {GAMES.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                selected={game === g.id}
                onClick={() => {
                  // Game selector is a FILTER, not navigation. Tapping a game
                  // updates the match list below; it never changes screens.
                  setGame(g.id);
                  setModeId("all");
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mode selector — flat chip rail. Horizontally scrollable with
          1.25rem inline padding so end chips never kiss the edge, and a
          mask-image fade hints at off-screen chips. Active chip uses the
          theme accent so it tracks the user's chosen palette. */}
      <section className="mt-5">
        <div className="px-4 flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Mode
          </h2>
        </div>
        <div className="scroll-mask-x no-scrollbar overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {modes.map((m) => {
              const isSel = modeId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setModeId(m.id)}
                  title={m.label}
                  className={cn(
                    "press shrink-0 px-3.5 h-9 rounded-full text-sm font-semibold transition-colors whitespace-nowrap max-w-[180px] border",
                    isSel
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                  )}
                >
                  <span className="block truncate">
                    {isSel && m.short ? m.short : m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Match list */}
      <section className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {game === "freefire"
              ? isLoading
                ? "Loading matches…"
                : `${filtered.length} ${filtered.length === 1 ? "match" : "matches"}`
              : "Matches"}
          </h2>
        </div>

        {/* Coming-soon empty state for non-FF games */}
        {game !== "freefire" && (
          <ComingSoonCard gameName={activeGame?.name ?? "this game"} />
        )}

        {/* Skeleton list while fetching */}
        {game === "freefire" && isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </div>
        )}

        {game === "freefire" && !isLoading && filtered.length === 0 && (
          <NoMatchesCard />
        )}

        {game === "freefire" && !isLoading && filtered.length > 0 && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
            className="space-y-3"
          >
            {filtered.map((m) => (
              <motion.div
                key={m.id}
                className="cv-auto"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
                }}
              >
                <MatchCard match={m} onDetails={() => nav(`/app/match/${m.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/**
 * GameCard — image-first tile.
 * - Clean image area, NO blur/glow overlay.
 * - "Coming Soon" badge in TOP-RIGHT corner, ~80% size.
 * - Selecting a card just FILTERS the match list — no navigation.
 */
function GameCard({ game, selected, onClick }: { game: Game; selected: boolean; onClick: () => void }) {
  const hasMatches = game.count > 0;
  // Backwards-compat: prefer gameImageUrl, fall back to legacy iconUrl.
  const img = game.gameImageUrl || game.iconUrl || "";
  return (
    <button
      onClick={onClick}
      className={cn(
        "press relative shrink-0 w-[140px] snap-start rounded-2xl border-2 bg-card text-left overflow-hidden transition-colors",
        selected ? "border-primary" : "border-border"
      )}
    >
      {/* Image area — clean, no overlay. Replace with Supabase Storage URL in Cursor. */}
      <div className={cn("aspect-[4/3] w-full flex items-center justify-center", game.accent)}>
        {img ? (
          <img src={img} alt={game.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-extrabold tracking-tight">{game.short}</span>
        )}
      </div>

      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            hasMatches ? "bg-success animate-pulse" : "bg-muted-foreground/40"
          )} />
          <div className="font-semibold text-sm leading-tight truncate">{game.name}</div>
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {hasMatches ? `${game.count} live` : "No matches"}
        </div>
      </div>

      {/* Coming Soon badge — top-right, ~80% size of previous centered chip. */}
      {!game.active && (
        <span className="absolute top-1.5 right-1.5 text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-warning text-warning-foreground shadow-sm">
          Soon
        </span>
      )}
    </button>
  );
}

/** Empty state shown when a non-Free-Fire game is selected. */
function ComingSoonCard({ gameName }: { gameName: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 px-5 py-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-warning/15 flex items-center justify-center mb-3">
        <Clock size={20} className="text-warning" />
      </div>
      <h3 className="font-extrabold text-base">No matches yet</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {gameName} tournaments are coming soon. Stay tuned!
      </p>
    </div>
  );
}

/** Empty state shown when Free Fire has zero matches in the active mode. */
function NoMatchesCard() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 px-5 py-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Trophy size={20} className="text-muted-foreground" />
      </div>
      <h3 className="font-extrabold text-base">No matches in this mode</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Try a different mode or check back shortly.
      </p>
    </div>
  );
}

/**
 * MatchCard — admin-driven info-rich card.
 * - Top pills: mode category (Solo/Duo/Squad/...) + map name (from admin).
 * - Live-updating countdown ("Starts in 1h 23m") that ticks every minute,
 *   replaced by a pulsing "LIVE NOW" badge once the match is live.
 * - Spots row sized up; progress bar shifts green → yellow → red.
 * - Footer (replaces entry-fee block) shows top 3 prizes pulled from the
 *   linked prize template; falls back to total prize pool when no template.
 */
export function MatchCard({ match, onDetails }: { match: Match; onDetails?: () => void }) {
  const pct = Math.round((match.slotsFilled / match.slotsTotal) * 100);
  const spotsLeft = match.slotsTotal - match.slotsFilled;
  const startMs = new Date(match.date).getTime();
  const isFull = match.slotsFilled >= match.slotsTotal;
  const urgency = urgencyFor(pct, isFull);

  // Tick every minute so the countdown stays fresh without re-rendering more
  // than necessary. Replace with realtime status updates from Supabase.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const isLive = startMs - now <= 0;
  // Timing display:
  // - Admin panel sets `match.date` as an ISO timestamp (UTC).
  // - We render it as a fixed local clock time ("Starts at 9:00 PM") instead
  //   of a relative countdown so the label doesn't shift while the user
  //   scrolls. Uses the device locale + timezone via Intl.DateTimeFormat.
  // - When wiring to Supabase, keep storing UTC ISO and let the client format.
  const startsAt = formatStartTime(startMs);

  const modeCategory = categoryFromMode(match);
  const prizePool = match.entryFee * match.slotsTotal;

  // Resolve join state so the footer can swap between
  // "View details & Join >" (open/free) and the JoinButton (joined/declaring/full).
  const { currentUser } = useAuth();
  const [joinState, setJoinState] = useState<JoinState>("open");
  useEffect(() => {
    let alive = true;
    checkJoinStatus(match.id, currentUser?.phone ?? null).then((s) => {
      if (alive) setJoinState(s);
    });
    return () => { alive = false; };
  }, [match.id, match.status, match.slotsFilled, match.isFree, currentUser?.phone]);
  const showViewDetails = joinState === "open" || joinState === "free";

  // Progress bar color shifts based on fill ratio.
  const barClass =
    pct >= 80 ? "bg-destructive" : pct >= 50 ? "bg-warning" : "bg-success";

  const isDeclaring = match.status === "declaring_result";

  return (
    <div className="space-y-1.5">
      <div
        role={onDetails ? "button" : undefined}
        tabIndex={onDetails ? 0 : undefined}
        onClick={onDetails}
        onKeyDown={(e) => {
          if (!onDetails) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onDetails();
          }
        }}
        className={cn(
          "press-card bg-card rounded-2xl border border-border overflow-hidden shadow-sm cursor-pointer",
          isDeclaring && "declaring-glow",
        )}
      >
      <div className="flex gap-4 p-4">
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Pills row: mode category + map name. */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
              {modeCategory}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-secondary text-muted-foreground">
              {match.mode}
            </span>
          </div>

          {/* Match name */}
          <h3 className="mt-1.5 font-extrabold text-[16px] leading-tight line-clamp-2">
            {match.name}
          </h3>

          {/* Status badge / fixed start time / live badge */}
          <div className="mt-1.5">
            {isDeclaring ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-warning/15 text-warning animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                Declaring Results
              </span>
            ) : isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-destructive/10 text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                Live now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Clock size={12} />
                Starts at {startsAt}
              </span>
            )}
          </div>

          {/* Prize pool — HERO */}
          <div className="mt-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Prize Pool
            </div>
            <div className="text-success font-extrabold text-2xl leading-none tabular-nums mt-1">
              ₹{axToInr(prizePool).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right column: mode/map image — 20% larger than before (24 → 28). */}
        <div className="shrink-0">
          <div className="h-28 w-28 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center">
            {match.imageUrl ? (
              <img
                src={match.imageUrl}
                alt={`${match.mode} art`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center px-1">
                {match.mode}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Slot fill row — sized up ~15%. Bar color shifts with fill. */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[13px] mb-1.5">
          <span className="text-muted-foreground inline-flex items-center gap-1.5 font-medium">
            <Users size={14} />
            <span className="font-bold text-foreground tabular-nums">{spotsLeft}</span>
            <span>/ {match.slotsTotal} spots left</span>
          </span>
          <span className={cn("font-bold uppercase tracking-wide text-[11px]", urgency.tone)}>
            {urgency.label}
          </span>
        </div>
        <AnimatedProgress value={pct} duration={1} barClassName={barClass} />
      </div>

      {/* Footer — filled accent CTA until joined; JoinButton takes over after. */}
      {onDetails && (
        <div className="border-t border-border p-3" onClick={(e) => e.stopPropagation()}>
          {showViewDetails ? (
            <button
              onClick={onDetails}
              className="press w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-button bg-accent text-white text-[13px] font-extrabold uppercase tracking-wide shadow-sm hover:bg-accent/90 transition-colors"
            >
              View details &amp; Join
              <ChevronRight size={16} />
            </button>
          ) : (
            <JoinButton match={match} onJoin={onDetails} size="lg" forcedState={joinState} />
          )}
        </div>
      )}
      </div>

      {isDeclaring && (
        <p className="px-1 text-[11px] text-muted-foreground">
          Winners being announced. Stay tuned!
        </p>
      )}
    </div>
  );
}

/**
 * Format an admin-set match start timestamp into a stable clock label
 * like "9:00 PM". The admin panel stores `match.date` as a UTC ISO string;
 * we render it in the user's local timezone via Intl.DateTimeFormat so the
 * label never drifts as time elapses (unlike a countdown).
 */
function formatStartTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** Derive a short mode category label from the admin-set modeKind. */
function categoryFromMode(match: Match): string {
  switch (match.modeKind) {
    case "br-solo": return "Solo";
    case "br-duo":  return "Duo";
    case "br-squad":return "Squad";
    case "kill":    return "Kill";
    case "cs-1v1":  return "1v1";
    case "cs-4v4":  return "4v4";
    default:        return "Match";
  }
}


// Centralised urgency copy — edit freely without touching the card layout.
const URGENCY_LABELS = {
  full:    { label: "Full",          tone: "text-destructive" },
  hot:     { label: "Filling fast",  tone: "text-destructive" },
  warm:    { label: "Going quick",   tone: "text-warning" },
  open:    { label: "Spots open",    tone: "text-success" },
  fresh:   { label: "Just opened",   tone: "text-muted-foreground" },
} as const;

function urgencyFor(pct: number, isFull: boolean) {
  if (isFull)     return URGENCY_LABELS.full;
  if (pct >= 80)  return URGENCY_LABELS.hot;
  if (pct >= 50)  return URGENCY_LABELS.warm;
  if (pct >= 15)  return URGENCY_LABELS.open;
  return URGENCY_LABELS.fresh;
}
