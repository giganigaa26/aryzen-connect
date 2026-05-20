import { NavLink, useLocation } from "react-router-dom";
import { Home, Trophy, Wallet, User, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/matches", label: "My Matches", icon: Trophy },
  { to: "/app/wallet", label: "Wallet", icon: Wallet },
  { to: "/app/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { to: "/app/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  // Hide bottom nav on match details
  if (pathname.startsWith("/app/match/")) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <ul className="grid grid-cols-5 px-1 pt-1.5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "relative flex flex-col items-center gap-0.5 py-1.5 select-none transition-transform duration-150 ease-out active:scale-[0.92]",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex items-center justify-center transition-transform duration-150 ease-out will-change-transform",
                      isActive && "scale-110"
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-primary"
                      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
