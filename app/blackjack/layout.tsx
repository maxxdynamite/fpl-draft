import { getPlayersData } from "@/lib/players";
import { getPlGameweekStatus } from "@/lib/plGameweekStatus";
import { isPickingWindowOpen } from "@/lib/pickingWindow";
import { GameweekStatusLabel, type GameweekStatus } from "@/components/GameweekStatusLabel";
import { BlackjackHeaderAction } from "@/components/BlackjackHeaderAction";

export default async function BlackjackLayout({ children }: LayoutProps<"/blackjack">) {
  // Real Premier League calendar, same source the pace logic itself uses
  // (lib/blackjack.ts) - not the Draft section's own gameweek tracker,
  // which is a separate, out-of-sync competition schedule. Falls back to
  // Gameweek 1 pre-season (currentGameweek is 0 before a ball's kicked),
  // same convention as the Draft layout's own pre-season fallback.
  const [{ currentGameweek, seasonStartTime }, plStatus] = await Promise.all([
    getPlayersData(),
    getPlGameweekStatus(),
  ]);
  const pickingWindowOpen = isPickingWindowOpen(seasonStartTime);
  const gameweekNumber = currentGameweek > 0 ? currentGameweek : 1;
  const status: GameweekStatus | null = !plStatus
    ? null
    : plStatus.finished
      ? "Complete"
      : plStatus.allMatchesPlayed
        ? "Provisional"
        : "Live";

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-4 sm:pb-6">
      {/* h-10 matches the Draft section's title row - its DraftSubNav
          sibling is naturally taller than a bare h1, and pinning both rows
          to the same explicit height keeps "Gameweek N" and the content
          below it aligned across the two sections. */}
      <div className="flex items-center justify-between gap-4 mb-5 h-10">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Gameweek {gameweekNumber}
          </h1>
          <GameweekStatusLabel status={status} />
        </div>
        <BlackjackHeaderAction pickingWindowOpen={pickingWindowOpen} />
      </div>
      {children}
    </main>
  );
}
