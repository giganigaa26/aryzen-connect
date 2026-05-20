import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Progress bar that animates fill from 0 → value on mount.
 * Uses transform scaleX (no layout) — 60fps friendly.
 */
export function AnimatedProgress({
  value,
  className,
  barClassName,
  duration = 1,
}: {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  duration?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 rounded-full bg-secondary overflow-hidden", className)}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration, ease: "easeOut" }}
        style={{ transformOrigin: "left center" }}
        className={cn("h-full bg-primary rounded-full origin-left w-full transition-colors duration-300 ease-out", barClassName)}
      />
    </div>
  );
}
