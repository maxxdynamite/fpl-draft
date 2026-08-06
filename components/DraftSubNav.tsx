"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/draft/league", label: "League" },
  { href: "/draft/h2h", label: "H2H" },
  { href: "/draft/cup", label: "Cup" },
];

export function DraftSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
