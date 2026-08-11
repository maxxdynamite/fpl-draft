"use client";

import { useState } from "react";
import type { PotManager } from "@/lib/money";
import { formatPl } from "@/lib/format";

// Same green-positive/rose-negative/neutral-zero convention as
// components/H2hTile.tsx's plColor - not exported there, so reproduced here
// rather than adding a shared-import dependency for three lines.
function plColor(net: number) {
  if (net > 0) return "text-emerald-600 dark:text-emerald-400";
  if (net < 0) return "text-rose-600 dark:text-rose-400";
  return "text-zinc-400";
}

// The Draft league's 1st/2nd/3rd payout can't join the who-owes-who grid
// (eleven losing managers' entry fees fund three different winners in
// different amounts - no single counterparty per debt), so it keeps its
// own simple per-manager summary instead.
export function DraftPotSummary({ managers }: { managers: PotManager[] }) {
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);
  const nothingLoggedYet = managers.every((m) => m.entries.length === 0);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Draft league pot · settles at season end
      </p>
      {nothingLoggedYet ? (
        <p className="px-3 pb-3 text-xs text-zinc-400 dark:text-zinc-500">
          Nothing logged yet.
        </p>
      ) : (
        <ul>
          {managers
            .filter((m) => m.entries.length > 0)
            .sort((a, b) => b.net - a.net)
            .map((m, i) => {
              const expanded = expandedEntryId === m.entryId;
              return (
                <li
                  key={m.entryId}
                  className="border-t border-black/[0.04] dark:border-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedEntryId(expanded ? null : m.entryId)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left"
                  >
                    <span className="w-5 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium truncate">{m.managerName}</span>
                      <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                        {m.teamName}
                      </span>
                    </span>
                    <span className={`tabular-nums font-bold ${plColor(m.net)}`}>
                      {formatPl(m.net)}
                    </span>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className={`shrink-0 transition-transform duration-200 text-zinc-400 dark:text-zinc-500 ${
                        expanded ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 4.5L6 8L9.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {expanded && (
                    <div className="px-3 pb-2 pl-10 grid gap-0.5">
                      {m.entries.map((entry, j) => (
                        <div
                          key={j}
                          className="flex items-center justify-between gap-3 text-xs py-0.5"
                        >
                          <span className="text-zinc-500 dark:text-zinc-400">{entry.label}</span>
                          <span className={`tabular-nums font-semibold ${plColor(entry.amount)}`}>
                            {formatPl(entry.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
