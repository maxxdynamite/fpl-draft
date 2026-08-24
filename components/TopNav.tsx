"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpadeIcon } from "./SpadeIcon";
import { PoundIcon } from "./PoundIcon";
import { TrophyIcon } from "./TrophyIcon";
import { ArrowsLeftRightIcon } from "./ArrowsLeftRightIcon";

function ChevronDownIcon({ flipped }: { flipped: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${flipped ? "rotate-180" : ""}`}
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const links = [
  { href: "/draft", label: "Draft", Icon: ArrowsLeftRightIcon },
  { href: "/blackjack", label: "Blackjack", Icon: SpadeIcon },
  { href: "/money", label: "Money", Icon: PoundIcon },
  { href: "/history", label: "History", Icon: TrophyIcon },
];

export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeLink = links.find((link) => pathname.startsWith(link.href)) ?? links[0];

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/draft"
          className="font-extrabold text-2xl md:text-3xl tracking-tight whitespace-nowrap shrink-0"
        >
          Bad Blokes{" "}
          <span className="bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
            Weekly
          </span>
        </Link>

        {/* Full pill nav - four tabs need ~673px at the sm breakpoint's own
            logo size (measured directly via getBoundingClientRect, not
            estimated), which doesn't fit inside sm's 640px - the three-tab
            version fit fine at 640 (comfortable margin down to ~460px),
            but the added History tab ate that margin and then some. Switch
            point moved to md (768px) instead, where the logo's own jump to
            text-3xl only pushes the total to ~725px - comfortable again -
            rather than shrinking the pill or re-tuning its padding. */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] shadow-[var(--shadow-pressed)]">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  active
                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[var(--shadow-soft)]"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <link.Icon />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile/narrow-tablet dropdown - single pill showing the active
            section, expands into the same links on tap. Covers up to md
            (768px) now, not just sm (640px) - see the pill nav's own
            comment above for why the switch point moved. */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-black/[0.04] dark:bg-white/[0.06] shadow-[var(--shadow-pressed)] text-zinc-900 dark:text-white"
          >
            <activeLink.Icon />
            {activeLink.label}
            <ChevronDownIcon flipped={menuOpen} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] dark:ring-white/[0.1] overflow-hidden z-20">
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-black/[0.04] dark:bg-white/[0.06] text-zinc-900 dark:text-white"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <link.Icon />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
