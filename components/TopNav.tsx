"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/draft", label: "Draft" },
  { href: "/blackjack", label: "Blackjack" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/draft" className="font-bold text-lg tracking-tight">
          Bad Blokes Weekly
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
