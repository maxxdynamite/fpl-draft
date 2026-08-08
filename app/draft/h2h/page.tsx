import { getH2hMatchups } from "@/lib/h2h";
import { H2hTile } from "@/components/H2hTile";
import { MiniLeaderboard } from "@/components/MiniLeaderboard";
import { WeeklyAwardTablets } from "@/components/WeeklyAwardTablets";
import { MotwSotwLeaderboard } from "@/components/MotwSotwLeaderboard";
import { GwScoreRecords } from "@/components/GwScoreRecords";

export default async function H2hPage() {
  const matchups = await getH2hMatchups();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">
      <div className="grid gap-4 sm:grid-cols-2">
        {matchups.map((matchup) => (
          <H2hTile
            key={`${matchup.teamA.entryId}-${matchup.teamB.entryId}`}
            matchup={matchup}
          />
        ))}
      </div>
      <aside className="grid grid-cols-2 gap-4 lg:sticky lg:top-24">
        <div className="space-y-4">
          <WeeklyAwardTablets />
          <MiniLeaderboard />
        </div>
        <div className="space-y-4">
          <MotwSotwLeaderboard />
          <GwScoreRecords />
        </div>
      </aside>
    </div>
  );
}
