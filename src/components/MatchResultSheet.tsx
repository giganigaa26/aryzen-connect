import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  X, Share2, Copy, Check, Trophy, Swords, CircleCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchMatchResults, shareMatchResult,
  type MatchResult, type ResultPlayer,
} from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

/**
 * Match Result Sheet — opens after a match is declared.
 *
 *   Triggered from:
 *     · Tapping a completed match in MyMatches (history)
 *     · The "Results Ready" state of <UpcomingMatchBar />
 *
 *   Header tone changes based on user payout:
 *     · prize > 0      → 🏆 Victory   (gold)
 *     · kills only     → ⚔️ Match Complete (silver)
 *     · no payout      → ✓ Match Complete (muted)
 */
export function MatchResultSheet({
  matchId,
  open,
  onClose,
}: {
  matchId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const nav = useNavigate();
  const { currentUser } = useAuth();
  const [data, setData] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !matchId) return;
    setLoading(true);
    setData(null);
    fetchMatchResults(matchId, currentUser?.phone ?? null)
      .then(setData)
      .finally(() => setLoading(false));
  }, [open, matchId, currentUser?.phone]);

  const handleShare = async () => {
    if (!data) return;
    const { shared } = await shareMatchResult(data);
    if (!shared) toast.success("Result copied to clipboard");
  };

  const copyMatchId = () => {
    if (!data) return;
    navigator.clipboard?.writeText(data.matchIdStr);
    setCopied(true);
    toast.success("Match ID copied");
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <SheetContent
        side="bottom"
        className="p-0 rounded-t-2xl max-h-[92vh] flex flex-col bg-background"
      >
        {loading || !data ? (
          <div className="p-6 space-y-3">
            <div className="h-7 w-2/3 rounded shimmer" />
            <div className="h-4 w-1/2 rounded shimmer" />
            <div className="h-24 w-full rounded shimmer" />
          </div>
        ) : (
          <ResultBody
            data={data}
            onClose={onClose}
            onShare={handleShare}
            onCopyId={copyMatchId}
            copied={copied}
            onWallet={() => { onClose(); nav("/app/wallet"); }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Body ──────────────────────────────────────────────────────────────────

function ResultBody({
  data, onClose, onShare, onCopyId, copied, onWallet,
}: {
  data: MatchResult;
  onClose: () => void;
  onShare: () => void;
  onCopyId: () => void;
  copied: boolean;
  onWallet: () => void;
}) {
  const tone = headerTone(data);
  const showInTop = data.userPosition <= 10;

  return (
    <>
      {/* Header — dynamic tone */}
      <header className={cn("relative px-5 pt-5 pb-3", tone.bg)}>
        <button
          onClick={onClose}
          className="press absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/10"
          aria-label="Close"
        >
          <X size={18} className={tone.fg} />
        </button>
        <button
          onClick={onShare}
          className="press absolute top-3 right-12 h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/10"
          aria-label="Share result"
        >
          <Share2 size={16} className={tone.fg} />
        </button>

        <div className={cn("inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider opacity-80", tone.fg)}>
          {tone.kicker}
        </div>
        <h2 className={cn("mt-1 text-[20px] font-extrabold leading-tight tracking-tight pr-20", tone.fg)}>
          {tone.title}
        </h2>
        <p className={cn("mt-0.5 text-[12px] font-medium opacity-80 truncate pr-20", tone.fg)}>
          {data.matchName}
        </p>
      </header>

      {/* Stats row — context-aware */}
      <div className="px-4 pt-3 grid grid-cols-3 gap-2">
        {data.matchMode === "br" ? (
          <>
            <Stat label="Position"   value={`#${data.userPosition}`} />
            <Stat label="Entry"      value={`₹${data.entrySpent}`} />
            <Stat label="Prize Won"  value={data.prizeWon > 0 ? `₹${data.prizeWon}` : "—"} accent={data.prizeWon > 0} />
          </>
        ) : (
          <>
            <Stat label="Kills"      value={String(data.userKills ?? 0)} />
            <Stat label="Refunded"   value={`₹${data.entryRefunded}`} />
            <Stat label="Earnings"   value={`₹${data.userEarnings}`} accent={data.userEarnings > 0} />
          </>
        )}
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-y-auto px-4 mt-3 pb-3">
        <ul className="rounded-xl border border-border bg-card overflow-hidden">
          {data.top10players.map((p) => (
            <PlayerRow key={p.rank} player={p} mode={data.matchMode} />
          ))}
        </ul>

        {/* When user is outside top 10 — clean gap then their pinned row */}
        {!showInTop && (
          <>
            <div className="my-2 flex items-center gap-2 px-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Your Position
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <ul className="rounded-xl border border-border overflow-hidden">
              <PlayerRow player={data.userRow} mode={data.matchMode} />
            </ul>
          </>
        )}
      </div>

      {/* Footer — match id + actions */}
      <footer className="border-t border-border bg-card/50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onCopyId}
            className="press inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground"
            aria-label="Copy match id"
          >
            <span>Match ID: {data.matchIdStr}</span>
            {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onWallet}>
            Wallet
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Continue
          </Button>
        </div>
      </footer>
    </>
  );
}

// ─── Bits ──────────────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-0.5 text-[15px] font-extrabold tabular-nums", accent && "text-success")}>
        {value}
      </div>
    </div>
  );
}

function PlayerRow({ player, mode }: { player: ResultPlayer; mode: "br" | "kill" }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm border-b border-border last:border-b-0",
        player.isYou && "bg-destructive/10",
      )}
    >
      <RankBadge rank={player.rank} highlight={player.isYou} />
      <div className="flex-1 min-w-0">
        <div className={cn("font-bold truncate", player.isYou && "text-destructive")}>
          {player.nickname}
        </div>
        {mode === "kill" && typeof player.kills === "number" && (
          <div className="text-[11px] text-muted-foreground">{player.kills} kills</div>
        )}
      </div>
      <div className={cn(
        "text-sm font-extrabold tabular-nums",
        player.earnings > 0 ? "text-success" : "text-muted-foreground",
      )}>
        {player.earnings > 0 ? `₹${player.earnings}` : "—"}
      </div>
    </li>
  );
}

