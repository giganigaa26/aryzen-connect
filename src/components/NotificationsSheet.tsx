import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BellOff,
  CheckCheck,
  Gamepad2,
  Trophy,
  IndianRupee,
  Send,
  Ticket,
  ShieldAlert,
  Gift,
  Megaphone,
  XCircle,
} from "lucide-react";
import { fetchNotifications, markAsRead, markAllAsRead, resolveDeeplink, type Notification, type NotificationType } from "@/lib/stubs";
import { useNotifications } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";

/**
 * Slide-in notifications panel. Mounted ONCE globally in AppLayout — every
 * header's bell opens this same instance via NotificationsContext.
 *
 * Backend: stubbed via localStorage (see fetchNotifications / markAsRead in
 * src/lib/stubs.ts). Wire to Supabase queries on a `notifications` table.
 * Realtime updates are pushed into the badge count by NotificationsContext
 * via `subscribeToNotifications` (currently a no-op stub).
 */
export function NotificationsSheet() {
  const nav = useNavigate();
  const { open, closePanel, setUnread, refresh } = useNotifications();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchNotifications();
      // Newest first.
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(list);
      setUnread(list.filter((n) => !n.read).length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTap = async (n: Notification) => {
    if (!n.read) {
      await markAsRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      refresh();
    }
    // Resolve deeplink (explicit path or per-type default). null = just close.
    const path = resolveDeeplink(n);
    closePanel();
    if (path) nav(path);
  };

  const handleReadAll = async () => {
    await markAllAsRead();
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={(v) => (v ? null : closePanel())}>
      <SheetContent
        side="right"
        className="w-full max-w-[400px] sm:max-w-[400px] p-0 bg-background border-l border-border"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-left text-xl font-extrabold tracking-tight">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={handleReadAll}
                className="press inline-flex items-center gap-1 text-xs font-bold text-primary"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground text-left">
              {unreadCount} unread
            </p>
          )}
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-72px)]">
          {loading && items.length === 0 && (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl shimmer" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center px-6 pt-24">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <BellOff size={26} className="text-muted-foreground" />
              </div>
              <h3 className="font-extrabold text-base">No new notifications</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
                Money updates, rewards and alerts will appear here.
              </p>
            </div>
          )}

          <ul className="divide-y divide-border">
            {items.map((n) => {
              const tappable = !!n.deeplink || !n.read;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "press-card px-4 py-3 flex gap-3 items-start",
                    tappable && "cursor-pointer",
                    !n.read && "bg-primary/[0.04]"
                  )}
                  onClick={() => tappable && handleTap(n)}
                >
                  <TypeIcon type={n.type} muted={n.read} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm leading-tight truncate">{n.title}</h4>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/80 mt-1 font-medium">
                      {relTime(n.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Per-type coloured icon disc. Colours stay consistent across light/dark
 * because they use Tailwind named colours with low-opacity bg + solid fg.
 */
function TypeIcon({ type, muted }: { type: NotificationType; muted: boolean }) {
  const map: Record<NotificationType, { Icon: typeof Trophy; bg: string; fg: string }> = {
    match_new:   { Icon: Gamepad2,    bg: "bg-emerald-500/15", fg: "text-emerald-500" },
    prize:       { Icon: Trophy,      bg: "bg-amber-500/15",   fg: "text-amber-500"   },
    deposit:     { Icon: IndianRupee, bg: "bg-emerald-500/15", fg: "text-emerald-500" },
    withdrawal:  { Icon: Send,        bg: "bg-orange-500/15",  fg: "text-orange-500"  },
    ticket:      { Icon: Ticket,      bg: "bg-purple-500/15",  fg: "text-purple-500"  },
    ban:         { Icon: ShieldAlert, bg: "bg-destructive/15", fg: "text-destructive" },
    referral:    { Icon: Gift,        bg: "bg-pink-500/15",    fg: "text-pink-500"    },
    broadcast:       { Icon: Megaphone,   bg: "bg-primary/15",     fg: "text-primary"     },
    match_result:    { Icon: Trophy,      bg: "bg-amber-500/15",   fg: "text-amber-500"   },
    match_cancelled: { Icon: XCircle,     bg: "bg-destructive/15", fg: "text-destructive" },
  };
  const { Icon, bg, fg } = map[type];
  return (
    <div
      className={cn(
        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
        muted ? "bg-secondary text-muted-foreground" : `${bg} ${fg}`,
      )}
    >
      <Icon size={16} />
    </div>
  );
}

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
