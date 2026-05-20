import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";

/**
 * Dynamic Aryzen logo.
 *
 * Source: APP_CONFIG.logoUrl (set in src/lib/config.ts) — paste the real
 * Aryzen logo URL there. When empty, falls back to a styled "A" badge so the
 * UI never breaks during development.
 *
 * Sizes are square (the logo is rendered as a rounded square mark).
 */
export function AppLogo({
  size = 40,
  className,
  rounded = "rounded-2xl",
  src,
}: {
  size?: number;
  className?: string;
  /** Tailwind rounded-* class — defaults to "rounded-2xl". */
  rounded?: string;
  /** Optional override; falls back to APP_CONFIG.logoUrl. */
  src?: string;
}) {
  // TODO: Replace with Supabase Storage URL in Cursor (set APP_CONFIG.logoUrl).
  const url = src ?? APP_CONFIG.logoUrl;

  if (url) {
    return (
      <img
        src={url}
        alt={`${APP_CONFIG.name} logo`}
        width={size}
        height={size}
        className={cn(
          rounded,
          "object-cover shrink-0 shadow-md shadow-primary/20",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback "A" mark — keeps the UI looking branded until the real logo
  // URL is pasted into config.
  return (
    <div
      className={cn(
        rounded,
        "shrink-0 bg-gradient-to-br from-primary to-accent text-primary-foreground font-extrabold flex items-center justify-center shadow-md shadow-primary/30",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-label={`${APP_CONFIG.name} logo`}
    >
      A
    </div>
  );
}
