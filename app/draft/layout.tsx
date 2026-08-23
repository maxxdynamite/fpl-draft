import { DraftSubNav } from "@/components/DraftSubNav";
import { DraftCountdown } from "@/components/DraftCountdown";
import { GameweekStatusLabel, type GameweekStatus } from "@/components/GameweekStatusLabel";
import { getCurrentGameweek } from "@/lib/gameweek";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { getDraftSchedule } from "@/lib/leagueInfo";

export default async function DraftLayout({ children }: LayoutProps<"/draft">) {
  const [gameweek, liveGameweek, { draftDt, draftStatus }] = await Promise.all([
    getCurrentGameweek(),
    getLiveGameweek(),
    getDraftSchedule(),
  ]);
  // getCurrentGameweek() only ever reports a gameweek once it's finished
  // and synced to the sheet (syncCurrentGameweek skips writing live ones -
  // H2H/streaks shouldn't reflect a result bonus points could still flip),
  // so it lags a full gameweek behind reality while the next one's being
  // played. The live feed fills that gap - preferred whenever it's
  // reporting a gameweek at least as recent as the sheet's. Pre-season,
  // both are null/absent - default to Gameweek 1 with no status pill
  // rather than guessing before a ball's been kicked.
  const useLive =
    liveGameweek !== null &&
    (gameweek === null || liveGameweek.eventNumber >= gameweek.number);
  const gameweekNumber = useLive ? liveGameweek!.eventNumber : (gameweek?.number ?? 1);
  const showStatus = useLive || gameweek !== null;
  // Sheet-only path only ever reaches this branch for an already-finished,
  // synced gameweek (see syncCurrentGameweek's finished-only guard), so
  // "Provisional" - the gap between full-time and FPL's official lockdown -
  // only ever applies while reading the live feed.
  const status: GameweekStatus | null = !showStatus
    ? null
    : !useLive || liveGameweek!.finished
      ? "Complete"
      : liveGameweek!.allMatchesPlayed
        ? "Provisional"
        : "Live";

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
            <GameweekStatusLabel status={status} />
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
