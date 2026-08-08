"use client";

import { useEffect, useRef, useState } from "react";
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
function StreakBadge({ streak, hide }: { streak: number; hide: boolean }) {
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
      className={`relative isolate inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide transition-opacity duration-300 ${tierClasses} ${
        show ? (hide ? "opacity-0" : "opacity-100") : "invisible"
      }`}
    >
      {tier === 3 && (
        <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none streak-t3-shimmer" />
      )}
      {streak} Week Streak
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 first:pt-0 last:pb-0">
      <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
      <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function PlayerStatsMenu({
  align,
  draftPosition,
  overallRank,
  totalPoints,
  motwCount,
  sotwCount,
}: {
  align: "left" | "right";
  draftPosition: number | null;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
}) {
  return (
    <div
      className={`absolute top-full ${align === "right" ? "right-0" : "left-0"} mt-1.5 z-30 w-44 rounded-lg bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.06] dark:ring-white/[0.1] p-2.5 text-xs opacity-0 invisible pointer-events-none transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto`}
    >
      <StatRow label="Draft Order" value={draftPosition?.toString() ?? "TBD"} />
      <StatRow label="Overall Rank" value={overallRank?.toString() ?? "–"} />
      <StatRow label="Total Points" value={totalPoints?.toString() ?? "–"} />
      <StatRow label="MOTW" value={motwCount?.toString() ?? "–"} />
      <StatRow label="SOTW" value={sotwCount?.toString() ?? "–"} />
    </div>
  );
}

function SideHeader({
  managerName,
  teamName,
  align,
  streak,
  dark,
  draftPosition,
  overallRank,
  totalPoints,
  motwCount,
  sotwCount,
}: {
  managerName: string;
  teamName: string;
  align: "left" | "right";
  streak: number;
  dark: boolean;
  draftPosition: number | null;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="group relative cursor-default">
        <p
          className={`font-bold text-sm leading-tight truncate transition-colors duration-300 ${
            dark ? "text-[#04211a]" : "text-zinc-900 dark:text-white"
          }`}
        >
          {managerName}
        </p>
        <PlayerStatsMenu
          align={align}
          draftPosition={draftPosition}
          overallRank={overallRank}
          totalPoints={totalPoints}
          motwCount={motwCount}
          sotwCount={sotwCount}
        />
      </div>
      <p
        className={`text-xs truncate mt-0.5 transition-colors duration-300 ${
          dark ? "text-[#04211a]/70" : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {teamName}
      </p>
      <StreakBadge streak={streak} hide={dark} />
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

const RIGHT_FADE_WIDTH = 24;

export function H2hTile({ matchup }: { matchup: H2hMatchup }) {
  const [showAllGameweeks, setShowAllGameweeks] = useState(false);
  const { teamA, teamB, history } = matchup;
  const scrollRef = useRef<HTMLDivElement>(null);

  const historyByGw = new Map(history.map((row) => [row.gameweek, row]));
  const latestGw =
    history.length > 0 ? Math.max(...history.map((row) => row.gameweek)) : 1;

  // Jump straight to the latest played gameweek whenever the sheet opens,
  // with enough runway past it to clear the right-edge fade entirely —
  // otherwise the gameweek someone actually cares about seeing is either
  // scrolled out of view (once the season is past ~GW8) or sitting faded
  // right at the edge.
  useEffect(() => {
    if (!showAllGameweeks) return;
    const area = scrollRef.current;
    const target = area?.querySelector<HTMLDivElement>(
      `[data-gw="${latestGw}"]`,
    );
    if (!area || !target) return;
    const targetRight = target.offsetLeft + target.offsetWidth;
    area.scrollLeft = Math.max(
      0,
      targetRight + RIGHT_FADE_WIDTH - area.clientWidth,
    );
  }, [showAllGameweeks, latestGw]);

  return (
    <div className="relative rounded-2xl shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="absolute inset-0 bg-white dark:bg-zinc-900" />
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#00ff85] to-[#04f5ff] transition-[clip-path] duration-[380ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
            draftPosition={teamA.draftPosition}
            overallRank={teamA.overallRank}
            totalPoints={teamA.totalPoints}
            motwCount={teamA.motwCount}
            sotwCount={teamA.sotwCount}
          />
          <SideHeader
            managerName={teamB.managerName}
            teamName={teamB.teamName}
            align="right"
            streak={teamB.streak}
            dark={showAllGameweeks}
            draftPosition={teamB.draftPosition}
            overallRank={teamB.overallRank}
            totalPoints={teamB.totalPoints}
            motwCount={teamB.motwCount}
            sotwCount={teamB.sotwCount}
          />
        </div>

        {/* Fixed-height slot shared by both states — never resizes, so
            toggling only ever crossfades opacity inside it, nothing jumps. */}
        <div className="relative mt-0.5 h-16">
          <div
            className={`absolute inset-0 grid grid-cols-[1fr_auto_1fr] items-start gap-3 transition-opacity duration-300 ${
              showAllGameweeks ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <span className="text-4xl font-extrabold tabular-nums tracking-tight">
              {teamA.latestScore ?? 0}
            </span>
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Head-to-Head
              </p>
              <p className="text-lg font-bold tabular-nums mt-0.5">
                <span
                  className={
                    teamA.wins > teamB.wins
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {teamA.wins}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400"> – </span>
                <span
                  className={
                    teamB.wins > teamA.wins
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  {teamB.wins}
                </span>
              </p>
            </div>
            <span className="text-4xl font-extrabold tabular-nums tracking-tight text-right">
              {teamB.latestScore ?? 0}
            </span>
          </div>

          <div
            className={`absolute left-0 right-0 bottom-0 -top-[8px] transition-opacity duration-300 ${
              showAllGameweeks ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-8 z-10 flex flex-col items-start pl-0.5 pointer-events-none">
              <span className="h-2 mb-1.5" aria-hidden="true" />
              <span className="h-4 w-6 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[8px] font-extrabold flex items-center justify-center">
                {initials(teamA.managerName)}
              </span>
              <span className="h-4 w-6 rounded-[5px] bg-[#04211a] text-[#00ff85] text-[8px] font-extrabold flex items-center justify-center mt-2.5">
                {initials(teamB.managerName)}
              </span>
            </div>

            <div
              ref={scrollRef}
              className="no-scrollbar h-full overflow-x-auto overflow-y-hidden -mx-4 sm:-mx-5 pl-4 sm:pl-5 [mask-image:linear-gradient(to_right,transparent,transparent_20px,black_64px,black_calc(100%-24px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,transparent_20px,black_64px,black_calc(100%-24px),transparent)]"
            >
              <div className="flex items-start gap-1 w-max">
                <div className="flex-none w-11" aria-hidden="true" />
                {Array.from({ length: TOTAL_GAMEWEEKS }, (_, i) => i + 1).map(
                  (gw) => {
                    const row = historyByGw.get(gw);
                    const aWin = row ? row.aScore > row.bScore : null;
                    return (
                      <div
                        key={gw}
                        data-gw={gw}
                        className="flex-none w-8 flex flex-col items-center"
                      >
                        <span className="h-2 mb-1.5 text-[8px] font-extrabold text-[#04211a]/60 uppercase leading-[8px]">
                          GW{gw}
                        </span>
                        <span
                          className={`h-4 flex items-center justify-center text-base font-extrabold tabular-nums leading-none text-[#04211a] ${
                            row ? (aWin ? "" : "opacity-45") : "opacity-35 font-semibold"
                          }`}
                        >
                          {row ? row.aScore : "–"}
                        </span>
                        <span
                          className={`h-4 flex items-center justify-center text-base font-extrabold tabular-nums leading-none text-[#04211a] mt-2.5 ${
                            row ? (!aWin ? "" : "opacity-45") : "opacity-35 font-semibold"
                          }`}
                        >
                          {row ? row.bScore : "–"}
                        </span>
                      </div>
                    );
                  },
                )}
                <div className="flex-none w-7" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
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
