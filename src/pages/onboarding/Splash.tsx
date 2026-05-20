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
          {/* Spacer top */}
          <div className="flex-1" />

          {/* Brand lockup: helmet + wordmark */}
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center">
              {/* Helmet — zoom in, then slide left */}
              <motion.div
                initial={{ scale: 0.3, opacity: 0, x: 0 }}
                animate={{
                  scale: [0.3, 1.15, 1, 1],
                  opacity: [0, 1, 1, 1],
                  x: [0, 0, 0, -4],
                }}
                transition={{
                  duration: 1.4,
                  times: [0, 0.55, 0.7, 1],
                  ease: "easeOut",
                }}
                className="relative shrink-0"
              >
                {/* Pulsing red glow */}
                <motion.div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full blur-3xl"
                  style={{ background: RED }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{
                    opacity: [0, 0.55, 0.4, 0.5, 0.4],
                    scale: [0.6, 1.15, 1.0, 1.1, 1.0],
                  }}
                  transition={{
                    duration: 2.4,
                    times: [0, 0.4, 0.6, 0.8, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                />
                <img
                  src={helmet}
                  alt="Aryzen Arena"
                  className="h-28 w-28 object-contain drop-shadow-[0_0_24px_rgba(220,38,38,0.55)]"
                  draggable={false}
                />
              </motion.div>

              {/* Wordmark — uncovered by the helmet via width reveal */}
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                transition={{
                  width: { delay: 1.25, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  opacity: { delay: 1.3, duration: 0.4 },
                }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="pl-3 leading-none">
                  <div
                    className="text-4xl font-black tracking-tight"
                    style={{ color: RED }}
                  >
                    ARYZEN
                  </div>
                  <div className="mt-1 text-lg font-light tracking-[0.35em] text-white/90">
                    ARENA
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Supporting copy */}
          <div className="flex flex-1 flex-col items-center justify-start gap-2 pt-2 text-center">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.9, duration: 0.45 }}
              className="text-base font-semibold text-white"
            >
              Real Tournaments. Real Money.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.45 }}
              className="text-xs font-medium text-white/60"
            >
              🇮🇳 Made by Gamers, for Gamers
            </motion.p>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 2.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <button
              onClick={handleStart}
              className="press w-full rounded-2xl py-4 text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(220,38,38,0.7)]"
              style={{ backgroundColor: RED }}
            >
              Get Started
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
