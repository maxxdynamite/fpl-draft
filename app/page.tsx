import { getStandings } from "@/lib/standings";

function formatPl(pl: number) {
  if (pl > 0) return `+£${pl}`;
  if (pl < 0) return `-£${Math.abs(pl)}`;
  return `£0`;
}

export default async function Home() {
  const standings = await getStandings();

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Bad Blokes Draft
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          2026/27 season standings
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-900 text-left text-zinc-500 dark:text-zinc-400">
              <th className="px-3 py-3 font-medium">#</th>
              <th className="px-3 py-3 font-medium">Team</th>
              <th className="px-3 py-3 font-medium text-right">Points</th>
              <th className="px-3 py-3 font-medium text-right">H2H</th>
              <th className="px-3 py-3 font-medium text-right">P/L</th>
              <th className="px-3 py-3 font-medium text-right">MOTW</th>
              <th className="px-3 py-3 font-medium text-right">SOTW</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {standings.map((row) => (
              <tr
                key={row.entryId}
                className="odd:bg-white even:bg-zinc-50 dark:odd:bg-zinc-950 dark:even:bg-zinc-900/50"
              >
                <td className="px-3 py-3 tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.rank}
                </td>
                <td className="px-3 py-3 font-medium">{row.teamName}</td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold">
                  {row.totalPoints}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.h2hWins}
                </td>
                <td
                  className={`px-3 py-3 text-right tabular-nums font-medium ${
                    row.pl > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : row.pl < 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {formatPl(row.pl)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.motwCount}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {row.sotwCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
        Updated automatically once a day during the season.
      </p>
    </main>
  );
}
