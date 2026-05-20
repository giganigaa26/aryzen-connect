import { useEffect, useState } from "react";

/**
 * Compact circular countdown ring shown around the Reveal button.
 * Smoothly animates the ring as time elapses. Pure SVG → 60fps friendly.
 */
export function CountdownRing({
  targetDate,
  size = 44,
  stroke = 3,
  children,
}: {
  targetDate: Date;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Normalise to a 1-hour window so the ring is meaningful even for far-off
  // matches. Edit this single value to change behaviour globally.
  const WINDOW_MS = 60 * 60 * 1000;
  const remaining = Math.max(0, targetDate.getTime() - now);
  const pct = 1 - Math.min(1, remaining / WINDOW_MS);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-border" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
