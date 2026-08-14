import { DraftSubNav } from "@/components/DraftSubNav";
import { DraftCountdown } from "@/components/DraftCountdown";
import { getCurrentGameweek } from "@/lib/gameweek";
import { getDraftSchedule } from "@/lib/leagueInfo";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const [gameweek, { draftDt, draftStatus }] = await Promise.all([
    getCurrentGameweek(),
    getDraftSchedule(),
  ]);
  // Pre-season, GW_Scores has no rows yet (nothing's been synced), so
  // getCurrentGameweek() returns null - default to Gameweek 1 rather than
  // hiding the heading entirely. No status pill in that case: we don't
  // have real finished/in-progress data to show, and guessing would be
  // misleading before a ball's even been kicked.
  const gameweekNumber = gameweek?.number ?? 1;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      <div className="mb-5">
        {/* h-10 is explicit, not incidental - DraftSubNav's own padding
            makes it naturally taller than a bare h1, and the Blackjack
            section's equivalent title row has no such sibling. Pinning
            both rows to the same height keeps "Gameweek N" and the
            content below it aligned across the two sections regardless
            of what sits next to the title. */}
        <div className="flex items-center gap-4 h-10">
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
          {draftStatus === "pre" && draftDt && (
            // hidden below sm - "Gameweek N" + the H2H/Cup toggle already
            // fill this row on a phone (measured: only ~60px of slack
            // remains at 360px, not enough for even a stripped-down
            // pill), so the same countdown instead gets its own full-
            // width row below rather than being squeezed in here.
            <div className="hidden sm:block">
              <DraftCountdown draftDt={draftDt} />
            </div>
          )}
        </div>
        {draftStatus === "pre" && draftDt && (
          <div className="sm:hidden mt-3">
            <DraftCountdown draftDt={draftDt} />
          </div>
        )}
      </div>
      {children}
    </main>
  );
}
