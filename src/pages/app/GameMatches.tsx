import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Construction } from "lucide-react";
import { GAMES, MODES_BY_GAME, type Game } from "@/lib/config";
import { DUMMY_MATCHES } from "@/lib/stubs";
import { MatchCard } from "./Home";
import { cn } from "@/lib/utils";

/**
 * Game-specific screen — opens when a user taps a game card on Home.
 * - Active games show their own mode rail + filtered matches.
 * - Inactive games show a friendly "Coming soon" empty state.
 *
 * Modes are read from MODES_BY_GAME so the admin can change them in config
 * without touching this component.
 */
export default function GameMatches() {
  const { gameId } = useParams();
  const nav = useNavigate();
  const game = GAMES.find((g) => g.id === gameId) as Game | undefined;

  if (!game) {
    return (
      <div className="p-6">
        <button onClick={() => nav(-1)} className="press -ml-2 h-10 w-10 flex items-center justify-center text-muted-foreground">
          <ArrowLeft size={22} />
        </button>
        <p className="mt-4 text-muted-foreground">Game not found.</p>
      </div>
    );
  }

  return (
    <>
      <header className="safe-top sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="h-14 px-2 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="press h-10 w-10 flex items-center justify-center text-muted-foreground">
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold tracking-tight truncate leading-tight">{game.name}</h1>
            <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
              {game.active ? `${game.count} live ${game.count === 1 ? "match" : "matches"}` : "Not available yet"}
            </p>
          </div>
        </div>
      </header>

      {game.active ? <ActiveGameView game={game} /> : <ComingSoon game={game} />}
    </>
  );
}

function ActiveGameView({ game }: { game: Game }) {
  // Prepend "All" so users can see every match for this game at once.
  const modes = useMemo(
    () => [{ id: "all", label: "All" }, ...MODES_BY_GAME[game.id].map((m) => ({ id: m.id, label: m.label }))],
    [game.id]
  );
  const [modeId, setModeId] = useState<string>("all");

  const matches = DUMMY_MATCHES.filter((m) => {
    if (m.game !== game.id) return false;
    if (modeId === "all") return true;
    const label = MODES_BY_GAME[game.id].find((mm) => mm.id === modeId)?.label;
    return m.mode === label;
  });

  return (
    <>
      <section className="px-4 mt-3">
        <div className="rounded-full bg-secondary border border-border p-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {modes.map((m) => {
              const sel = modeId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setModeId(m.id)}
                  className={cn(
                    "relative press shrink-0 px-4 h-8 rounded-full text-sm font-semibold transition-colors whitespace-nowrap",
                    sel ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sel && (
                    <motion.span
                      layoutId="gameModePill"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  )}
                  <span className="relative z-10">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 mt-4 space-y-3 pb-6">
        {matches.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm">
            No matches in this mode yet.
          </div>
        ) : (
          matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut", delay: i * 0.05 }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))
        )}
      </section>
    </>
  );
}

function ComingSoon({ game }: { game: Game }) {
  return (
    <div className="px-6 pt-16 pb-12 flex flex-col items-center text-center">
      <div className={cn("h-20 w-20 rounded-3xl flex items-center justify-center", game.accent)}>
        <Construction size={36} />
      </div>
      <h2 className="mt-5 text-2xl font-extrabold tracking-tight">Coming soon…</h2>
      <p className="text-muted-foreground mt-2 max-w-xs">
        {game.name} tournaments aren't live yet. We'll notify you the moment they go up.
      </p>
    </div>
  );
}