function RankBadge({ rank, highlight }: { rank: number; highlight?: boolean }) {
  // Gold / silver / bronze for top 3 — matches MyMatches PlacementBadge style.
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-extrabold tabular-nums"
        style={{ background: "linear-gradient(135deg,#FFE27A,#FFD700,#E0A800)", color: "#3a2a00" }}>
        #1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-extrabold tabular-nums"
        style={{ background: "linear-gradient(135deg,#EDEDED,#C0C0C0,#9C9C9C)", color: "#2a2a2a" }}>
        #2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-extrabold tabular-nums"
        style={{ background: "linear-gradient(135deg,#E6A878,#CD7F32,#8B5A2B)", color: "#2a1500" }}>
        #3
      </span>
    );
  }
  return (
    <span className={cn(
      "inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[11px] font-extrabold tabular-nums",
      highlight ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground",
    )}>
      #{rank}
    </span>
  );
}

// ─── Header tone helper ────────────────────────────────────────────────────

function headerTone(d: MatchResult): {
  bg: string;
  fg: string;
  kicker: React.ReactNode;
  title: string;
} {
  if (d.matchMode === "br" && d.prizeWon > 0) {
    // Victory — gold gradient, dark text.
    return {
      bg: "bg-gradient-to-br from-[#FFE27A] via-[#FFD24A] to-[#E0A800]",
      fg: "text-[#3a2a00]",
      kicker: (<><Trophy size={12} /> Victory</>),
      title: `🏆 ₹${d.prizeWon} Credited`,
    };
  }
  if (d.matchMode === "kill" && d.userEarnings > 0) {
    // Kill earnings — silver gradient.
    return {
      bg: "bg-gradient-to-br from-[#F1F1F1] via-[#D4D4D4] to-[#9C9C9C]",
      fg: "text-[#1f1f1f]",
      kicker: (<><Swords size={12} /> Match Complete</>),
      title: `⚔️ ₹${d.userEarnings} Earned`,
    };
  }
  // Neutral — no payout. Muted tones from design system.
  return {
    bg: "bg-secondary",
    fg: "text-foreground",
    kicker: (<><CircleCheck size={12} /> Match Complete</>),
    title: `#${d.userPosition} Finish`,
  };
}
