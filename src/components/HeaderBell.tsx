import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationsContext";

/**
 * Bell button — used in every screen header. Opens the global
 * NotificationsSheet (mounted once in AppLayout) and shows an unread badge
 * (max "9+") that updates in realtime via NotificationsContext.
 */
export function HeaderBell() {
  const { unread, openPanel } = useNotifications();
  return (
    <button
      onClick={openPanel}
      className="press relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-extrabold flex items-center justify-center leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
