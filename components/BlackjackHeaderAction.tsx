"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// "Make Your Picks" only makes sense as a call-to-action from elsewhere in
// the section - on the picks page itself it's redundant (you're already
// here), so it swaps to a plain back link to the main Blackjack page
// instead. Same pill treatment either way, just label/destination differ,
// so the title row's height/alignment stays untouched.
export function BlackjackHeaderAction() {
  const pathname = usePathname();
  const onPicksPage = pathname === "/blackjack/picks";

  return (
    <Link
      href={onPicksPage ? "/blackjack" : "/blackjack/picks"}
      className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a] shadow-[var(--shadow-soft)] hover:opacity-90 transition-opacity"
    >
      {onPicksPage ? (
        // An SVG icon instead of a "←" text glyph - a character's weight
        // and vertical position are stuck to the font's own metrics, an
        // SVG's stroke width and box alignment aren't.
        <span className="flex items-center gap-2">
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
        </span>
      ) : (
        "Make Your Picks"
      )}
    </Link>
  );
}
