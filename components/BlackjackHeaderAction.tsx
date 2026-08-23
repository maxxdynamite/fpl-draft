"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// "Make Your Picks" only makes sense as a call-to-action from elsewhere in
// the section - on the picks page itself it's redundant (you're already
// here), so it swaps to a plain back link to the main Blackjack page
// instead. Same pill treatment either way, just label/destination differ,
// so the title row's height/alignment stays untouched.
export function BlackjackHeaderAction({
  pickingWindowOpen,
}: {
  pickingWindowOpen: boolean;
}) {
  const pathname = usePathname();
  const onPicksPage = pathname === "/blackjack/picks";

  // "Back" always stays a real, clickable link regardless of the window -
  // it's just navigation, and the picks page itself already shows its own
  // "Picks are locked" messaging when closed. Only the "Make Your Picks"
  // call-to-action - the one that'd lead someone into a form they can't
  // actually submit right now - gets greyed out and made inert.
  if (!onPicksPage && !pickingWindowOpen) {
    return (
      <span
        aria-disabled="true"
        className="flex items-center gap-2 px-4 pt-[5px] pb-[7px] rounded-full text-sm font-semibold bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed"
      >
        Make Your Picks
      </span>
    );
  }

  return (
    <Link
      href={onPicksPage ? "/blackjack" : "/blackjack/picks"}
      // flex items-center lives on the Link itself, not a wrapper only the
      // "Back" state had - both states need to share one layout mechanism
      // or their box heights (and therefore how centered the text looks)
      // can drift apart from each other, exactly what happened when only
      // "Back" got its own inner flex span.
      //
      // pt-[5px] pb-[7px] (not py-1.5) is a deliberate 1px optical nudge,
      // not a bug fix - measured directly, the text's real glyph box
      // already sits exactly centered (6.5px clear above and below) under
      // symmetric padding, but text centered inside a rounded pill still
      // reads as slightly low to the eye, since the pill's own curve pulls
      // the eye's sense of "center" up. A first attempt at pt-1 pb-2 (2px)
      // overshot the other way. Same total padding (12px) as before either
      // way, so the pill's height doesn't change - only where the content
      // sits within it.
      className="flex items-center gap-2 px-4 pt-[5px] pb-[7px] rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] hover:opacity-90 transition-opacity"
    >
      {onPicksPage ? (
        <>
          {/* An SVG icon instead of a "←" text glyph - a character's weight
              and vertical position are stuck to the font's own metrics, an
              SVG's stroke width and box alignment aren't. */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back
        </>
      ) : (
        "Make Your Picks"
      )}
    </Link>
  );
}
