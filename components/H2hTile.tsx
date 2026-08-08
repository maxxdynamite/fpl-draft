"use client";

import { useState } from "react";
import type { H2hMatchup } from "@/lib/h2h";
import { formatPl } from "@/lib/format";

const TOTAL_GAMEWEEKS = 38;

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
  dark,
}: {
  managerName: string;
  teamName: string;
  align: "left" | "right";
  streak: number;
  dark: boolean;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p
        className={`font-bold text-sm leading-tight truncate transition-colors duration-300 ${
          dark ? "text-[#04211a]" : "text-zinc-900 dark:text-white"
        }`}
      >
        {managerName}
      </p>
      <p
        className={`text-xs truncate mt-0.5 transition-colors duration-300 ${
          dark ? "text-[#04211a]/70" : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {teamName}
      </p>
      <StreakBadge streak={streak} />
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path
        d={direction === "up" ? "M2.5 7.5L6 4L9.5 7.5" : "M2.5 4.5L6 8L9.5 4.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [showAllGameweeks, setShowAllGameweeks] = useState(false);
  const { teamA, teamB, history } = matchup;

  const historyByGw = new Map(history.map((row) => [row.gameweek, row]));

  return (
    <div className="relative rounded-2xl shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-zinc-900" />
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#00ff85] to-[#04f5ff] transition-[clip-path] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          showAllGameweeks
            ? "[clip-path:inset(0%_0%_0%_0%)]"
            : "[clip-path:inset(100%_0%_0%_0%)]"
        }`}
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SideHeader
            managerName={teamA.managerName}
            teamName={teamA.teamName}
            align="left"
            streak={teamA.streak}
            dark={showAllGameweeks}
          />
          <SideHeader
            managerName={teamB.managerName}
            teamName={teamB.teamName}
            align="right"
            streak={teamB.streak}
            dark={showAllGameweeks}
          />
        </div>

        {showAllGameweeks ? (
          <div className="mt-0.5 h-[46px] overflow-x-auto overflow-y-hidden [scroll-snap-type:x_proximity]">
            <div className="flex items-start gap-3 w-max">
              {Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1).map(
                (gw) => {
                  const row = historyByGw.get(gw);
                  const aWin = row ? row.aScore > row.bScore : null;
                  return (
                    <div
                      key={gw}
                      className="flex-none w-9 flex flex-col items-center [scroll-snap-align:start]"
                    >
                      <span className="text-[9px] font-extrabold text-[#04211a]/60 uppercase mb-1">
                        GW{gw}
                      </span>
                      <span
                        className={`text-base font-extrabold tabular-nums leading-none text-[#04211a] ${
                          row ? (aWin ? "" : "opacity-45") : "opacity-35 font-semibold"
                        }`}
                      >
                        {row ? row.aScore : "–"}
                      </span>
                      <span
                        className={`text-base font-extrabold tabular-nums leading-none text-[#04211a] ${
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
        ) : (
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
        )}

        <div className="flex items-center justify-between gap-3 mt-4">
          <span
            className={`text-xs font-semibold transition-colors duration-300 ${
              showAllGameweeks ? "text-[#04211a]" : plColor(teamA.pl)
            }`}
          >
            {formatPl(teamA.pl)}
          </span>
          <button
            type="button"
            onClick={() => setShowAllGameweeks((v) => !v)}
            className={`flex items-center gap-1 text-[11px] font-semibold transition-colors duration-300 ${
              showAllGameweeks
                ? "text-[#04211a] hover:text-[#04211a]/70"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <ChevronIcon direction={showAllGameweeks ? "down" : "up"} />
            All Gameweeks
            <ChevronIcon direction={showAllGameweeks ? "down" : "up"} />
          </button>
          <span
            className={`text-xs font-semibold transition-colors duration-300 ${
              showAllGameweeks ? "text-[#04211a]" : plColor(teamB.pl)
            }`}
          >
            {formatPl(teamB.pl)}
          </span>
        </div>
      </div>
    </div>
  );
}
