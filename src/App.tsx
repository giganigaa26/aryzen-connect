import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { KeyboardSafeArea } from "@/components/KeyboardSafeArea";
import { AnnouncementModal } from "@/components/AnnouncementModal";

import Splash from "./pages/onboarding/Splash";
import Welcome from "./pages/onboarding/Welcome";
import Language from "./pages/onboarding/Language";
import ThemePick from "./pages/onboarding/ThemePick";
import AuthOptions from "./pages/onboarding/AuthOptions";
import Phone from "./pages/onboarding/Phone";
import Email from "./pages/onboarding/Email";
import OTP from "./pages/onboarding/OTP";
import SetupProfile from "./pages/onboarding/SetupProfile";

import AppLayout from "./pages/app/AppLayout";
import Home from "./pages/app/Home";
import MyMatches from "./pages/app/MyMatches";
import Wallet from "./pages/app/Wallet";
import Profile from "./pages/app/Profile";
import LeaderboardPage from "./pages/app/Leaderboard";
import MatchDetails from "./pages/app/MatchDetails";
import ThemePage from "./pages/app/Theme";
import GameMatches from "./pages/app/GameMatches";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, onboarded } = useAuth();
  if (isAuthenticated && onboarded) return <Navigate to="/app" replace />;
  return <Splash />;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, onboarded } = useAuth();
  if (!isAuthenticated || !onboarded) return <Navigate to="/welcome" replace />;
  return (
    <>
      {children}
      {/* In-app announcement (shown once per id, dismissible). */}
      <AnnouncementModal />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Sonner position="top-center" duration={2500} closeButton={false} />
          {/* Pushes content above the soft keyboard on focus. */}
          <KeyboardSafeArea />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/language" element={<Language />} />
              <Route path="/theme-pick" element={<ThemePick />} />
              <Route path="/auth" element={<AuthOptions />} />
              <Route path="/phone" element={<Phone />} />
              <Route path="/email" element={<Email />} />
              <Route path="/otp" element={<OTP />} />
              <Route path="/setup-profile" element={<SetupProfile />} />

              <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Home />} />
                <Route path="matches" element={<MyMatches />} />
                <Route path="wallet" element={<Wallet />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="theme" element={<ThemePage />} />
                <Route path="game/:gameId" element={<GameMatches />} />
                <Route path="match/:id" element={<MatchDetails />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
