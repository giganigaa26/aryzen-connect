import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { DEFAULT_PALETTE, PaletteId, ThemeMode } from "@/lib/themes";

type Ctx = {
  mode: ThemeMode;            // always "dark" — app is dark-only
  palette: PaletteId;         // selected color palette
  effectiveMode: "dark";      // resolved mode (always dark)
  setMode: (m: ThemeMode) => void;
  setPalette: (p: PaletteId) => void;
  // Legacy helpers kept so existing callers still compile.
  theme: "dark";
  toggle: () => void;
};

const ThemeContext = createContext<Ctx | undefined>(undefined);
const KEY_PALETTE = "aryzen.theme.palette";

function applyDom(palette: PaletteId) {
  const root = document.documentElement;
  root.setAttribute("data-theme", palette);
  // Dark-only: always force the .dark class so surfaces stay consistent.
  root.classList.add("dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>(DEFAULT_PALETTE);

  // Hydrate palette from localStorage
  useEffect(() => {
    const savedPalette = (localStorage.getItem(KEY_PALETTE) as PaletteId | null) ?? DEFAULT_PALETTE;
    setPaletteState(savedPalette);
  }, []);

  // Re-apply DOM whenever palette changes (mode is fixed to dark).
  useEffect(() => {
    applyDom(palette);
  }, [palette]);

  const setPalette = useCallback((p: PaletteId) => {
    setPaletteState(p);
    localStorage.setItem(KEY_PALETTE, p);
  }, []);

  // No-op stubs preserved for back-compat with legacy callers.
  const setMode = useCallback((_m: ThemeMode) => {}, []);
  const toggle = useCallback(() => {}, []);

  return (
    <ThemeContext.Provider
      value={{
        mode: "dark",
        palette,
        effectiveMode: "dark",
        setMode,
        setPalette,
        theme: "dark",
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
