import { useEffect, useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { axToInr } from "@/lib/config";
import { checkJoinStatus, type JoinState, type Match } from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";

type Size = "sm" | "lg";

/**
 * Universal join button — single source of truth for the 5 join states.
 * State is resolved via `checkJoinStatus(matchId, userId)` (Supabase RPC stub),
 * with priority: joined → declaring → full → free → open.
 */
export function JoinButton({
  match,
  onJoin,
  loading = false,
  size = "sm",
  className,
  // Optional override — when MatchDetails has already resolved local state
  // (e.g. after an optimistic join) it can pass it in to skip the fetch.
  forcedState,
}: {
  match: Pick<Match, "id" | "entryFee" | "isFree" | "status" | "slotsFilled" | "slotsTotal">;
  onJoin?: () => void;
  loading?: boolean;
  size?: Size;
  className?: string;
  forcedState?: JoinState;
}) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<JoinState>(forcedState ?? "open");

  useEffect(() => {
    if (forcedState) {
      setState(forcedState);
      return;
    }
    let alive = true;
    // TODO(supabase): replace with realtime subscription on match_registrations
    // + matches.status so the button updates without a refetch.
    checkJoinStatus(match.id, currentUser?.phone ?? null).then((s) => {
      if (alive) setState(s);
    });
    return () => {
      alive = false;
    };
  }, [match.id, match.status, match.slotsFilled, match.isFree, currentUser?.phone, forcedState]);

  const isLg = size === "lg";
  const base = cn(
    "press inline-flex items-center justify-center gap-1.5 rounded-xl font-extrabold uppercase tracking-wide shadow-sm transition-all",
    isLg ? "w-full h-12 px-4 text-sm" : "h-10 px-4 text-sm",
    className,
  );

  if (loading) {
    return (
      <button disabled className={cn(base, "bg-primary/70 text-primary-foreground cursor-wait")}>
        <Loader2 size={16} className="animate-spin" /> Joining…
      </button>
    );
  }

  switch (state) {
    case "joined":
      return (
        <button disabled className={cn(base, "bg-success text-success-foreground cursor-default")}>
          <Check size={16} /> Joined
        </button>
      );

    case "declaring":
      return (
        <button
          disabled
          className={cn(base, "bg-warning text-warning-foreground cursor-wait")}
        >
          <span>Declaring</span>
          <span className="inline-flex w-4 justify-start">
            <DotEllipsis />
          </span>
        </button>
      );

    case "full":
      return (
        <button disabled className={cn(base, "bg-muted text-muted-foreground cursor-not-allowed")}>
          Full
        </button>
      );

    case "free":
      return (
        <button
          onClick={onJoin}
          className={cn(
            base,
            "text-primary-foreground border-0",
            // Animated gradient — defined in index.css (`bg-free-gradient`).
            "bg-free-gradient bg-[length:200%_200%] animate-free-shine",
          )}
        >
          <span>Free</span>
          {isLg && <ChevronRight size={16} />}
        </button>
      );

    case "open":
    default:
      return (
        <button
          onClick={onJoin}
          className={cn(base, "bg-primary text-primary-foreground hover:bg-primary/90")}
        >
          <span>Join</span>
          <span className="tabular-nums">₹{axToInr(match.entryFee).toLocaleString()}</span>
          {isLg && <ChevronRight size={16} />}
        </button>
      );
  }
}

/** Tiny "..." that animates by sliding dots in. */
function DotEllipsis() {
  return (
    <span aria-hidden className="inline-flex gap-0.5">
      <span className="h-1 w-1 rounded-full bg-current animate-[fade_1.2s_ease-in-out_infinite]" />
      <span className="h-1 w-1 rounded-full bg-current animate-[fade_1.2s_ease-in-out_0.2s_infinite]" />
      <span className="h-1 w-1 rounded-full bg-current animate-[fade_1.2s_ease-in-out_0.4s_infinite]" />
    </span>
  );
}
