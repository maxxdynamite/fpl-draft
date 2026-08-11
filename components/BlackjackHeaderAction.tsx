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
      {onPicksPage ? "← Back" : "Make Your Picks"}
    </Link>
  );
}
