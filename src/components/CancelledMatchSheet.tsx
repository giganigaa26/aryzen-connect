import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedProgress } from "@/components/AnimatedProgress";
import {
  fetchCancelledMatchDetails,
  type CancelledMatchDetails,
} from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Centered modal sheet shown when tapping a cancelled match in My Matches → History.
 * Data shape comes from `fetchCancelledMatchDetails()` (stub today, Supabase later).
 */
export function CancelledMatchSheet({
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
  const [data, setData] = useState<CancelledMatchDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !matchId) return;
    let alive = true;
    setLoading(true);
    setData(null);
    fetchCancelledMatchDetails(matchId, currentUser?.phone ?? null).then((d) => {
      if (!alive) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [matchId, open, currentUser?.phone]);

  const entryFeeInr = data ? data.entryFeePaise / 100 : 0;
  const hasRefund = !!data && entryFeeInr > 0;
  const pct = data ? Math.round((data.filledSlots / data.totalSlots) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[400px] rounded-2xl p-0 overflow-hidden">
        {/* Header strip — muted, signals "cancelled" without alarm. */}
        <div className="bg-muted/60 px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <XCircle size={20} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogHeader className="space-y-0.5 text-left">
                <DialogTitle className="text-base font-extrabold truncate">
                  {loading || !data ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    data.title
                  )}
                </DialogTitle>
                <DialogDescription className="text-[12px] font-semibold text-muted-foreground">
                  {loading || !data ? (
                    <Skeleton className="h-3 w-20 mt-1" />
                  ) : (
                    data.mode
                  )}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Slots bar */}
          <div>
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Users size={13} />
                {loading || !data ? (
                  <Skeleton className="h-3 w-28" />
                ) : (
                  <span>
                    <span className="font-bold text-foreground tabular-nums">
                      {data.filledSlots}
                    </span>
                    {" / "}
                    <span className="tabular-nums">{data.totalSlots}</span>{" "}
                    players joined
                  </span>
                )}
              </span>
            </div>
            <AnimatedProgress value={pct} duration={0.8} barClassName="bg-muted-foreground/60" />
          </div>

          {/* Reason — small gray text */}
          <div className="text-[12px] leading-relaxed text-muted-foreground">
            {loading || !data ? (
              <>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-1.5" />
              </>
            ) : (
              data.cancellationReason
            )}
          </div>

          {/* Refund row — only when entry fee > 0 */}
          {hasRefund && (
            <div className="flex items-center gap-2.5 rounded-xl bg-success/10 border border-success/25 px-3 py-2.5">
              <CheckCircle2 size={18} className="text-success shrink-0" />
              <div className="text-[13px] font-bold text-foreground">
                ₹{entryFeeInr.toLocaleString()} refunded to your wallet
              </div>
            </div>
          )}

          {/* Reassurance line */}
          <p className="text-[12px] italic text-muted-foreground leading-relaxed">
            {hasRefund
              ? "Your entry has been fully refunded to your wallet. No action is required from your side."
              : "This match was free to enter, so no refund is required. Thanks for your patience."}
          </p>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>
              Okay
            </Button>
            <Button
              onClick={() => {
                onClose();
                nav("/app/wallet");
              }}
            >
              Wallet →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
