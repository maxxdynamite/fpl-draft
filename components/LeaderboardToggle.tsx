"use client";

import { useState } from "react";

export type LeaderboardRow = {
  entryId: number;
  teamName: string;
  value: number;
  rank?: number;
};

export function LeaderboardToggle({
  leagueName,
  overallRows,
  gameweekRows,
  latestGw,
}: {
  leagueName: string;
  overallRows: LeaderboardRow[];
  gameweekRows: LeaderboardRow[];
  latestGw: number | null;
}) {
  const [mode, setMode] = useState<"overall" | "gameweek">("overall");
  const rows = mode === "overall" ? overallRows : gameweekRows;

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 truncate">
          {leagueName}
        </p>
        {latestGw !== null && (
          <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={() => setMode("overall")}
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-colors ${
                mode === "overall"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[var(--shadow-soft)]"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              Overall
            </button>
            <button
              type="button"
              onClick={() => setMode("gameweek")}
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-colors ${
                mode === "gameweek"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-[var(--shadow-soft)]"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              GW{latestGw}
            </button>
          </div>
        )}
      </div>
      <ul>
        {rows.map((row, i) => (
          <li
            key={row.entryId}
            className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
          >
            <span className="w-5 shrink-0 text-right tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
              {row.rank ?? i + 1}
            </span>
            <span className="flex-1 font-medium truncate">
              {row.teamName}
            </span>
            <span className="tabular-nums font-bold">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
