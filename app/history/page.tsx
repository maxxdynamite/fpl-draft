import type { ReactNode } from "react";
import { TrophyIcon } from "@/components/TrophyIcon";
import { SpadeIcon } from "@/components/SpadeIcon";
import { ArrowsLeftRightIcon } from "@/components/ArrowsLeftRightIcon";
import { SEASON_HISTORY, getDraftTitleLeaderboard, type SeasonRecord, type SeasonDraftResult } from "@/lib/history";

function groupByPlace(draft: SeasonDraftResult[]): { place: 1 | 2 | 3; managers: string[] }[] {
  const byPlace = new Map<number, string[]>();
  for (const result of draft) {
    byPlace.set(result.place, [...(byPlace.get(result.place) ?? []), result.manager]);
  }
  return [...byPlace.entries()]
    .sort(([a], [b]) => a - b)
    .map(([place, managers]) => ({ place: place as 1 | 2 | 3, managers }));
}

// Gold/silver/bronze get real medal colours, not the brand gradient -
// they need to read as "medal" on sight, distinct from the green/cyan
// used everywhere else in the app (Blackjack qualification, streaks).
const PLACE_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-gradient-to-br from-[#fde68a] to-[#d97706] text-[#3a1d00]",
  2: "bg-gradient-to-br from-[#e4e4e7] to-[#a1a1aa] text-zinc-800",
  3: "bg-gradient-to-br from-[#f0b986] to-[#92400e] text-[#2e1400]",
};

function PlaceBadge({ place }: { place: 1 | 2 | 3 }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-black shrink-0 ${PLACE_STYLES[place]}`}
    >
      {place}
    </span>
  );
}

function TitleRow({ icon, label, names }: { icon: ReactNode; label: string; names: string[] }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 shrink-0">
        {icon}
      </span>
      <span className="shrink-0 font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <span className="font-bold truncate">{names.join(" & ")}</span>
    </div>
  );
}

// Fixed to match the Draft H2H tile / Blackjack card height exactly
// (194px, measured via getBoundingClientRect against both) - scaled
// down from the original spacing to fit the densest season (3 Draft
// places + Blackjack + Cup) inside that budget with p-4's 32px of
// padding rather than the 40px p-5 was spending. Shorter seasons just
// carry blank space at the bottom rather than shrinking to fit their
// own content - same "uniform over ragged" reasoning already used for
// the Blackjack roster's placeholder slots.
function SeasonCard({ record }: { record: SeasonRecord }) {
  const draftGroups = groupByPlace(record.draft);
  const hasFooter = record.blackjack || record.cup;

  return (
    <div className="h-[194px] overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-4">
      <h2 className="flex items-center gap-2 font-extrabold text-base tracking-tight text-zinc-900 dark:text-white mb-2">
        <ArrowsLeftRightIcon size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        {record.season}
      </h2>

      <div className="space-y-1">
        {draftGroups.map((group) => (
          <div key={group.place} className="flex items-center gap-2 text-xs">
            <PlaceBadge place={group.place} />
            <span className="font-bold truncate text-zinc-900 dark:text-white">
              {group.managers.join(" & ")}
            </span>
            {group.managers.length > 1 && (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 shrink-0">
                Joint
              </span>
            )}
          </div>
        ))}
      </div>

      {hasFooter && (
        <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
          {record.blackjack && (
            <TitleRow icon={<SpadeIcon size={10} />} label="Blackjack" names={record.blackjack} />
          )}
          {record.cup && <TitleRow icon={<TrophyIcon size={10} />} label="Cup" names={[record.cup]} />}
        </div>
      )}
    </div>
  );
}

function DraftTitlesLeaderboard() {
  const tallies = getDraftTitleLeaderboard();

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-4 sm:px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        BB Draft Titles
      </p>
      <ul>
        {tallies.map((tally, i) => (
          <li
            key={tally.manager}
            className="flex items-center gap-3 px-4 sm:px-5 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06]"
          >
            <span className="w-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 font-bold truncate text-zinc-900 dark:text-white">
              {tally.manager}
            </span>
            {/* One star per Draft title, not a number - the count reads
                at a glance without needing a legend. */}
            <span className="shrink-0 text-sm tracking-tight" aria-label={`${tally.draftGolds} Draft titles`}>
              {"⭐".repeat(tally.draftGolds)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HistoryPage() {
  const seasons = SEASON_HISTORY;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {seasons.map((record) => (
          <SeasonCard key={record.season} record={record} />
        ))}
      </div>
      <aside className="lg:sticky lg:top-24">
        <DraftTitlesLeaderboard />
      </aside>
    </div>
  );
}
