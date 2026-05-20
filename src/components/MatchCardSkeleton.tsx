/**
 * MatchCardSkeleton — CSS-only shimmer that mirrors the MatchCard layout:
 * two tag pills, title, status line, prize block, map thumbnail and the
 * spots + progress-bar row. Used while `fetchMatches` is pending so the
 * list doesn't reflow when real data lands.
 */
export function MatchCardSkeleton() {
  return (
    <div className="cv-auto bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="min-w-0 flex-1 flex flex-col">
          {/* Tag pills */}
          <div className="flex items-center gap-1.5">
            <div className="shimmer h-4 w-12 rounded-md" />
            <div className="shimmer h-4 w-16 rounded-md" />
          </div>
          {/* Title */}
          <div className="shimmer h-4 w-4/5 rounded mt-2" />
          <div className="shimmer h-4 w-2/5 rounded mt-1.5" />
          {/* Status */}
          <div className="shimmer h-3 w-24 rounded mt-2" />
          {/* Prize block */}
          <div className="mt-2.5">
            <div className="shimmer h-2.5 w-16 rounded" />
            <div className="shimmer h-6 w-28 rounded mt-1.5" />
          </div>
        </div>
        {/* Map thumbnail */}
        <div className="shrink-0">
          <div className="shimmer h-24 w-24 rounded-xl" />
        </div>
      </div>
      {/* Spots + progress bar */}
      <div className="px-3 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="shimmer h-3 w-28 rounded" />
          <div className="shimmer h-3 w-16 rounded" />
        </div>
        <div className="shimmer h-1.5 w-full rounded-full" />
      </div>
      {/* Footer */}
      <div className="border-t border-border bg-secondary/40 p-3">
        <div className="shimmer h-4 w-40 rounded mx-auto" />
      </div>
    </div>
  );
}
