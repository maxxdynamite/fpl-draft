import type { ReactNode } from "react";
import { TrophyIcon } from "@/components/TrophyIcon";
import { SpadeIcon } from "@/components/SpadeIcon";
import { SEASON_HISTORY, getMostDecorated, type SeasonRecord, type SeasonDraftResult } from "@/lib/history";

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
// used everywhere else on the card (Blackjack qualification, streaks,
// the Defending Champions tag below).
const PLACE_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-gradient-to-br from-[#fde68a] to-[#d97706] text-[#3a1d00]",
  2: "bg-gradient-to-br from-[#e4e4e7] to-[#a1a1aa] text-zinc-800",
  3: "bg-gradient-to-br from-[#f0b986] to-[#92400e] text-[#2e1400]",
};

function PlaceBadge({ place }: { place: 1 | 2 | 3 }) {
  return (
    <span
      className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-extrabold shrink-0 ${PLACE_STYLES[place]}`}
    >
      {place}
    </span>
  );
}

function TitleRow({ icon, label, names }: { icon: ReactNode; label: string; names: string[] }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 shrink-0">
        {icon}
      </span>
      <span className="w-[72px] shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <span className="font-bold truncate">{names.join(" & ")}</span>
    </div>
  );
}

function SeasonCard({ record, isLatest }: { record: SeasonRecord; isLatest: boolean }) {
  const draftGroups = groupByPlace(record.draft);
  const hasFooter = record.blackjack || record.cup;

  return (
    <div className="relative pl-9">
      {/* Sits on top of the timeline's continuous line (below), ring
          matches the page background so the dot reads as a cutout on the
          line rather than the line running straight through it. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 h-3 w-3 rounded-full bg-gradient-to-br from-[#00ff85] to-[#04f5ff] ring-4 ring-[var(--background)]"
      />
      <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
            {record.season}
          </h2>
          {isLatest && (
            <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gradient-to-r from-[#00ff85] to-[#04f5ff] text-[#04211a]">
              Defending Champions
            </span>
          )}
        </div>

        <div className="space-y-2">
          {draftGroups.map((group) => (
            <div key={group.place} className="flex items-center gap-2 text-sm">
              <PlaceBadge place={group.place} />
              <span className="font-bold truncate text-zinc-900 dark:text-white">
                {group.managers.join(" & ")}
              </span>
              {group.managers.length > 1 && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 shrink-0">
                  Joint
                </span>
              )}
            </div>
          ))}
        </div>

        {hasFooter && (
          <div className="mt-3 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2">
            {record.blackjack && (
              <TitleRow icon={<SpadeIcon size={12} />} label="Blackjack" names={record.blackjack} />
            )}
            {record.cup && <TitleRow icon={<TrophyIcon size={12} />} label="Cup" names={[record.cup]} />}
          </div>
        )}
      </div>
    </div>
  );
}

function MostDecorated() {
  const tallies = getMostDecorated().filter((tally) => tally.titles > 0);

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-4 sm:px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Most Decorated
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
            {/* Category breakdown lives on each season's own card instead
                of repeated here - a 260px sidebar has no room to fit it
                next to a full name without truncating mid-word, and the
                gradient total below is the actual headline stat. */}
            <span className="shrink-0 text-base font-extrabold tabular-nums bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
              {tally.titles}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HistoryPage() {
  const seasons = SEASON_HISTORY;
  const earliestSeason = seasons[seasons.length - 1]?.season;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
      <div>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-5">
          {seasons.length} seasons of Bad Blokes Weekly, back to {earliestSeason}.
        </p>
        <div className="relative">
          {/* One continuous line behind every dot, rather than per-card
              math against each other's variable heights - see each dot's
              own ring-cutout comment above for how they sit on top of it. */}
          <div
            aria-hidden="true"
            className="absolute left-[5px] top-2 bottom-2 w-px bg-black/[0.08] dark:bg-white/[0.08]"
          />
          <div className="space-y-5">
            {seasons.map((record, i) => (
              <SeasonCard key={record.season} record={record} isLatest={i === 0} />
            ))}
          </div>
        </div>
      </div>
      <aside className="lg:sticky lg:top-24">
        <MostDecorated />
      </aside>
    </div>
  );
}
