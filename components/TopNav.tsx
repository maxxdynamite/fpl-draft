"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpadeIcon } from "./SpadeIcon";
import { PoundIcon } from "./PoundIcon";

function ArrowsLeftRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}

const links = [
  { href: "/draft", label: "Draft", Icon: ArrowsLeftRightIcon },
  { href: "/blackjack", label: "Blackjack", Icon: SpadeIcon },
  { href: "/money", label: "Money", Icon: PoundIcon },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/draft"
          className="font-extrabold text-sm sm:text-2xl md:text-3xl tracking-tight whitespace-nowrap shrink-0"
        >
          Bad Blokes{" "}
          <span className="bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
            Weekly
          </span>
        </Link>

        <nav className="flex items-center gap-1 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] shadow-[var(--shadow-pressed)]">
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
      </div>
    </header>
  );
}
