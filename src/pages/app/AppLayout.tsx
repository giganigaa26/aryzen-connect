import { Outlet } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { UpcomingMatchBar } from "@/components/UpcomingMatchBar";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { NotificationsSheet } from "@/components/NotificationsSheet";

export default function AppLayout() {
  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background">
        {/* Sits above content, below each screen's app header. The bar pushes
            page content down (it's part of normal flow, not absolute). */}
        <UpcomingMatchBar />
        <main className="pb-24 overflow-x-hidden">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
        <BottomNav />
        {/* Mounted once globally — every header's bell opens THIS sheet. */}
        <NotificationsSheet />
      </div>
    </NotificationsProvider>
  );
}
