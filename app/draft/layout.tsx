import { DraftSubNav } from "@/components/DraftSubNav";
import { getCurrentGameweek } from "@/lib/gameweek";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const gameweek = await getCurrentGameweek();
  // Pre-season, GW_Scores has no rows yet (nothing's been synced), so
  // getCurrentGameweek() returns null - default to Gameweek 1 rather than
  // hiding the heading entirely. No status pill in that case: we don't
  // have real finished/in-progress data to show, and guessing would be
  // misleading before a ball's even been kicked.
  const gameweekNumber = gameweek?.number ?? 1;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Gameweek {gameweekNumber}
          </h1>
          {gameweek && (
            <span className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">
              {gameweek.finished ? "Complete" : "In Progress"}
            </span>
          )}
        </div>
        <DraftSubNav />
      </div>
      {children}
    </main>
  );
}
