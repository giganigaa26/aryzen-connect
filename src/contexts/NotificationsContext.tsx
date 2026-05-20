import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { fetchNotifications, subscribeToNotifications } from "@/lib/stubs";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Single source of truth for the notifications panel + unread badge.
 *
 * The bell button (in every header) calls `openPanel()` and reads `unread`.
 * The panel itself is mounted once globally in AppLayout so it can slide
 * over any screen.
 *
 * Wire to Supabase realtime in Cursor — replace the stub `subscribeToNotifications`
 * call below with a real channel that pushes new rows into the badge count.
 */
type Ctx = {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
  unread: number;
  setUnread: (n: number) => void;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    const list = await fetchNotifications();
    setUnread(list.filter((n) => !n.read).length);
  }, []);

  useEffect(() => {
    refresh();
    const unsub = subscribeToNotifications(currentUser?.phone ?? null, () => refresh());
    return unsub;
  }, [currentUser?.phone, refresh]);

  return (
    <NotificationsContext.Provider
      value={{
        open,
        openPanel: () => setOpen(true),
        closePanel: () => setOpen(false),
        unread,
        setUnread,
        refresh,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
