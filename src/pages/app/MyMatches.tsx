import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trophy, Calendar, History as HistoryIcon, Inbox, Clock } from "lucide-react";
import { toast } from "sonner";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { MatchResultSheet } from "@/components/MatchResultSheet";
import { CancelledMatchSheet } from "@/components/CancelledMatchSheet";

import { cn } from "@/lib/utils";
import { axToInr } from "@/lib/config";
import {
  fetchUserMatches,
  subscribeToUserMatches,
  viewRoom,
  gameLabel,
  type UserMatch,
} from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";

type Tab = "live" | "scheduled" | "history";

/**
 * MyMatches — shows the user's joined matches, grouped into Live / Scheduled /
 * History. All data comes from `fetchUserMatches(userId, status)` which is a
 * stub today and a Supabase query in Cursor (see src/lib/stubs.ts).
 */
export default function MyMatches() {
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const userId = currentUser?.phone ?? null;
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab can be deep-linked: /app/matches?tab=history
  const initialTab: Tab = (searchParams.get("tab") as Tab) ?? "scheduled";
  const [tab, setTab] = useState<Tab>(initialTab);
  // Result sheet — opened by tapping a finished match in the history list.
  const [resultMatchId, setResultMatchId] = useState<string | null>(null);
  // Cancelled-match sheet — opened by tapping a cancelled match in history.
  const [cancelledMatchId, setCancelledMatchId] = useState<string | null>(null);

  // Per-tab data + loading. We fetch each tab once on mount AND when realtime
  // pings us, so tab counts ("Live (2)") stay accurate without switching tabs.
  const [live, setLive] = useState<UserMatch[] | null>(null);
  const [scheduled, setScheduled] = useState<UserMatch[] | null>(null);
  const [history, setHistory] = useState<UserMatch[] | null>(null);

  const refresh = useMemo(
    () => async () => {
      // Replace with parallel Supabase queries in Cursor.
      const [l, s, h] = await Promise.all([
        fetchUserMatches(userId, "live"),
        fetchUserMatches(userId, "upcoming"),
        fetchUserMatches(userId, "completed-or-cancelled"),
      ]);
      setLive(l);
      setScheduled(s);
      setHistory(h);
    },
    [userId]
  );

  useEffect(() => {
    refresh();
    // Realtime: re-fetch when registrations or match status changes.
    // Replace with a real Supabase channel in Cursor.
    const unsub = subscribeToUserMatches(userId, refresh);
    return unsub;
  }, [userId, refresh]);

  // Deeplink: ?tab=...&matchId=... — switch tab + auto-open the matching sheet
  // (result for completed, cancelled for cancelled). Runs once history loads.
  useEffect(() => {
    const t = searchParams.get("tab") as Tab | null;
    const mid = searchParams.get("matchId");
    if (t && t !== tab) setTab(t);
    if (!mid || history === null) return;
    const m = history.find((x) => x.id === mid);
    if (!m) return;
    if (m.status === "cancelled") setCancelledMatchId(mid);
    else if (typeof m.position === "number") setResultMatchId(mid);
    // Strip the matchId so re-renders/back-nav don't re-open the sheet.
    const next = new URLSearchParams(searchParams);
    next.delete("matchId");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, searchParams]);

  const list = tab === "live" ? live : tab === "scheduled" ? scheduled : history;

  return (
    <>
      <ScreenHeader title="My Matches" />

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2 p-1 bg-secondary rounded-full relative">
          <PillTab
            id="live"
            active={tab === "live"}
            onClick={() => setTab("live")}
            label="Live"
            count={live?.length}
          />
          <PillTab
            id="scheduled"
            active={tab === "scheduled"}
            onClick={() => setTab("scheduled")}
            label="Scheduled"
            count={scheduled?.length}
          />
          <PillTab
            id="history"
            active={tab === "history"}
            onClick={() => setTab("history")}
            label="History"
            count={history?.length}
          />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3 pb-6">
        {list === null ? (
          <SkeletonList />
        ) : list.length === 0 ? (
          <EmptyForTab tab={tab} onBrowse={() => nav("/app")} />
        ) : tab === "live" ? (
          list.map((m) => (
            <LiveCard
              key={m.id}
              match={m}
              onViewRoom={() => {
                viewRoom(m.id);
                toast.success("Opening room...");
              }}
            />
          ))
        ) : tab === "scheduled" ? (
          list.map((m) => <ScheduledCard key={m.id} match={m} />)
        ) : (
          list.map((m) => (
            <HistoryCard
              key={m.id}
              match={m}
              onOpenResult={() => setResultMatchId(m.id)}
              onOpenCancelled={() => setCancelledMatchId(m.id)}
            />
          ))
        )}
      </div>

      <MatchResultSheet
        matchId={resultMatchId}
        open={resultMatchId !== null}
        onClose={() => setResultMatchId(null)}
      />
      <CancelledMatchSheet
        matchId={cancelledMatchId}
        open={cancelledMatchId !== null}
        onClose={() => setCancelledMatchId(null)}
      />
    </>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function CardShell({ children, badge }: { children: React.ReactNode; badge?: React.ReactNode }) {
  // Shared 16px-radius card matching Home match cards.
  return (
    <div className="relative bg-card rounded-2xl border border-border p-4 shadow-sm press-card">
      {badge && <div className="absolute top-3 right-3">{badge}</div>}
      {children}
    </div>
  );
}

function MetaLine({ match }: { match: UserMatch }) {
  return (
    <div className="text-xs text-muted-foreground mt-1 truncate">
      {gameLabel(match.game)} · {match.mode}
    </div>
  );
}

function EntryPill({ amount }: { amount: number }) {
  // Decision/result surface — ₹ only.
  return (
    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-foreground text-[11px] font-bold tabular-nums">
      <span>Entry ₹{axToInr(amount).toLocaleString()}</span>
    </div>
  );
}

function LiveCard({ match, onViewRoom }: { match: UserMatch; onViewRoom: () => void }) {
  return (
    <Item>
      <CardShell
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
            Live
          </span>
        }
      >
        <div className="pr-16">
          <h3 className="font-bold truncate">{match.name}</h3>
          <MetaLine match={match} />
          <div className="text-[11px] text-muted-foreground mt-1">
            Slot #{match.slot} · {formatDate(match.startTime)}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <EntryPill amount={match.entryFee} />
          <Button size="sm" onClick={onViewRoom}>
            View Room
          </Button>
        </div>
      </CardShell>
    </Item>
  );
}

function ScheduledCard({ match }: { match: UserMatch }) {
  const startsInMs = new Date(match.startTime).getTime() - Date.now();
  return (
    <Item>
      <CardShell
        badge={
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            <Clock size={10} />
            Scheduled
          </span>
        }
      >
        <div className="pr-24">
          <h3 className="font-bold truncate">{match.name}</h3>
          <MetaLine match={match} />
          <div className="text-[11px] text-muted-foreground mt-1">
            Slot #{match.slot} · {formatDate(match.startTime)}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <EntryPill amount={match.entryFee} />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
            Starts in {formatCountdown(startsInMs)}
          </div>
        </div>
      </CardShell>
    </Item>
  );
}

function HistoryCard({
  match,
  onOpenResult,
  onOpenCancelled,
}: {
  match: UserMatch;
  onOpenResult: () => void;
  onOpenCancelled: () => void;
}) {
  const isCancelled = match.status === "cancelled";
  const showPlacementBadge = !isCancelled && typeof match.position === "number" && match.position <= 16;
  const resultsPending = !isCancelled && (match.position === null || match.position === undefined);
  // Cancelled matches open the cancelled-match sheet; pending ones stay non-clickable.
  const canOpenResult = !isCancelled && !resultsPending;
  const canOpen = canOpenResult || isCancelled;
  const handleClick = () => {
    if (isCancelled) onOpenCancelled();
    else if (canOpenResult) onOpenResult();
  };

  return (
    <Item>
      <div onClick={handleClick} className={cn(canOpen && "cursor-pointer")}>
      <CardShell
        badge={
          isCancelled ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Cancelled
            </span>
          ) : showPlacementBadge ? (
            <PlacementBadge position={match.position!} />
          ) : resultsPending ? (
            <span className="text-[10px] font-semibold text-muted-foreground">Results pending</span>
          ) : null
        }
      >
        <div className="pr-16">
          <h3 className="font-bold truncate">{match.name}</h3>
          <MetaLine match={match} />
          <div className="text-[11px] text-muted-foreground mt-1">{formatDate(match.startTime)}</div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <EntryPill amount={match.entryFee} />
          {isCancelled ? (
            <span className="text-xs font-semibold text-muted-foreground">
              {match.refunded ? "Entry refunded" : "—"}
            </span>
          ) : (match.axWon ?? 0) > 0 ? (
            <span className="inline-flex items-center text-success font-bold text-sm tabular-nums">
              <span>+₹{axToInr(match.axWon!).toLocaleString()}</span>
            </span>
          ) : !resultsPending ? (
            <span className="text-muted-foreground text-xs font-medium">No prize</span>
          ) : null}
        </div>
      </CardShell>
      </div>
    </Item>
  );
}

