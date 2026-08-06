import { getStandings } from "@/lib/standings";
import { getLeagueName } from "@/lib/leagueInfo";

export async function MiniLeaderboard() {
  const [standings, leagueName] = await Promise.all([
    getStandings(),
    getLeagueName(),
  ]);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft)] ring-1 ring-black/[0.03] dark:ring-white/[0.06] overflow-hidden">
      <p className="px-3 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {leagueName}
      </p>
      <ul>
        {standings.map((row) => (
          <li
            key={row.entryId}
            className="flex items-center gap-2 px-3 py-1.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs"
          >
            <span className="w-3.5 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
              {row.rank}
            </span>
            <span className="flex-1 font-medium truncate">
              {row.teamName}
            </span>
            <span className="tabular-nums font-bold">{row.totalPoints}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
