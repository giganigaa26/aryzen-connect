import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Horizontal slide page transitions, direction-aware.
 *
 * Direction logic:
 * 1. If both prev and next paths are bottom-nav tabs, slide direction follows
 *    tab order (left tab → comes from left, right tab → comes from right).
 * 2. Otherwise fall back to PUSH/POP from React Router's nav type.
 *
 * IMPORTANT: We compute direction BEFORE updating the ref so that the FIRST
 * render with the new pathname uses the correct slide direction. Previously
 * the ref was updated synchronously each render, which caused the wrong
 * direction on backward navigation (the LTR glitch).
 */
const TAB_ORDER = [
  "/app",
  "/app/matches",
  "/app/wallet",
  "/app/leaderboard",
  "/app/profile",
];

function tabIndex(path: string) {
  if (path === "/app") return 0;
  const idx = TAB_ORDER.findIndex((t) => t !== "/app" && path.startsWith(t));
  return idx;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Track previous path with a ref. We read it FIRST, then update for next render.
  const prevPathRef = useRef(pathname);
  const directionRef = useRef<1 | -1>(1);

  if (prevPathRef.current !== pathname) {
    const curIdx = tabIndex(pathname);
    const prevIdx = tabIndex(prevPathRef.current);

    if (curIdx >= 0 && prevIdx >= 0 && curIdx !== prevIdx) {
      directionRef.current = curIdx > prevIdx ? 1 : -1;
    } else {
      directionRef.current = navType === "POP" ? -1 : 1;
    }
    prevPathRef.current = pathname;
  }

  const direction = directionRef.current;

  const variants = {
    initial: { x: direction === 1 ? "8%" : "-8%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit:    { x: direction === 1 ? "-8%" : "8%", opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        className="min-h-screen will-change-transform"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
