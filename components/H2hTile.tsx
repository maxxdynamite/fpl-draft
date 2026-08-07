"use client";

import { useState } from "react";
import type { H2hMatchup } from "@/lib/h2h";
import { formatPl } from "@/lib/format";

const TOTAL_GAMEWEEKS = 38;

function initials(managerName: string): string {
  const parts = managerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function plColor(pl: number) {
  if (pl > 0) return "text-emerald-600 dark:text-emerald-400";
  if (pl < 0) return "text-rose-600 dark:text-rose-400";
  return "text-zinc-400";
}

const STREAK_THRESHOLD = 3;

// Tier 1 (3+ weeks): solid cyan.
// Tier 2 (5+ weeks): amber gradient, pulsing glow.
// Tier 3 (7+ weeks): black "legendary" badge, rainbow halo + shimmer sweep.
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
      className={`relative isolate inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${tierClasses} ${
        show ? "" : "invisible"
      }`}
    >
      {tier === 3 && (
        <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none streak-t3-shimmer" />
      )}
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

function ChevronUpIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 7.5L6 4L9.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 1l12 12M13 1L1 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [showAllGameweeks, setShowAllGameweeks] = useState(false);
  const { teamA, teamB, history } = matchup;

  const historyByGw = new Map(history.map((row) => [row.gameweek, row]));

  return (
    <div className="relative rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
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

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-0.5">
          <span className="text-4xl font-extrabold tabular-nums tracking-tight">
            {teamA.wins}
          </span>
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              GW Points
            </p>
            <p className="text-lg font-bold tabular-nums mt-0.5">
              <span
                className={
                  (teamA.latestScore ?? 0) > (teamB.latestScore ?? 0)
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }
              >
                {teamA.latestScore ?? 0}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400"> – </span>
              <span
                className={
                  (teamB.latestScore ?? 0) > (teamA.latestScore ?? 0)
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400"
                }
              >
                {teamB.latestScore ?? 0}
              </span>
            </p>
          </div>
          <span className="text-4xl font-extrabold tabular-nums tracking-tight text-right">
            {teamB.wins}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <span className={`text-xs font-semibold ${plColor(teamA.pl)}`}>
            {formatPl(teamA.pl)}
          </span>
          <button
            type="button"
            onClick={() => setShowAllGameweeks(true)}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ChevronUpIcon />
            All Gameweeks
            <ChevronUpIcon />
          </button>
          <span className={`text-xs font-semibold ${plColor(teamB.pl)}`}>
            {formatPl(teamB.pl)}
          </span>
        </div>
      </div>

      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00ff85] to-[#04f5ff] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          showAllGameweeks ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-3.5 py-3 shrink-0">
          <p className="text-[12.5px] font-extrabold text-[#04211a] truncate">
            {teamA.teamName}
            <span className="opacity-55 font-bold mx-1">vs</span>
            {teamB.teamName}
          </p>
          <button
            type="button"
            onClick={() => setShowAllGameweeks(false)}
            aria-label="Close all gameweeks"
            className="shrink-0 w-6 h-6 rounded-full bg-[#04211a]/10 hover:bg-[#04211a]/20 text-[#04211a] flex items-center justify-center transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="relative flex-1 min-h-0">
          <div className="absolute left-0 top-0 bottom-0 w-7 z-10 flex flex-col items-center bg-gradient-to-br from-[#00ff85] to-[#04f5ff] pl-3 pointer-events-none">
            <span className="h-[13px] mb-1.5" aria-hidden="true" />
            <span className="h-4 w-5 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[7px] font-extrabold flex items-center justify-center">
              {initials(teamA.managerName)}
            </span>
            <span className="h-4 w-5 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[7px] font-extrabold flex items-center justify-center">
              {initials(teamB.managerName)}
            </span>
          </div>

          <div className="h-full overflow-x-auto overflow-y-hidden pr-3 pb-2 [scroll-snap-type:x_proximity] [scroll-padding-left:36px]">
            <div className="flex items-start gap-px w-max">
              <div className="flex-none w-9" aria-hidden="true" />
              {Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1).map(
                (gw) => {
                  const row = historyByGw.get(gw);
                  const aWin = row ? row.aScore > row.bScore : null;
                  return (
                    <div
                      key={gw}
                      className="flex-none w-[26px] flex flex-col items-center [scroll-snap-align:start]"
                    >
                      <span className="h-[13px] mb-1.5 text-[7px] font-extrabold text-[#04211a]/60 uppercase leading-[13px]">
                        GW{gw}
                      </span>
                      <span
                        className={`h-4 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-[#04211a] ${
                          row ? (aWin ? "" : "opacity-45") : "opacity-35 font-semibold"
                        }`}
                      >
                        {row ? row.aScore : "–"}
                      </span>
                      <span
                        className={`h-4 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-[#04211a] ${
                          row ? (!aWin ? "" : "opacity-45") : "opacity-35 font-semibold"
                        }`}
                      >
                        {row ? row.bScore : "–"}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-[#04f5ff] to-transparent opacity-90 pointer-events-none" />
        </div>

        <p className="text-center text-[9px] font-bold text-[#04211a]/55 pt-0.5 pb-2.5 shrink-0">
          ← GW11–38 →
        </p>
      </div>
    </div>
  );
}
