import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, EyeOff, Lock, Trophy, Users, FileText, Copy,
  Clock, Coins, Check, Crosshair,
} from "lucide-react";
import {
  DUMMY_MATCHES, fetchSlots, revealRoomID, joinMatch,
  fetchPrizeTemplate, fetchCustomRules, fetchPlatformRules,
  type Slot, type PrizeTemplate,
} from "@/lib/stubs";
import { SquadTeams } from "@/components/SquadTeams";
import { useAuth } from "@/contexts/AuthContext";
import { MODES_BY_GAME, axToInr, WALLET, type ModeKind } from "@/lib/config";
import { cn } from "@/lib/utils";
import { AxCoin } from "@/components/AxCoin";
import { JoinButton } from "@/components/JoinButton";

import { SlotGrid } from "@/components/SlotGrid";
import { CountdownRing } from "@/components/CountdownRing";
import { formatExactStart } from "@/components/UpcomingMatchBar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Tab = "prize" | "slots" | "rules";

export default function MatchDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const match = DUMMY_MATCHES.find((m) => m.id === id) ?? DUMMY_MATCHES[0];
  // Resolve mode kind: prefer admin-set field, otherwise look up from catalog.
  const modeKind: ModeKind =
    match.modeKind ??
    MODES_BY_GAME[match.game].find((m) => m.label === match.mode)?.kind ??
    "br-squad";

  const [tab, setTab] = useState<Tab>("prize");
  const [revealed, setRevealed] = useState<{ roomId: string; password: string } | null>(null);
  const [hidden, setHidden] = useState(false);
  // TODO: replace with Supabase row check (user_match_join table).
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Dynamic admin content — fetched on mount.
  const [prize, setPrize] = useState<PrizeTemplate | null>(null);
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [platformRules, setPlatformRules] = useState<string[]>([]);

  useEffect(() => {
    fetchSlots(match.id).then(setSlots);
    fetchPrizeTemplate(match.id).then(setPrize);
    fetchCustomRules(match.id).then(setCustomRules);
    // Fetch from fetchPlatformRules() — to be wired in Cursor (cache locally).
    fetchPlatformRules().then(setPlatformRules);
  }, [match.id]);

  const startDate = new Date(match.date);
  const startsIn = relTime(startDate.getTime() - Date.now());
  const isLive = startsIn === "Live now";
  // Exact, RPC-loaded start time — preferred over relative countdown.
  const exactStart = formatExactStart(startDate);
  const prizePool = prize?.totalPool ?? match.entryFee * match.slotsTotal;
  const spotsLeft = match.slotsTotal - match.slotsFilled;
  const pct = Math.round((match.slotsFilled / match.slotsTotal) * 100);
  const isFull = match.slotsFilled >= match.slotsTotal;

  const requestJoin = () => {
    if (joined || isFull) return;
    setConfirmOpen(true);
  };
  const confirmJoin = async () => {
    setConfirmOpen(false);
    setJoining(true);
    try {
      // TODO: wire to Supabase RPC (atomic deduct + slot insert).
      await joinMatch(match.id);
      setJoined(true);
      toast.success(`Joined ${match.name} • ${match.entryFee} AX deducted`);
    } catch {
      toast.error("Couldn't join. Try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleReveal = async () => {
    const r = await revealRoomID(match.id);
    setRevealed(r);
    setHidden(false);
    toast.success("Room ID revealed");
  };

  const showRoom = revealed && !hidden;

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="h-14 px-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="press h-10 w-10 rounded-full flex items-center justify-center">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold tracking-tight truncate">Match Details</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* ─── Fused match + room + join card ───────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="flex gap-3 p-4">
            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center h-6 px-2 rounded-md border border-border text-[10px] font-bold uppercase tracking-wide">
                  {match.mode}
                </span>
                <span className="inline-flex items-center h-6 px-2 rounded-md border border-border text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {match.slotsTotal} slots
                </span>
                <span className={cn(
                  "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide tabular-nums",
                  match.status === "declaring_result"
                    ? "bg-warning/15 text-warning animate-pulse"
                    : isLive
                    ? "bg-destructive/10 text-destructive"
                    : "border border-border text-muted-foreground"
                )}>
                  {match.status === "declaring_result" ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      Declaring Results
                    </>
                  ) : isLive ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      Live
                    </>
                  ) : (
                    <>
                      <Clock size={10} />
                      {exactStart}
                    </>
                  )}
                </span>
              </div>

              <h2 className="mt-2 font-extrabold text-[17px] leading-tight">
                {match.name}
              </h2>

              <div className="mt-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Trophy size={11} className="text-success" /> Prize Pool
                </div>
                <div className="text-success font-extrabold text-2xl leading-tight tabular-nums mt-0.5">
                  ₹{axToInr(prizePool).toLocaleString()}
                </div>
                {modeKind === "kill" && prize?.killReward != null && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                    <Crosshair size={11} /> ₹{axToInr(prize.killReward).toLocaleString()}
                    <span className="text-muted-foreground font-medium">per kill</span>
                  </div>
                )}
              </div>

              {modeKind === "kill" && prize?.entryRefundable && (
                <div className="mt-2 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-md bg-warning/10 text-warning text-[11px] font-bold tabular-nums">
                  <Coins size={11} />
                  <span>₹{axToInr(match.entryFee).toLocaleString()} entry</span>
                  <span className="text-[10px] font-semibold opacity-80">(refundable)</span>
                </div>
              )}
            </div>

            {/* Mode/map art — admin-editable via match.imageUrl */}
            <div className="shrink-0">
              <div className="h-28 w-28 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center">
                {match.imageUrl ? (
                  <img src={match.imageUrl} alt={`${match.mode} art`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center px-1">
                    {match.mode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Slot fill */}
          <div className="px-4 pb-3">
            <div className="flex items-baseline justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground inline-flex items-center gap-1 font-medium">
                <Users size={12} />
                <span className="tabular-nums">
                  <span className="font-bold text-foreground">{match.slotsFilled}</span>
                  <span className="opacity-70">/{match.slotsTotal}</span>
                </span>
                <span className="opacity-70">·</span>
                <span className="tabular-nums">{spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left</span>
              </span>
              <span className="font-bold uppercase tracking-wide text-[10px] text-muted-foreground tabular-nums">
                {pct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  isFull ? "bg-destructive" : pct >= 80 ? "bg-destructive" : pct >= 50 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Action zone — Join CTA OR Room ID reveal (post-join) */}
          <div className="border-t border-border bg-secondary/30 p-3">
            {!joined ? (
              // Universal 5-state join button (joined → declaring → full → free → open).
              <JoinButton
                match={match}
                size="lg"
                loading={joining}
                onJoin={requestJoin}
                forcedState={match.status === "declaring_result" ? "declaring" : undefined}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  showRoom ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                )}>
                  {showRoom ? <Check size={18} /> : <Lock size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Room ID
                  </div>
                  <div className="font-mono font-bold tracking-wider flex items-center gap-2 text-sm">
                    <span className={cn(!showRoom && "text-muted-foreground")}>
                      {showRoom ? revealed!.roomId : "• • • • • •"}
                    </span>
                    {showRoom && (
                      <button
                        onClick={() => { navigator.clipboard?.writeText(revealed!.roomId); toast.success("Copied"); }}
                        className="press h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label="Copy room id"
                      >
                        <Copy size={12} />
                      </button>
                    )}
                  </div>
                  {showRoom && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Pass: <span className="font-mono font-semibold text-foreground">{revealed!.password}</span>
                    </div>
                  )}
                  {!revealed && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Unlocks 5 min before start
                    </div>
                  )}
                </div>

                {!revealed ? (
                  <CountdownRing targetDate={startDate} size={52} stroke={3}>
                    <button
                      onClick={handleReveal}
                      className="press h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      aria-label="Reveal room"
                    >
                      <Eye size={16} />
                    </button>
                  </CountdownRing>
                ) : (
                  <button
                    onClick={() => setHidden((h) => !h)}
                    className="press h-10 w-10 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center"
                    aria-label={hidden ? "Show room" : "Hide room"}
                  >
                    {hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs card — same visual treatment as match card. */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 border-b border-border relative">
            <TabBtn active={tab === "prize"} onClick={() => setTab("prize")} icon={<Trophy size={15} />} label="Prize Pool" />
            <TabBtn active={tab === "slots"} onClick={() => setTab("slots")} icon={<Users size={15} />} label="Players" />
            <TabBtn active={tab === "rules"} onClick={() => setTab("rules")} icon={<FileText size={15} />} label="Rules" />
          </div>

          <ScrollFadePanel>
            <AnimatePresence mode="wait">
              {tab === "prize" && (
                <motion.div
                  key="prize"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <PrizePanel template={prize} kind={modeKind} totalPool={prizePool} />
                </motion.div>
              )}

              {tab === "slots" && (
                <motion.div
                  key="slots"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {joined ? (
                    <div className="space-y-3">
                      <SquadTeams
                        matchId={match.id}
                        game={match.game}
                        mode={match.mode}
                        joined={joined}
                        userId={currentUser?.displayName}
                      />
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                            <Users size={12} />
                            <span>
                              <span className="font-bold text-foreground">{slots.filter(s => s.player).length}</span>
                              <span> / {slots.length} players</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                            {match.mode}
                          </span>
                        </div>
                        <SlotGrid slots={slots} kind={modeKind} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          <Users size={12} />
                          <span>
                            <span className="font-bold text-foreground">{slots.filter(s => s.player).length}</span>
                            <span> / {slots.length} players</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {match.mode}
                        </span>
                      </div>
                      <SlotGrid slots={slots} kind={modeKind} />
                      <div className="mt-3 text-[11px] text-muted-foreground leading-snug">
                        Join the match to form or join a squad.
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {tab === "rules" && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  <RulesPanel customRules={customRules} platformRules={platformRules} />
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollFadePanel>
        </div>
      </div>

      {/* Lightweight join confirmation. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Join Match?</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-1.5 flex-wrap">
              You'll spend
              <span className="font-bold text-foreground tabular-nums">
                ₹{axToInr(match.entryFee).toLocaleString()}
              </span>
              to join <span className="font-semibold text-foreground">{match.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmJoin}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

/** Theme-aware vertical scroll fade — fades in/out based on scroll position. */
function ScrollFadePanel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setAtTop(el.scrollTop <= 2);
      setAtBottom(el.scrollHeight - el.clientHeight - el.scrollTop <= 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        {children}
      </div>
      {/* Top scroll cue — small rounded pill, theme-tinted, appears when scrolled down. */}
      <div
        className={cn(
          "pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-primary/40 transition-opacity duration-200",
          atTop ? "opacity-0" : "opacity-100"
        )}
      />
      {/* Bottom scroll cue — small rounded pill, theme-tinted, hides at bottom. */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-primary/40 transition-opacity duration-200",
          atBottom ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}

/** Renders any admin prize template. Handles Kill Mode + variable row counts. */
function PrizePanel({ template, kind, totalPool }: { template: PrizeTemplate | null; kind: ModeKind; totalPool: number }) {
  if (!template) {
    return <div className="text-sm text-muted-foreground">Loading prize pool…</div>;
  }

  return (
    <div>
      {/* Total pool header — ₹ only on decision surfaces. */}
      <div className="rounded-xl border border-border bg-secondary/40 p-3 mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Prize Pool
          </div>
          <div className="text-success font-extrabold text-xl leading-tight tabular-nums mt-0.5">
            ₹{axToInr(totalPool).toLocaleString()}
          </div>
        </div>
        {kind === "kill" && template.killReward != null && (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Per Kill</div>
            <div className="font-extrabold text-lg text-destructive tabular-nums inline-flex items-center gap-1 justify-end">
              <Crosshair size={14} />
              <span>₹{axToInr(template.killReward).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {kind === "kill" && template.rows.length === 0 ? (
        <div className="text-sm text-muted-foreground leading-relaxed">
          Earn <span className="font-bold text-foreground">₹{axToInr(template.killReward ?? 0).toLocaleString()}</span> for every kill.
          {template.entryRefundable && (
            <> Your entry fee is fully refunded after the match.</>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {template.rows.map((p, i) => (
            <motion.div
              key={`${p.rank}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22, ease: "easeOut" }}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "h-8 min-w-8 px-2 rounded-full flex items-center justify-center font-bold text-xs",
                  p.rank === 1 ? "bg-warning/20 text-warning" :
                  p.rank === 2 ? "bg-muted text-foreground" :
                  p.rank === 3 ? "bg-accent/20 text-accent" :
                  "bg-secondary text-muted-foreground"
                )}>
                  #{p.rank}
                </div>
                <span className="font-semibold text-sm truncate">
                  {p.label ?? `Rank ${p.rank}`}
                </span>
              </div>
              <AxCoin amount={p.prize} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Two-part rules: admin chips on top, fixed-but-editable platform rules below. */
function RulesPanel({ customRules, platformRules }: { customRules: string[]; platformRules: string[] }) {
  return (
    <div className="space-y-4">
      {customRules.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Match Rules
          </div>
          <div className="flex flex-wrap gap-1.5">
            {customRules.map((r, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary text-[11px] font-bold"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className={cn(customRules.length > 0 && "pt-4 border-t border-border")}>
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Platform Rules
        </div>
        <ol className="space-y-2.5">
          {platformRules.map((r, i) => (
            <li key={i} className="text-sm flex gap-2.5 leading-snug">
              <span className="shrink-0 h-5 min-w-5 px-1 rounded-md bg-secondary text-foreground text-[11px] font-extrabold inline-flex items-center justify-center tabular-nums">
                {i + 1}
              </span>
              <span className="text-foreground">{r}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative py-3 flex items-center justify-center gap-1.5 text-xs transition-colors duration-150 active:scale-[0.97]",
        active ? "text-primary font-extrabold" : "text-muted-foreground font-semibold"
      )}
    >
      {icon} {label}
      {active && (
        <motion.span
          layoutId="matchTabIndicator"
          className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        />
      )}
    </button>
  );
}

function relTime(ms: number): string {
  if (ms <= 0) return "Live now";
  const m = Math.round(ms / 60000);
  if (m < 60)  return `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24)  return `in ${h}h`;
  const d = Math.round(h / 24);
  return `in ${d}d`;
}
