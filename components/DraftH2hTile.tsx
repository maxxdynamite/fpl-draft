import type { H2hMatchup } from "@/lib/h2h";
import { formatPl, plColor } from "@/lib/format";

// Compact pairing-by-pairing view of the existing H2H wager, reusing the
// same per-manager pl figure components/H2hTile.tsx already shows in full
// detail - here it's condensed to just the two names and their signed £
// figures, one row per rival pair.
export function DraftH2hTile({ matchups }: { matchups: H2hMatchup[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Draft H2H
        </p>
        <p className="text-[10px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
          £5 per GW
        </p>
      </div>
      <ul>
        {matchups.map((m) => (
          <li
            key={`${m.teamA.entryId}-${m.teamB.entryId}`}
            // py-[12.5px] (2x the pot tiles' py-1.5/6px) around two explicit
            // leading-4 lines (2x their one leading-4 line) doubles each
            // row's content+padding - the extra half-pixel corrects for
            // this tile having half as many row borders (7 vs 14 rows,
            // each contributing a 1px border-top), so the totals land on
            // the same overall card height, not just the same row ratio.
            className="flex items-center gap-2 px-3 py-[12.5px] border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
          >
            <span className="flex-1 min-w-0">
              <span className="block leading-4 font-medium truncate">{m.teamA.managerName}</span>
              <span className={`block leading-4 font-semibold ${plColor(m.teamA.pl)}`}>
                {formatPl(m.teamA.pl)}
              </span>
            </span>
            <span className="shrink-0 text-zinc-300 dark:text-zinc-600">vs</span>
            <span className="flex-1 min-w-0 text-right">
              <span className="block leading-4 font-medium truncate">{m.teamB.managerName}</span>
              <span className={`block leading-4 font-semibold ${plColor(m.teamB.pl)}`}>
                {formatPl(m.teamB.pl)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
