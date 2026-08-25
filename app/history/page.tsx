import type { ReactNode } from "react";
import { TrophyIcon } from "@/components/TrophyIcon";
import { SpadeIcon } from "@/components/SpadeIcon";
import { WrenchIcon } from "@/components/WrenchIcon";
import { ArrowsLeftRightIcon } from "@/components/ArrowsLeftRightIcon";
import {
  SEASON_HISTORY,
  getTitleLeaderboard,
  type SeasonRecord,
  type SeasonDraftResult,
  type TitleCategory,
} from "@/lib/history";

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
      className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-black shrink-0 ${PLACE_STYLES[place]}`}
    >
      {place}
    </span>
  );
}

// Deliberately more muted than the Draft rows above (smaller, semibold
// not bold) - the user wants Draft's top 3 to read as the headline of
// the card, with Blackjack/Cup as a lesser footnote. Winner names still
// get full-bright text so they're legible at a glance.
function TitleRow({ icon, label, names }: { icon: ReactNode; label: string; names: string[] }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="flex items-center justify-center h-4 w-4 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 shrink-0">
        {icon}
      </span>
      <span className="shrink-0 font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <span className="font-semibold truncate text-zinc-900 dark:text-white">
        {names.join(" & ")}
      </span>
    </div>
  );
}

// 194px matches the Draft H2H tile / Blackjack card height exactly
// (measured via getBoundingClientRect against both) - but only for
// seasons with a full two-row footer (Blackjack and Cup) to fill it. A
// Draft-only season, or one with just a single footer category (e.g.
// 2024/25 once Blackjack was pulled - no winner yet), has nothing to
// spend that extra space on, so it sizes to its own content instead of
// carrying dead space just to hit a height nothing on the card needs.
function SeasonCard({ record }: { record: SeasonRecord }) {
  const draftGroups = groupByPlace(record.draft);
  const hasFooter = record.blackjack || record.cup;
  const isFullFooter = record.blackjack && record.cup;

  return (
    <div
      className={`${isFullFooter ? "h-[194px] overflow-hidden" : ""} flex flex-col rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] p-3.5`}
    >
      <h2 className="flex items-center gap-2 font-semibold text-base tracking-tight text-zinc-400 dark:text-zinc-500 mb-1.5">
        <ArrowsLeftRightIcon size={14} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
        {record.season}
      </h2>

      {/* Bigger and bolder than the Blackjack/Cup footer below - Draft's
          top 3 is the headline of every card, the footer is a footnote. */}
      <div className="space-y-1">
        {draftGroups.map((group, i) => (
          <div key={group.place} className="flex items-center gap-2 text-sm">
            <PlaceBadge place={group.place} />
            <span className="font-bold truncate text-zinc-900 dark:text-white flex-1 min-w-0">
              {group.managers.join(" & ")}
            </span>
            {group.managers.length > 1 && (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500 shrink-0">
                Joint
              </span>
            )}
            {/* Golden Spanner sits on the same row as the lowest podium
                place, pinned to the right edge - icon only (no label/name,
                unlike Blackjack/Cup below), same h-6 w-6 medal-badge size
                PlaceBadge itself uses. The manager's name is still there,
                just as a native tooltip rather than visible text. */}
            {i === draftGroups.length - 1 && record.spanner && (
              <span
                className="inline-flex items-center justify-center h-6 w-6 rounded-full shrink-0 bg-gradient-to-br from-[#fde68a] to-[#d97706] text-[#3a1d00]"
                title={`Golden Spanner: ${record.spanner}`}
                aria-label={`Golden Spanner: ${record.spanner}`}
              >
                <WrenchIcon size={12} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Fixed, symmetric mt-2/pt-2 - the divider needs to sit the same
          distance from the Draft rows above it as from the Blackjack/Cup
          rows below it on every card. mt-auto (tried first) instead
          resolved to whatever leftover space each card happened to have,
          which was next to nothing on a card with both Blackjack and Cup
          (barely any room left to distribute) - the divider ended up
          touching the Draft rows on exactly the cards with the most
          footer content. A card with only Cup may show a little space
          below the footer again as a result, a smaller cost than the
          divider spacing being inconsistent. */}
      {hasFooter && (
        <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1.5">
          {record.blackjack && (
            <TitleRow icon={<SpadeIcon size={10} />} label="Blackjack" names={record.blackjack} />
          )}
          {record.cup && <TitleRow icon={<TrophyIcon size={10} />} label="Cup" names={[record.cup]} />}
        </div>
      )}
    </div>
  );
}

// Same panel shape for all three competitions - only the title, category,
// emoji, and hierarchy differ. Each competition gets its own emoji rather
// than a shared star: ⭐ for Draft, 🃏 for Blackjack (the game's own card
// theme), 🎄 for the Christmas Cup (the competition's actual name).
//
// primary (Draft) vs secondary (Blackjack/Cup) mirrors the same
// hierarchy already established on the season cards themselves - Draft
// is the headline competition, Blackjack/Cup are smaller and more muted
// everywhere they appear, not just here.
function TitleLeaderboard({
  title,
  category,
  emoji,
  primary = false,
}: {
  title: string;
  category: TitleCategory;
  emoji: string;
  primary?: boolean;
}) {
  const tallies = getTitleLeaderboard(category);

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      {primary ? (
        <>
          {/* Same treatment as TotalMoneyTile's own header - a thin
              gradient accent strip plus gradient title text, marking
              this out as the headline panel above Blackjack/Cup below
              it, same bg-clip-text technique the site logo itself uses. */}
          <div className="h-1 bg-gradient-to-r from-[#00ff85] to-[#04f5ff]" aria-hidden="true" />
          <p className="inline-block px-4 sm:px-5 pt-2 pb-2 text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
            {title}
          </p>
        </>
      ) : (
        <p className="px-4 sm:px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {title}
        </p>
      )}
      <ul>
        {tallies.map((tally) => (
          <li
            key={tally.manager}
            className={`flex items-center gap-2 px-4 sm:px-5 border-t border-black/[0.04] dark:border-white/[0.06] ${
              primary ? "py-2.5" : "py-1.5"
            }`}
          >
            <span
              className={`flex-1 min-w-0 truncate text-zinc-900 dark:text-white ${
                primary ? "font-bold" : "font-medium text-xs"
              }`}
            >
              {tally.manager}
            </span>
            {/* One emoji per title, not a number - the count reads at a
                glance without needing a legend. */}
            <span
              className={`shrink-0 tracking-tight ${primary ? "text-sm" : "text-[11px]"}`}
              aria-label={`${tally.count} ${title}`}
            >
              {emoji.repeat(tally.count)}
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
      {/* items-start, not the grid default (stretch) - otherwise a
          footer-less card sharing a row with one that has a footer gets
          stretched to match it, exactly the dead space this was meant
          to remove. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {seasons.map((record) => (
          <SeasonCard key={record.season} record={record} />
        ))}
      </div>
      <aside className="lg:sticky lg:top-24 space-y-4">
        <TitleLeaderboard title="BB Draft Titles" category="draft" emoji="⭐" primary />
        {/* Side by side only below lg - the mobile layout gives this row
            the full page width to pair up in, but the desktop sidebar is
            a fixed 260px column where two columns would squeeze each
            name into ~120px. Stays stacked there instead, same as Draft
            above it. */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          <TitleLeaderboard title="BB Blackjack Winners" category="blackjack" emoji="🃏" />
          <TitleLeaderboard title="Christmas Cup Winners" category="cup" emoji="🎄" />
        </div>
      </aside>
    </div>
  );
}
