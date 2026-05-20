import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchAnnouncement, type Announcement } from "@/lib/stubs";

/**
 * Announcement modal — shows once per announcement ID after login.
 *
 * Behavior:
 *  - Calls `fetchAnnouncement()` (currently a stub returning null).
 *  - If an announcement exists and the user hasn't dismissed THIS specific
 *    `id`, show it. Dismissals are stored per-id in localStorage so a new
 *    announcement (different id) will show again.
 *  - "Don't show again" checkbox stores a permanent dismissal for that id.
 *  - "X" close just hides for this session unless the checkbox is on.
 *  - Optional CTA opens an external URL in a new tab.
 *
 * To enable: replace the body of `fetchAnnouncement()` in src/lib/stubs.ts
 * with a Supabase call (or any remote fetch) returning an Announcement.
 */
const DISMISS_KEY = (id: string) => `aryzen.announcement.dismissed.${id}`;

export function AnnouncementModal() {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAnnouncement().then((a) => {
      if (!active || !a) return;
      if (localStorage.getItem(DISMISS_KEY(a.id))) return;
      setAnn(a);
      setOpen(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleClose = (next: boolean) => {
    if (!next && ann && dontShow) {
      localStorage.setItem(DISMISS_KEY(ann.id), "1");
    }
    setOpen(next);
  };

  if (!ann) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">{ann.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {ann.body}
          </DialogDescription>
        </DialogHeader>

        {ann.cta && (
          <Button
            size="lg"
            className="w-full mt-2"
            onClick={() => {
              window.open(ann.cta!.url, "_blank", "noopener,noreferrer");
              handleClose(false);
            }}
          >
            {ann.cta.label}
          </Button>
        )}

        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[hsl(var(--primary))]"
          />
          Don&apos;t show this again
        </label>
      </DialogContent>
    </Dialog>
  );
}
