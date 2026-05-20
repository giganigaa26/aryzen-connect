import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { axToInr } from "@/lib/config";

/**
 * AxCoin — money display with two modes:
 *  - default (decision surfaces: prize tables, match cards, join CTAs):
 *    shows ₹ ONLY. Cleaner, easier to decide on.
 *  - showAx (wallet + transaction ledger only): shows AX with ₹ secondary.
 *
 * String values (e.g. "—") render as-is without conversion.
 *
 * Currency-display rule (project-wide): ₹ for decisions, AX for the ledger.
 * Dual display is allowed only on the top bar and wallet screen.
 */
export function AxCoin({
  amount,
  className,
  size = 14,
  showAx = false,
}: {
  amount: number | string;
  className?: string;
  size?: number;
  /** Wallet/ledger contexts only. */
  showAx?: boolean;
}) {
  const isNum = typeof amount === "number";

  if (!isNum) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-semibold tabular-nums", className)}>
        <Coins size={size} className="text-warning" />
        <span>{amount}</span>
      </span>
    );
  }

  if (showAx) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-semibold tabular-nums", className)}>
        <Coins size={size} className="text-warning" />
        <span>{amount.toLocaleString()} AX</span>
        <span className="text-muted-foreground/60 font-bold">|</span>
        <span className="text-muted-foreground font-medium text-[0.85em]">
          ₹{axToInr(amount).toLocaleString()}
        </span>
      </span>
    );
  }

  // Decision-surface default — ₹ only.
  return (
    <span className={cn("inline-flex items-center font-semibold tabular-nums", className)}>
      <span>₹{axToInr(amount).toLocaleString()}</span>
    </span>
  );
}
