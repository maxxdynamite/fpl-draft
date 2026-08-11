import type { MoneyEvent } from "@/lib/money";

function formatAmount(amount: number) {
  return amount % 1 === 0 ? `£${amount}` : `£${amount.toFixed(2)}`;
}

function ArrowIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-zinc-300 dark:text-zinc-600"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function MoneyLog({ events }: { events: MoneyEvent[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Running log
      </p>
      {events.length === 0 ? (
        <p className="px-3 pb-3 text-xs text-zinc-400 dark:text-zinc-500">
          Nothing logged yet.
        </p>
      ) : (
        <ul>
          {events.map((e, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
            >
              <span className="w-9 shrink-0 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                GW{e.gameweek}
              </span>
              <span className="w-24 shrink-0 text-zinc-400 dark:text-zinc-500 truncate">
                {e.label}
              </span>
              <span className="flex-1 flex items-center gap-1.5 min-w-0">
                <span className="font-medium truncate">{e.fromName}</span>
                <ArrowIcon />
                <span className="font-medium truncate">{e.toName}</span>
              </span>
              <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                {formatAmount(e.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
