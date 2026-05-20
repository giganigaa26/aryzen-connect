import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { LangCode } from "@/lib/config";

export type User = {
  phone: string;
  displayName: string;
  nickname: string;
  /** 10-digit in-game user ID (e.g. Free Fire UID). Stored locally for now. */
  gameUid?: string;
  language: LangCode;
};

type AuthContextValue = {
  currentUser: User | null;
  isAuthenticated: boolean;
  setUser: (u: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
  // onboarding flow state
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "aryzen.auth.v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed.user ?? null);
        setOnboardedState(!!parsed.onboarded);
      }
    } catch {}
  }, []);

  const persist = (user: User | null, onboardedVal: boolean) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, onboarded: onboardedVal }));
  };

  const setUser = (u: User | null) => {
    setCurrentUser(u);
    persist(u, onboarded);
  };
  const updateUser = (patch: Partial<User>) => {
    setCurrentUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      persist(next, onboarded);
      return next;
    });
  };
  const setOnboarded = (v: boolean) => {
    setOnboardedState(v);
    persist(currentUser, v);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        setUser,
        updateUser,
        onboarded,
        setOnboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
