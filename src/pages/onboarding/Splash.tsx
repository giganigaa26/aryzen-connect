import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import helmet from "@/assets/aryzen-helmet.png";

/**
 * Splash / landing — premium animated reveal of the Aryzen Arena brand.
 *
 * Sequence (≈2.5s):
 *  1. Helmet zooms into center with a pulsing red glow.
 *  2. Helmet slides left; "ARYZEN / ARENA" is uncovered (width reveal).
 *  3. Subtitle + tagline fade in.
 *  4. "Get Started" CTA slides up from bottom.
 *
 * Theme: hard-locked to vibrant red (#DC2626) regardless of the user's
 * saved palette. Once the user taps Get Started we navigate into the
 * onboarding flow which re-applies their chosen theme automatically.
 */
const RED = "#DC2626";

export default function Splash() {
  const nav = useNavigate();
  const [exiting, setExiting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleStart = () => {
    setExiting(true);
    setTimeout(() => nav("/language", { replace: true }), 350);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-black px-6 py-10 safe-top safe-bottom"
        >
          {/* Preload — invisible until decoded. Drives isLoaded. */}
          <img
            src={helmet}
            alt=""
            aria-hidden
            onLoad={() => setIsLoaded(true)}
            className="hidden"
          />

          {/* Spacer top */}
          <div className="flex-1" />

          {/* Brand lockup: helmet + wordmark */}
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center">
              {isLoaded && (
                <>
              {/* Helmet — zoom in, then slide left */}
              <motion.div
                initial={{ scale: 0, opacity: 0, x: 0 }}
                animate={{
                  scale: [0, 1, 1, 1],
                  opacity: [0, 1, 1, 1],
                  x: [0, 0, -8, -8],
                }}
                transition={{
                  duration: 2.5,
                  times: [0, 0.6, 1, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative shrink-0"
              >
                {/* Breathing red glow — starts after slide settles (2.5s) */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full blur-3xl"
                  style={{ background: RED }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.15, 0.9] }}
                  transition={{
                    delay: 2.5,
                    duration: 2.8,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
                <img
                  src={helmet}
                  alt="Aryzen Arena"
                  className="h-56 w-56 object-contain drop-shadow-[0_0_32px_rgba(220,38,38,0.6)]"
                  draggable={false}
                />
              </motion.div>

              {/* Wordmark — unveiled by the helmet's slide */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "auto" }}
                transition={{
                  delay: 1.5,
                  duration: 1.0,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="pl-3 leading-none">
                  <div
                    className="text-7xl tracking-tight"
                    style={{ color: RED, fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    ARYZEN
                  </div>
                  <div
                    className="mt-1 text-xl tracking-[0.4em] text-white/90"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    ARENA
                  </div>
                </div>
              </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Supporting copy */}
          <div className="flex flex-1 flex-col items-center justify-start gap-2 pt-2 text-center">
            {isLoaded && (
              <>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.8, duration: 0.45 }}
                  className="font-sans text-base font-semibold text-white"
                >
                  Real Tournaments. Real Money.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 3.0, duration: 0.45 }}
                  className="font-sans text-xs font-medium text-white/60"
                >
                  🇮🇳 Made by Gamers, for Gamers
                </motion.p>
              </>
            )}
          </div>

          {/* CTA */}
          {isLoaded && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 3.4, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <button
                onClick={handleStart}
                className="press relative w-full overflow-hidden rounded-2xl border border-white/10 py-4 text-base font-bold tracking-wide text-white shadow-[0_0_0_1px_rgba(220,38,38,0.4),0_10px_40px_-8px_rgba(220,38,38,0.7),inset_0_1px_0_rgba(255,255,255,0.18)]"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, #ef4444 0%, #DC2626 55%, #991b1b 100%)",
                }}
              >
                <span className="relative z-10">Get Started</span>
                {/* Top gloss highlight */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)",
                  }}
                />
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
