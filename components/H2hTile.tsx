"use client";

import { useState } from "react";
import type { H2hMatchup } from "@/lib/h2h";
import { formatPl } from "@/lib/format";

function SideHeader({
  managerName,
  teamName,
  align,
}: {
  managerName: string;
  teamName: string;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="font-bold text-sm leading-tight truncate">
        {managerName}
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
        {teamName}
      </p>
    </div>
  );
}

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [expanded, setExpanded] = useState(false);
  const { teamA, teamB, history } = matchup;

  const aAhead = teamA.wins > teamB.wins;
  const bAhead = teamB.wins > teamA.wins;

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <SideHeader
            managerName={teamA.managerName}
            teamName={teamA.teamName}
            align="left"
          />
          <span className="shrink-0 text-[10px] font-bold text-zinc-300 dark:text-zinc-700">
            VS
          </span>
          <SideHeader
            managerName={teamB.managerName}
            teamName={teamB.teamName}
            align="right"
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <span
            className={`text-3xl font-extrabold tabular-nums ${aAhead ? "" : "text-zinc-400 dark:text-zinc-600"}`}
          >
            {teamA.wins}
          </span>

          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              H2H wins
            </p>
            {teamA.latestGameweek && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 tabular-nums">
                GW{teamA.latestGameweek}: {teamA.latestScore} - {teamB.latestScore}
              </p>
            )}
          </div>

          <span
            className={`text-3xl font-extrabold tabular-nums ${bAhead ? "" : "text-zinc-400 dark:text-zinc-600"}`}
          >
            {teamB.wins}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <span
            className={`text-xs font-semibold ${
              teamA.pl > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : teamA.pl < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-400"
            }`}
          >
            {formatPl(teamA.pl)}
          </span>
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
            {expanded ? "Hide" : "Show"} history
          </span>
          <span
            className={`text-xs font-semibold ${
              teamB.pl > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : teamB.pl < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-zinc-400"
            }`}
          >
            {formatPl(teamB.pl)}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-black/[0.04] dark:border-white/[0.06] px-4 sm:px-5 py-3">
          {history.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2 text-center">
              No gameweeks played yet.
            </p>
          ) : (
            <ul>
              {history.map((row) => (
                <li
                  key={row.gameweek}
                  className="grid grid-cols-[36px_1fr_16px_1fr] items-center py-1.5 text-sm"
                >
                  <span className="text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                    GW{row.gameweek}
                  </span>
                  <span
                    className={`tabular-nums font-semibold text-right pr-2 ${
                      row.aScore > row.bScore
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {row.aScore}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700 text-xs text-center">
                    –
                  </span>
                  <span
                    className={`tabular-nums font-semibold pl-2 ${
                      row.bScore > row.aScore
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {row.bScore}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
