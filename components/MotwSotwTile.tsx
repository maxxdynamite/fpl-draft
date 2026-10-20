import { formatPl, plColor } from "@/lib/format";

const MOTW_SOTW_STAKE = 5;

export type MotwSotwRow = {
  entryId: number;
  managerName: string;
  motwCount: number;
  sotwCount: number;
  // Season-cumulative £ net from the stake - computed by the caller
  // (lib/gwScores.ts's computeMotwSotwMoney), not derived from the counts
  // here, since a tied week splits the fixed £5 pot rather than paying
  // the full stake per tied manager.
  net: number;
};

// A fixed £5 pot moves every gameweek - normally one SOTW pays one MOTW
// in full, but a tie on either side splits it evenly instead of paying
// the full stake per tied manager. Degrades gracefully to an all-zero
// list before any gameweeks have been played.
export function MotwSotwTile({ rows }: { rows: MotwSotwRow[] }) {
  const ranked = [...rows].sort((a, b) => b.net - a.net);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Draft MOTW/SOTW
        </p>
        <p className="text-[10px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
          £{MOTW_SOTW_STAKE} per GW
        </p>
      </div>
      <ul>
        {ranked.map((r, i) => (
          <li
            key={r.entryId}
            className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
          >
            <span className="w-5 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 flex items-baseline gap-1.5">
              <span className="font-medium truncate">{r.managerName}</span>
              <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
                MOTW {r.motwCount} · SOTW {r.sotwCount}
              </span>
            </span>
            <span className={`shrink-0 tabular-nums font-bold ${plColor(r.net)}`}>{formatPl(r.net)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
