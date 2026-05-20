import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import {
  Pencil, Globe, Bell, Palette, LogOut, Gift,
  ChevronRight, User as UserIcon, Hash,
} from "lucide-react";
import { BadgeCard } from "@/components/BadgeCard";
import { BadgeDetailSheet } from "@/components/BadgeDetailSheet";
import { AchievementsSheet } from "@/components/AchievementsSheet";
import { loadPlayerStats, resolveBadges, topUnlockedBadges, type Badge as BadgeT } from "@/lib/badges";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { AnimatedProgress } from "@/components/AnimatedProgress";
import { tierForWins, LANGUAGES } from "@/lib/config";
import { PALETTES } from "@/lib/themes";
import { toast } from "sonner";
import { fetchTotalEarned, updateProfile } from "@/lib/stubs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReferEarnSheet } from "@/components/ReferEarnSheet";



const MATCHES_JOINED = 84;
const MATCHES_WON = 12;

export default function Profile() {
  const { currentUser, updateUser, setUser, setOnboarded } = useAuth();
  const { palette } = useTheme();
  const nav = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [referOpen, setReferOpen] = useState(false);
  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [gameUid, setGameUid] = useState(currentUser?.gameUid ?? "");
  const [savingName, setSavingName] = useState(false);
  const [savingUid, setSavingUid] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const [earned, setEarned] = useState<number | null>(null);
  const [badges, setBadges] = useState<BadgeT[]>([]);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeT | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const currentPalette = PALETTES.find((p) => p.id === palette) ?? PALETTES[0];

  // Functional avatar upload — reads the file locally as a data URL.
  // Hook this up to Supabase Storage once Cloud is wired.
  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please pick an image");
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3 MB");
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
      toast.success("Avatar updated");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let on = true;
    fetchTotalEarned(currentUser?.phone).then((v) => on && setEarned(v));
    loadPlayerStats(currentUser?.phone, MATCHES_JOINED, MATCHES_WON).then((stats) => {
      if (on) setBadges(resolveBadges(stats));
    });
    return () => { on = false; };
  }, [currentUser?.phone]);

  const topBadges = topUnlockedBadges(badges, 3);
  const unlockedCount = badges.filter((b) => b.isUnlocked).length;

  const initials = (currentUser?.displayName ?? "AK")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const currentLevel = "Warrior";
  const xp = 64;

  const openEdit = () => {
    setName(currentUser?.displayName ?? "");
    setGameUid(currentUser?.gameUid ?? "");
    setEditOpen(true);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Display name can't be empty");
    setSavingName(true);
    await updateProfile(trimmed, undefined);
    updateUser({ displayName: trimmed });
    setSavingName(false);
    toast.success("Name updated");
  };
  const saveUid = async () => {
    const digits = gameUid.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 10) {
      return toast.error("Game UID must be 9–10 digits");
    }
    setSavingUid(true);
    await updateProfile(undefined, digits);
    updateUser({ gameUid: digits });
    setSavingUid(false);
    toast.success("Game UID updated");
  };

  const logout = () => {
    setUser(null);
    setOnboarded(false);
    nav("/welcome", { replace: true });
  };

  return (
    <>
      <ScreenHeader title="Profile" />
      <div className="px-4 pt-4 pb-6">
        {/* Identity */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-xl font-extrabold shadow-md relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="absolute inset-0 h-full w-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg leading-tight truncate">
              {currentUser?.displayName ?? "Player"}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground truncate">
                @{currentUser?.nickname ?? "nickname"}
              </span>
              {(() => {
                const t = tierForWins(12);
                return (
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", t.bg, t.color)}>
                    {t.label}
                  </span>
                );
              })()}
            </div>
          </div>
          <button
            onClick={openEdit}
            aria-label="Edit profile"
            className="press h-11 w-11 rounded-full bg-primary/15 text-primary flex items-center justify-center ring-1 ring-primary/30 hover:bg-primary/20 transition-colors"
          >
            <Pencil size={18} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat label="Joined" value="84" />
          <Stat label="Won" value="12" />
          <Stat label="Earned" value={earned == null ? "₹—" : `₹${earned}`} />
        </div>

        {/* Level — simplified: only current + next labels, no stage row */}
        <div className="bg-zinc-900 rounded-2xl border-t border-white/5 p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Player Level</div>
              <div className="font-bold text-lg mt-0.5">{currentLevel}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              Next: <span className="font-semibold text-foreground">Champion</span>
            </div>
          </div>
          {/* Progress bar uses accent color */}
          <AnimatedProgress value={xp} className="mt-3 h-2 [&>div]:bg-accent" duration={1} />
        </div>

        {/* Trophy Case */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">
              Badges <span className="text-muted-foreground font-medium">({unlockedCount}/{badges.length})</span>
            </h3>
            <button
              onClick={() => setAchievementsOpen(true)}
              className="press text-xs font-semibold text-accent flex items-center gap-0.5 hover:underline"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          {topBadges.length > 0 ? (
            <div
              className="grid grid-cols-3 gap-3"
              style={{ contentVisibility: "auto", containIntrinsicSize: "auto 160px" }}
            >
              {topBadges.map((b) => (
                <BadgeCard key={b.id} badge={b} onClick={() => setSelectedBadge(b)} />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border-t border-white/5 rounded-2xl p-4 text-center text-xs text-muted-foreground">
              No badges yet — join your first match to start unlocking.
            </div>
          )}
        </div>

        {/* Account actions */}
        <div className="mt-5 bg-zinc-900 rounded-2xl border-t border-white/5 divide-y divide-white/5 overflow-hidden">
          <ActionRow
            icon={<Gift size={18} />}
            iconClass="bg-accent/15 text-accent"
            label="Refer & Earn"
            sub="Free Bermuda Survival ticket for both"
            onClick={() => setReferOpen(true)}
          />
          <ActionRow
            icon={<Palette size={18} />}
            iconClass="bg-accent/15 text-accent"
            label="Theme & Appearance"
            sub={currentPalette.label}
            onClick={() => nav("/app/theme")}
          />
        </div>

        {/* Settings */}
        <div className="mt-4 bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          <SettingRow icon={<Globe size={18} />} label="Language" value={LANGUAGES.find((l) => l.code === currentUser?.language)?.native ?? "English"} />
          <SettingRow icon={<Bell size={18} />} label="Notifications" right={<Switch checked={notifs} onCheckedChange={setNotifs} />} />
        </div>

        <Button variant="outline" size="lg" className="mt-5 w-full text-destructive border-destructive/50 hover:bg-destructive/5" onClick={logout}>
          <LogOut size={16} /> Logout
        </Button>
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your display name and in-game UID.</DialogDescription>
          </DialogHeader>

          {/* Avatar upload — functional file input */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="avatar-upload"
              className="press relative h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-lg font-extrabold cursor-pointer ring-2 ring-accent/30 hover:ring-accent/60 transition"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                initials
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onAvatarChange}
            />
            <div className="text-xs">
              <button
                type="button"
                onClick={() => document.getElementById("avatar-upload")?.click()}
                className="font-semibold text-accent hover:underline"
              >
                {avatarUrl ? "Change avatar" : "Upload avatar"}
              </button>
              <div className="text-muted-foreground mt-0.5">PNG or JPG, max 3 MB</div>
            </div>
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="dn" className="flex items-center gap-1.5"><UserIcon size={14} /> Display Name</Label>
            <div className="flex gap-2">
              <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
              <Button onClick={saveName} disabled={savingName} size="sm">Save</Button>
            </div>
          </div>

          {/* Game UID */}
          <div className="space-y-1.5">
            <Label htmlFor="uid" className="flex items-center gap-1.5"><Hash size={14} /> Game UID</Label>
            <div className="flex gap-2">
              <Input
                id="uid"
                inputMode="numeric"
                pattern="[0-9]*"
                value={gameUid}
                onChange={(e) => setGameUid(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9–10 digit UID"
                maxLength={10}
              />
              <Button onClick={saveUid} disabled={savingUid} size="sm">Save</Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReferEarnSheet open={referOpen} onOpenChange={setReferOpen} />
      <AchievementsSheet open={achievementsOpen} onOpenChange={setAchievementsOpen} badges={badges} />
      <BadgeDetailSheet badge={selectedBadge} onOpenChange={(o) => !o && setSelectedBadge(null)} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border-t border-white/5 p-3 text-center">
      <div className="text-xl font-extrabold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</div>
    </div>
  );
}

function SettingRow({ icon, label, value, right }: { icon: React.ReactNode; label: string; value?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3.5">
      <div className="h-9 w-9 rounded-lg bg-secondary text-foreground flex items-center justify-center">{icon}</div>
      <div className="flex-1 font-semibold text-sm">{label}</div>
      {value && <div className="text-sm text-muted-foreground">{value}</div>}
      {right}
    </div>
  );
}

function ActionRow({
  icon, iconClass, label, sub, badge, onClick,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  label: string;
  sub?: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="press w-full flex items-center gap-3 p-3.5 text-left">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconClass ?? "bg-secondary text-foreground")}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm leading-tight">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
      {badge && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/15 text-warning">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-muted-foreground" />
    </button>
  );
}
