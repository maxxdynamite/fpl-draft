import { formatPl, plColor } from "@/lib/format";

export type TotalRow = { entryId: number; managerName: string; net: number };

// The grand total across every money source (Draft pot, Cup pot, Blackjack
// pot, H2H wager, MOTW/SOTW) per manager - same card treatment as the
// other tiles (a full brand-gradient header background read as too loud
// next to them), marked out as the headline summary with just a thin
// gradient accent strip plus gradient title text - same bg-clip-text
// technique the "Weekly" half of the site's own logo uses
// (components/TopNav.tsx).
export function TotalMoneyTile({ rows }: { rows: TotalRow[] }) {
  const sorted = [...rows].sort((a, b) => b.net - a.net);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      {/* h-1 (4px) + pt-2 (8px) below = the other tiles' pt-3 (12px), so
          this header ends up exactly as tall as theirs despite the extra
          bar - keeps every tile on the page aligned to the same height. */}
      <div className="h-1 bg-gradient-to-r from-[#00ff85] to-[#04f5ff]" aria-hidden="true" />
      {/* inline-block so the gradient spans exactly the text's own width -
          block-level (this element's default) stretched it across the
          full card, so the text (left-aligned, much narrower) only ever
          showed the gradient's first sliver, reading as flat green. */}
      <p className="inline-block px-3 pt-2 pb-2 text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-[#00ff85] to-[#04f5ff] bg-clip-text text-transparent">
        Total Money League
      </p>
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
