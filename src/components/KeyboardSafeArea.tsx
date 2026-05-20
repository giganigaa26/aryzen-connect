import { useEffect } from "react";

/**
 * Keyboard-overlap fix for forms (web + APK / WebView).
 *
 * Mobile keyboards usually shrink the visual viewport. We listen on
 * `window.visualViewport.resize` and:
 *   1. Add bottom padding to <body> equal to the keyboard height so any
 *      sticky / mt-auto CTAs are pushed above the keyboard.
 *   2. Scroll the currently focused input into view (centered) so the user
 *      always sees what they're typing AND the action button below it.
 *
 * Mount once at the root (App.tsx). No props required.
 */
export function KeyboardSafeArea() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      // Push everything up by the keyboard height.
      document.body.style.paddingBottom = overlap > 0 ? `${overlap}px` : "";

      // Scroll the active input into view so it AND nearby buttons are visible.
      const el = document.activeElement as HTMLElement | null;
      if (overlap > 0 && el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
        // Slight delay so layout settles before scrolling.
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      document.body.style.paddingBottom = "";
    };
  }, []);

  return null;
}
