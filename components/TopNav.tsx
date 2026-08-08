"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

function SpadeIcon() {
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
      <path d="M12 18v4" />
      <path d="M2 14.499a5.5 5.5 0 0 0 9.591 3.675.6.6 0 0 1 .818.001A5.5 5.5 0 0 0 22 14.5c0-2.29-1.5-4-3-5.5l-5.492-5.312a2 2 0 0 0-3-.02L5 8.999c-1.5 1.5-3 3.2-3 5.5" />
    </svg>
  );
}

const links = [
  { href: "/draft", label: "Draft", Icon: ArrowsLeftRightIcon },
  { href: "/blackjack", label: "Blackjack", Icon: SpadeIcon },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/draft"
          className="font-extrabold text-3xl tracking-tight"
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
