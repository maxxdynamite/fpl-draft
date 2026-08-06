import { getStandings } from "@/lib/standings";

export async function MiniLeaderboard() {
  const standings = await getStandings();

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft-lg)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-4 pt-4 pb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        League
      </p>
      <ul>
        {standings.map((row) => (
          <li
            key={row.entryId}
            className="flex items-center gap-3 px-4 py-2.5 border-t border-black/[0.04] dark:border-white/[0.06] text-sm"
          >
            <span className="w-4 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
              {row.rank}
            </span>
            <span className="flex-1 font-semibold truncate">
              {row.teamName}
            </span>
            <span className="tabular-nums font-extrabold">
              {row.totalPoints}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
