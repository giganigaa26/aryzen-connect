import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Clock as Unlock, Copy, Users, Plus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchMatchTeams, fetchUserTeam, createTeam, joinTeamByCode,
  joinUnlockedTeam, toggleTeamLock, type MatchTeam, type ModeKind,
} from "@/lib/stubs";
import { MODES_BY_GAME } from "@/lib/config";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Phase = "pre-join" | "post-join";

interface SquadTeamsProps {
  matchId: string;
  game: "freefire" | "bgmi" | "stumble" | "codm";
  mode: string;
  joined: boolean;
  userId?: string;
}

export function SquadTeams({ matchId, game, mode, joined, userId }: SquadTeamsProps) {
  const [phase, setPhase] = useState<Phase>("pre-join");
  const [teams, setTeams] = useState<MatchTeam[]>([]);
  const [userTeam, setUserTeam] = useState<MatchTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [teamCodeInput, setTeamCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockToggling, setLockToggling] = useState(false);
  const [joining, setJoining] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MatchTeam | null>(null);
  const [confirmJoinOpen, setConfirmJoinOpen] = useState(false);

  const modeInfo = MODES_BY_GAME[game]?.find((m) => m.label === mode);
  const maxSize = modeInfo?.playersPerSlot ?? 4;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [allTeams, userT] = await Promise.all([
        fetchMatchTeams(matchId),
        userId ? fetchUserTeam(userId, matchId) : Promise.resolve(null),
      ]);
      setTeams(allTeams);
      if (userT) {
        setUserTeam(userT);
        setPhase("post-join");
      } else {
        setPhase("pre-join");
      }
      setLoading(false);
    };
    load();
  }, [matchId, userId]);

  const handleCreateTeam = async () => {
    if (!userId) return;
    setJoining(true);
    try {
      const newTeam = await createTeam(matchId, userId, maxSize);
      setUserTeam(newTeam);
      setTeams((prev) => [...prev, newTeam]);
      setPhase("post-join");
      setJoinDialogOpen(false);
      toast.success("Squad created!");
    } catch {
      toast.error("Couldn't create squad");
    } finally {
      setJoining(false);
    }
  };

  const handleJoinByCode = async () => {
    const code = teamCodeInput.trim().toUpperCase();
    if (!code) {
      setCodeError("Enter team code");
      return;
    }
    setCodeError("");
    setJoining(true);
    try {
      const result = await joinTeamByCode(userId || "", code);
      setUserTeam(result.team);
      setTeams((prev) => prev.map((t) => (t.id === result.team.id ? result.team : t)));
      setPhase("post-join");
      setJoinDialogOpen(false);
      setTeamCodeInput("");
      toast.success("Joined squad!");
    } catch {
      setCodeError("Invalid code");
      toast.error("Couldn't join squad");
    } finally {
      setJoining(false);
    }
  };

  const handleJoinUnlocked = async (team: MatchTeam) => {
    if (!userId || team.memberCount >= team.maxSize) return;
    setSelectedTeam(team);
    setConfirmJoinOpen(true);
  };

  const confirmJoinUnlocked = async () => {
    if (!userId || !selectedTeam) return;
    setConfirmJoinOpen(false);
    setJoining(true);
    try {
      const result = await joinUnlockedTeam(userId, selectedTeam.id);
      setUserTeam(result.team);
      setTeams((prev) => prev.map((t) => (t.id === result.team.id ? result.team : t)));
      setPhase("post-join");
      toast.success("Joined squad!");
    } catch {
      toast.error("Couldn't join squad");
    } finally {
      setJoining(false);
      setSelectedTeam(null);
    }
  };

  const handleToggleLock = async () => {
    if (!userTeam) return;
    setLockToggling(true);
    try {
      const updated = await toggleTeamLock(userTeam.id, !userTeam.isLocked);
      setUserTeam(updated);
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setLockDialogOpen(false);
      toast.success(updated.isLocked ? "Squad locked" : "Squad unlocked");
    } catch {
      toast.error("Couldn't toggle lock");
    } finally {
      setLockToggling(false);
    }
  };

  const copyTeamCode = () => {
    if (!userTeam) return;
    navigator.clipboard?.writeText(userTeam.teamCode);
    toast.success("Team code copied!");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading squads...</div>;
  }

  if (phase === "post-join" && userTeam) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Your Squad</div>
                <div className="text-sm font-semibold">#{userTeam.teamNumber}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {userTeam.memberCount}/{userTeam.maxSize}
              </div>
              <div className="text-[10px] text-muted-foreground">members</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <span className="text-xs font-mono font-bold text-foreground">{userTeam.teamCode}</span>
              <button
                onClick={copyTeamCode}
                className="press ml-auto h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <Copy size={12} />
              </button>
            </div>

            {userTeam.isLocked ? (
              <div className="text-[10px] font-semibold text-destructive inline-flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10">
                <Lock size={10} /> Locked
              </div>
            ) : (
              <div className="text-[10px] font-semibold text-success inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10">
                <Unlock size={10} /> Unlocked
              </div>
            )}
          </div>

          <button
            onClick={() => setLockDialogOpen(true)}
            className="press mt-3 w-full h-9 rounded-lg bg-secondary text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors"
          >
            {userTeam.isLocked ? "Unlock Squad" : "Lock Squad"}
          </button>
        </div>

        <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{userTeam.isLocked ? "Unlock Squad?" : "Lock Squad?"}</AlertDialogTitle>
              <AlertDialogDescription>
                {userTeam.isLocked
                  ? "Anyone can join with your team code again."
                  : "No new members can join without the code."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleLock}
                disabled={lockToggling}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {lockToggling ? "..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {teams.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>No squads yet</p>
          <button
            onClick={() => setJoinDialogOpen(true)}
            className="press mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            <Plus size={12} /> Create Squad
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            {teams.map((team) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={() => {
                    if (!team.isLocked && team.memberCount < team.maxSize) {
                      handleJoinUnlocked(team);
                    }
                  }}
                  disabled={team.isLocked || team.memberCount >= team.maxSize}
                  className={cn(
                    "press w-full text-left p-3 rounded-xl border transition-all",
                    team.isLocked
                      ? "border-border bg-secondary/40 cursor-not-allowed opacity-60"
                      : team.memberCount >= team.maxSize
                      ? "border-border bg-secondary/40 cursor-not-allowed opacity-60"
                      : "border-success/30 bg-success/5 hover:border-success/60 hover:bg-success/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {!team.isLocked && team.memberCount < team.maxSize && (
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Squad #{team.teamNumber}
                        </div>
                        <div className="text-sm font-semibold text-foreground truncate">
                          {team.memberCount}/{team.maxSize} members
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {team.isLocked ? (
                        <Lock size={14} className="text-destructive" />
                      ) : (
                        <Unlock size={14} className="text-success" />
                      )}
                      <Users size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          <button
            onClick={() => setJoinDialogOpen(true)}
            className="press w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Plus size={14} /> Create New Squad
          </button>
        </>
      )}

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Join Squad</DialogTitle>
            <DialogDescription>Create your own or join with a code</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Have a code?
              </label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  placeholder="Enter team code"
                  value={teamCodeInput}
                  onChange={(e) => {
                    setTeamCodeInput(e.target.value.toUpperCase());
                    setCodeError("");
                  }}
                  className="flex-1 rounded-lg"
                />
                <Button
                  onClick={handleJoinByCode}
                  disabled={joining}
                  className="rounded-lg"
                >
                  Join
                </Button>
              </div>
              {codeError && <div className="text-xs text-destructive mt-1">{codeError}</div>}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            <Button
              onClick={handleCreateTeam}
              disabled={joining}
              variant="outline"
              className="w-full rounded-lg"
            >
              {joining ? "Creating..." : "Create New Squad"}
            </Button>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setJoinDialogOpen(false);
                setTeamCodeInput("");
                setCodeError("");
              }}
              variant="ghost"
              className="rounded-lg"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmJoinOpen} onOpenChange={setConfirmJoinOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Join Squad #{selectedTeam?.teamNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll be added to this squad. Confirm payment on next screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmJoinUnlocked}
              disabled={joining}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {joining ? "..." : "Join"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
