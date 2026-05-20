import { cn } from "@/lib/utils";

/**
 * Small red circular AX coin badge — used inline with numbers (slots, entry
 * fees, prize pools) to give the AX currency more visual weight.
 *
 * Pure SVG so it scales crisply at any size. Color uses the active theme's
 * primary token, so it adapts when the user changes themes.
 */
export function AxCoinIcon({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground) / 0.25)"
        strokeWidth="1.2"
      />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill="hsl(var(--primary-foreground))"
      >
        A
      </text>
    </svg>
  );
}
