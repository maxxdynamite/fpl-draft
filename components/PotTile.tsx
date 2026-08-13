import { formatPl, plColor } from "@/lib/format";

export type PotRow = { entryId: number; managerName: string; net: number };

// Every entry-fee pot (Draft league, Cup, Blackjack) shown the same way:
// every participant's live net P/L if the pot were settled today - not
// just the winner(s) - so nobody has to guess where they stand.
export function PotTile({
  title,
  entryFee,
  entrantCount,
  rows,
}: {
  title: string;
  entryFee: number;
  entrantCount: number;
  rows: PotRow[];
}) {
  const potSize = entryFee * entrantCount;
  const sorted = [...rows].sort((a, b) => b.net - a.net);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {title}
        </p>
        <p className="text-[10px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0">
          £{entryFee} entry · £{potSize} pot
        </p>
      </div>
      <ul>
        {sorted.map((r, i) => (
          <li
            key={r.entryId}
            className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
          >
            <span className="w-5 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
              {i + 1}
            </span>
            <span className="flex-1 min-w-0 font-medium truncate">{r.managerName}</span>
            <span className={`tabular-nums font-bold ${plColor(r.net)}`}>{formatPl(r.net)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
