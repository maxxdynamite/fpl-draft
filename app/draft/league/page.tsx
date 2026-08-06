import { getStandings } from "@/lib/standings";
import { formatPl } from "@/lib/format";

export default async function LeaguePage() {
  const standings = await getStandings();

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-[var(--shadow-soft-lg)] ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-400 dark:text-zinc-500">
              <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wide">
                #
              </th>
              <th className="px-3 py-4 font-semibold text-xs uppercase tracking-wide">
                Team
              </th>
              <th className="px-3 py-4 font-semibold text-xs uppercase tracking-wide text-right">
                Points
              </th>
              <th className="px-3 py-4 font-semibold text-xs uppercase tracking-wide text-right">
                H2H
              </th>
              <th className="px-3 py-4 font-semibold text-xs uppercase tracking-wide text-right">
                P/L
              </th>
              <th className="px-3 py-4 font-semibold text-xs uppercase tracking-wide text-right">
                MOTW
              </th>
              <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wide text-right">
                SOTW
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.entryId}
                className="border-t border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-5 py-4 tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                  {row.rank}
                </td>
                <td className="px-3 py-4 font-semibold">{row.teamName}</td>
                <td className="px-3 py-4 text-right tabular-nums font-extrabold text-lg">
                  {row.totalPoints}
                </td>
                <td className="px-3 py-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.h2hWins}
                </td>
                <td
                  className={`px-3 py-4 text-right tabular-nums font-semibold ${
                    row.pl > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : row.pl < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-zinc-400"
                  }`}
                >
                  {formatPl(row.pl)}
                </td>
                <td className="px-3 py-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.motwCount}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.sotwCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600 font-medium">
        Updated automatically once a day during the season.
      </p>
    </div>
  );
}
