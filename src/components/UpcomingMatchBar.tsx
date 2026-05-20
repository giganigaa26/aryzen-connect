import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Zap, Copy, Hourglass, Trophy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  fetchUserActiveMatch,
  subscribeToMatchStatus,
  type ActiveMatch,
} from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";


/**
 * Persistent global match bar — sits between the app header and screen
 * content. Drives 5 visual states from `match.status` + `start_time`:
 *
 *   A · Match Joined          (status=upcoming, T-start > 5m)         dismissable
 *   B · Join Now              (status=upcoming, T-start ≤ 5m)         shows room id+pass, NOT dismissable
 *   C · Match Live            (status=being_played)                   dismissable
 *   D · Declaring Results     (status=declaring_result, 5-min bar)
 *   E · Results Ready         (status=completed, auto-dismiss 10s)
 *
 * Bar disappears entirely when there is no active joined match.
 *
 * Wire to Supabase realtime in Cursor — replace the stub
 * `subscribeToMatchStatus` so status changes auto-transition states without
 * polling.
 */
const RESULTS_AUTODISMISS_MS = 10_000;
const DECLARING_BAR_MS = 5 * 60_000;

export function UpcomingMatchBar() {
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const [match, setMatch] = useState<ActiveMatch | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [resultsDismissedId, setResultsDismissedId] = useState<string | null>(null);

  // Initial fetch + realtime subscription.
  useEffect(() => {
    let alive = true;
    fetchUserActiveMatch(currentUser?.phone ?? null).then((m) => {
      if (alive) setMatch(m);
    });
    return () => { alive = false; };
  }, [currentUser?.phone]);

  useEffect(() => {
    if (!match) return;
    const unsub = subscribeToMatchStatus(match.id, (m) => setMatch(m));
    return unsub;
  }, [match?.id]);

  // Tick: 1s during urgent states (B/D/E), 60s otherwise.
  useEffect(() => {
    const ms = !match ? 60_000
      : match.status === "upcoming"
        ? (new Date(match.startTime).getTime() - now <= 5 * 60_000 ? 1000 : 60_000)
        : match.status === "being_played" ? 60_000
        : 1000;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [match, now]);

  // Re-fetch when 5-min mark crosses so backend can supply room id/pass.
  useEffect(() => {
    if (!match || match.status !== "upcoming") return;
    const ms = new Date(match.startTime).getTime() - now;
    if (ms <= 5 * 60_000 && !match.roomId) {
      fetchUserActiveMatch(currentUser?.phone ?? null).then(setMatch);
    }
  }, [match, now, currentUser?.phone]);

  // Auto-dismiss State E after 10 seconds.
  useEffect(() => {
    if (match?.status !== "completed" || !match.completedAt) return;
    const elapsed = now - new Date(match.completedAt).getTime();
    if (elapsed >= RESULTS_AUTODISMISS_MS) setResultsDismissedId(match.id);
  }, [match, now]);

  if (!match) return null;
  if (match.status === "upcoming" && dismissedId === match.id) {
    // Still let State B re-appear once we cross the 5-min mark.
    const ms = new Date(match.startTime).getTime() - now;
    if (ms > 5 * 60_000) return null;
  }
  if (match.status === "being_played" && dismissedId === match.id) return null;
  if (match.status === "completed" && resultsDismissedId === match.id) return null;

  const goMatch = () => nav(`/app/match/${match.id}`);
  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  // ── State E · Results Ready ──
  // Navigate to History tab with matchId so the result sheet opens directly
  // (handled by the deeplink effect in MyMatches).
  if (match.status === "completed") {
    return (
      <div className="w-full bg-amber-500 text-black flex items-center justify-between gap-2 px-3 py-2">
        <button
          onClick={() => {
            setResultsDismissedId(match.id);
            nav(`/app/matches?tab=history&matchId=${match.id}`);
          }}
          className="press flex items-center gap-2 text-[13px] font-extrabold flex-1 text-left min-w-0"
        >
          <Trophy size={14} className="shrink-0" />
          <span className="truncate">Match ended! Tap to see your results</span>
        </button>
      </div>
    );
  }




  // ── State D · Declaring Results ──
  if (match.status === "declaring_result") {
    const since = match.declaringSince ? new Date(match.declaringSince).getTime() : now;
    const elapsed = Math.max(0, now - since);
    const remaining = Math.max(0, DECLARING_BAR_MS - elapsed);
    const pct = Math.min(100, (elapsed / DECLARING_BAR_MS) * 100);
    return (
      <button
        onClick={goMatch}
        className="press w-full flex flex-col gap-1 bg-amber-500/95 text-black px-3 py-1.5"
      >
        <div className="flex items-center gap-2 text-[12px] font-extrabold">
          <Hourglass size={12} className="shrink-0" />
          <span className="truncate">Declaring results… check back in a moment</span>
          <span className="ml-auto tabular-nums">{formatMS(remaining)}</span>
        </div>
        <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
          <div className="h-full bg-black/70 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      </button>
    );
  }

  // ── State C · Match Live ──
  if (match.status === "being_played") {
    const startedMs = now - new Date(match.startTime).getTime();
    const mins = Math.max(0, Math.floor(startedMs / 60_000));
    return (
      <div className="w-full flex items-center bg-destructive text-destructive-foreground">
        <button onClick={goMatch} className="press flex-1 flex items-center gap-2 text-[12px] font-extrabold py-1.5 px-3 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="truncate">LIVE — Started {mins === 0 ? "just now" : `${mins} min${mins === 1 ? "" : "s"} ago`}</span>
        </button>
        <button
          onClick={() => setDismissedId(match.id)}
          className="press h-7 w-7 mr-1 rounded-full flex items-center justify-center text-xs font-bold opacity-80 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }

  // ── State A / B · Upcoming ──
  const ms = new Date(match.startTime).getTime() - now;
  if (ms <= 0) return null;
  const urgent = ms <= 5 * 60_000;

  if (urgent && match.roomId && match.roomPass) {
    // State B — Join Now (room reveal). NOT dismissable.
    return (
      <div className="w-full bg-destructive text-destructive-foreground px-3 py-2 space-y-1">
        <button onClick={goMatch} className="press w-full flex items-center gap-2 text-[13px] font-extrabold text-left">
          <Zap size={14} className="shrink-0" />
          <span className="truncate">JOIN NOW — {match.name}</span>
          <span className="ml-auto tabular-nums">{formatSeconds(ms)}</span>
        </button>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <RoomChip label="Room" value={match.roomId} onCopy={() => copy(match.roomId!, "Room ID")} />
          <RoomChip label="Pass" value={match.roomPass} onCopy={() => copy(match.roomPass!, "Password")} />
        </div>
      </div>
    );
  }

  // State A — countdown.
  return (
    <div className="w-full flex items-center bg-primary text-primary-foreground">
      <button
        onClick={goMatch}
        className={cn("press flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold py-1.5 px-3 min-w-0")}
      >
        <Clock size={12} className="shrink-0" />
        <span className="truncate">
          <span className="font-extrabold">{match.name}</span>
          <span className="opacity-90"> · Starts in </span>
          <span className="font-extrabold tabular-nums">{formatCountdown(ms)}</span>
        </span>
      </button>
      <button
        onClick={() => setDismissedId(match.id)}
        className="press h-7 w-7 mr-1 rounded-full flex items-center justify-center text-xs font-bold opacity-80 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function RoomChip({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="press inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/25 hover:bg-black/35 transition-colors"
    >
      <span className="opacity-80">{label}:</span>
      <span className="font-mono tracking-wider">{value}</span>
      {copied ? <Check size={11} /> : <Copy size={11} className="opacity-80" />}
    </button>
  );
}

function formatCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / (60 * 24));
  const h = Math.floor((totalMin % (60 * 24)) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function formatSeconds(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
function formatMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
