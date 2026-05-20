import { ReactNode } from "react";
import { HeaderBell } from "@/components/HeaderBell";

/**
 * Standard screen header. Always renders the global notifications bell on
 * the right (before any caller-provided `right` slot) so notifications are
 * one tap away from every screen.
 */
export function ScreenHeader({
  title,
  right,
  left,
  hideBell = false,
}: {
  title: string;
  right?: ReactNode;
  left?: ReactNode;
  /** Set true for screens that need a bare header (e.g. modals). */
  hideBell?: boolean;
}) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {left}
          <h1 className="text-lg font-bold tracking-tight truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {!hideBell && <HeaderBell />}
        </div>
      </div>
    </header>
  );
}
