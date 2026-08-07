"use client";

import { useState } from "react";
import type { H2hMatchup } from "@/lib/h2h";
import { formatPl } from "@/lib/format";

function plColor(pl: number) {
  if (pl > 0) return "text-emerald-600 dark:text-emerald-400";
  if (pl < 0) return "text-rose-600 dark:text-rose-400";
  return "text-zinc-400";
}

// TODO: raise back to 3 once more gameweeks of H2H data exist — lowered to
// 1 for now so the badge is actually visible with only GW1 to work with.
const STREAK_THRESHOLD = 1;

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

// Tier 1 (3+ weeks): solid cyan, text only.
// Tier 2 (5+ weeks): amber gradient, flame icon, pulsing glow.
// Tier 3 (7+ weeks): black "legendary" badge, rainbow halo + shimmer sweep, crown icon.
function StreakBadge({ streak }: { streak: number }) {
  const show = streak >= STREAK_THRESHOLD;
  const tier = streak >= 7 ? 3 : streak >= 5 ? 2 : 1;

  const tierClasses =
    tier === 3
      ? "bg-[#050505] text-white streak-t3"
      : tier === 2
        ? "bg-gradient-to-br from-[#ffc23d] to-[#ff5b04] text-[#1a0900] shadow-[0_0_10px_2px_rgba(255,91,4,0.5)] streak-t2"
        : "bg-[#04f5ff] text-black shadow-[0_0_10px_2px_rgba(4,245,255,0.55)]";

  return (
    <span
      className={`relative isolate inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${tierClasses} ${
        show ? "" : "invisible"
      }`}
    >
      {tier === 3 && (
        <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none streak-t3-shimmer" />
      )}
      {tier === 2 && <FlameIcon className="w-3 h-3 shrink-0" />}
      {tier === 3 && <CrownIcon className="w-3 h-3 shrink-0" />}
      {streak} Week Streak
    </span>
  );
}

function SideHeader({
  managerName,
  teamName,
  align,
  streak,
}: {
  managerName: string;
  teamName: string;
  align: "left" | "right";
  streak: number;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="font-bold text-sm leading-tight truncate">
        {managerName}
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
        {teamName}
      </p>
      <StreakBadge streak={streak} />
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={`transition-transform duration-300 ease-in-out ${expanded ? "rotate-180" : "rotate-0"}`}
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

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [expanded, setExpanded] = useState(false);
  const { teamA, teamB, history } = matchup;

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SideHeader
            managerName={teamA.managerName}
            teamName={teamA.teamName}
            align="left"
            streak={teamA.streak}
          />
          <SideHeader
            managerName={teamB.managerName}
            teamName={teamB.teamName}
            align="right"
            streak={teamB.streak}
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight">
            {teamA.wins}
          </span>
          {teamA.latestGameweek && (
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                GW Points
              </p>
              <p className="text-lg font-bold tabular-nums mt-1">
                <span
                  className={
                    (teamA.latestScore ?? 0) > (teamB.latestScore ?? 0)
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-400 dark:text-zinc-600"
                  }
                >
                  {teamA.latestScore}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700"> – </span>
                <span
                  className={
                    (teamB.latestScore ?? 0) > (teamA.latestScore ?? 0)
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-400 dark:text-zinc-600"
                  }
                >
                  {teamB.latestScore}
                </span>
              </p>
            </div>
          )}
          <span className="text-4xl font-extrabold tabular-nums tracking-tight">
            {teamB.wins}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <span className={`text-xs font-semibold ${plColor(teamA.pl)}`}>
            {formatPl(teamA.pl)}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            All Gameweeks
            <ChevronIcon expanded={expanded} />
          </button>
          <span className={`text-xs font-semibold ${plColor(teamB.pl)}`}>
            {formatPl(teamB.pl)}
          </span>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}
