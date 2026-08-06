import { getH2hMatchups } from "@/lib/h2h";
import { H2hTile } from "@/components/H2hTile";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { WeeklyAwardTablets } from "@/components/WeeklyAwardTablets";

export default async function H2hPage() {
  const matchups = await getH2hMatchups();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
      <div className="grid gap-4 sm:grid-cols-2">
        {matchups.map((matchup) => (
          <H2hTile
            key={`${matchup.teamA.entryId}-${matchup.teamB.entryId}`}
            matchup={matchup}
          />
        ))}
      </div>
      <aside className="lg:sticky lg:top-24">
        <WeeklyAwardTablets />
        <MiniLeaderboard />
      </aside>
    </div>
  );
}
