type BracketMatch = {
  top: string;
  bottom: string;
};

type BracketRound = {
  title: string;
  matches: BracketMatch[];
  // Later rounds get more vertical breathing room between cards, so the
  // column reads as "funneling" toward the final rather than every round
  // looking like the same flat list - a rough bracket-tree impression
  // without needing to actually measure/connect cards with lines.
  gapClass: string;
};

// Static shell: seeding for the actual gameweek that determines seeds 1-14
// hasn't happened yet (TBC, a gameweek closer to Christmas), so this shows
// the fixed matchup shape by seed number only - no manager names, no live
// winners. Seeds 1 and 2 get byes straight to the quarter-final.
const ROUNDS: BracketRound[] = [
  {
    title: "Round of 12",
    gapClass: "gap-4",
    matches: [
      { top: "Seed 8", bottom: "Seed 9" },
      { top: "Seed 4", bottom: "Seed 13" },
      { top: "Seed 5", bottom: "Seed 12" },
      { top: "Seed 7", bottom: "Seed 10" },
      { top: "Seed 3", bottom: "Seed 14" },
      { top: "Seed 6", bottom: "Seed 11" },
    ],
  },
  {
    title: "Quarter-Final",
    gapClass: "gap-10",
    matches: [
      { top: "Seed 1", bottom: "Winner: 8 v 9" },
      { top: "Winner: 4 v 13", bottom: "Winner: 5 v 12" },
      { top: "Seed 2", bottom: "Winner: 7 v 10" },
      { top: "Winner: 3 v 14", bottom: "Winner: 6 v 11" },
    ],
  },
  {
    title: "Semi-Final",
    gapClass: "gap-24",
    matches: [
      { top: "QF1 Winner", bottom: "QF2 Winner" },
      { top: "QF3 Winner", bottom: "QF4 Winner" },
    ],
  },
  {
    title: "Final",
    gapClass: "gap-0",
    matches: [{ top: "SF1 Winner", bottom: "SF2 Winner" }],
  },
];

function MatchCard({ top, bottom }: BracketMatch) {
  return (
    <div className="w-36 shrink-0 rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-300">
      <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/[0.06] truncate">
        {top}
      </div>
      <div className="px-3 py-2 truncate">{bottom}</div>
    </div>
  );
}

export function CupBracket() {
  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4 sm:p-6">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Seeds 1 and 2 get a bye straight to the quarter-final. Seeding is
        decided by a gameweek closer to Christmas (TBC) - highest score that
        week is seed 1, down to lowest as seed 14.
      </p>
      <div className="overflow-x-auto">
        <div className="flex items-center gap-8 min-w-max py-2">
          {ROUNDS.map((round) => (
            <div key={round.title} className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {round.title}
              </p>
              <div className={`flex flex-col ${round.gapClass}`}>
                {round.matches.map((match, i) => (
                  <MatchCard key={i} top={match.top} bottom={match.bottom} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