/**
 * PlacementBadge — gold/silver/bronze for top-3, theme-tinted for 4th–16th.
 * Only render when position <= 16; caller enforces this.
 */
function PlacementBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span
        className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-full text-[12px] font-extrabold tabular-nums shadow-sm"
        style={{
          background: "linear-gradient(135deg,#FFE27A,#FFD700,#E0A800)",
          color: "#3a2a00",
        }}
      >
        #1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span
        className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-full text-[12px] font-extrabold tabular-nums shadow-sm"
        style={{
          background: "linear-gradient(135deg,#EDEDED,#C0C0C0,#9C9C9C)",
          color: "#2a2a2a",
        }}
      >
        #2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span
        className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-full text-[12px] font-extrabold tabular-nums shadow-sm"
        style={{
          background: "linear-gradient(135deg,#E6A878,#CD7F32,#8B5A2B)",
          color: "#2a1500",
        }}
      >
        #3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-full text-[12px] font-extrabold tabular-nums bg-primary/80 text-primary-foreground">
      #{position}
    </span>
  );
}

// ─── Empty / loading states ─────────────────────────────────────────────────

function EmptyForTab({ tab, onBrowse }: { tab: Tab; onBrowse: () => void }) {
  if (tab === "live") {
    return (
      <Empty
        icon={<Trophy size={28} />}
        title="No live matches"
        subtitle="No live matches. Check Scheduled."
      />
    );
  }
  if (tab === "scheduled") {
    return (
      <Empty
        icon={<Calendar size={28} />}
        title="Nothing scheduled"
        subtitle="You haven't joined any upcoming matches."
        action={{ label: "Browse Matches", onClick: onBrowse }}
      />
    );
  }
  return (
    <Empty
      icon={<HistoryIcon size={28} />}
      title="No history yet"
      subtitle="No match history yet. Join your first match!"
      action={{ label: "Browse Matches", onClick: onBrowse }}
    />
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-card rounded-2xl border border-border p-4 shadow-sm animate-pulse"
        >
          <div className="h-4 w-2/3 rounded bg-secondary" />
          <div className="h-3 w-1/3 rounded bg-secondary mt-2" />
          <div className="h-3 w-1/4 rounded bg-secondary mt-2" />
          <div className="mt-4 flex justify-between">
            <div className="h-6 w-14 rounded bg-secondary" />
            <div className="h-6 w-20 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Small primitives ──────────────────────────────────────────────────────

function Item({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function PillTab({
  active,
  onClick,
  label,
  count,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-9 rounded-full text-sm font-semibold transition-colors duration-150 active:scale-[0.97] px-2",
        active ? "text-primary-foreground" : "text-muted-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="myMatchesPill"
          className="absolute inset-0 rounded-full bg-primary shadow-sm"
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1 truncate">
        {label}
        {typeof count === "number" && (
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              active ? "opacity-90" : "opacity-70"
            )}
          >
            ({count})
          </span>
        )}
      </span>
    </button>
  );
}

function Empty({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <div className="h-16 w-16 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center mb-3">
        {icon ?? <Inbox size={28} />}
      </div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 max-w-xs">{subtitle}</div>
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ─── Formatters ────────────────────────────────────────────────────────────

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  if (total === 0) return "now";
  const d = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
