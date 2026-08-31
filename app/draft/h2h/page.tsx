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
      {/* Unequal columns at every width, not just desktop - the
          leaderboard's extra rank column (MiniLeaderboard/
          LeaderboardToggle) needs more room than MotwSotwLeaderboard/
          GwScoreRecords' plain name+value rows. That extra column matters
          even more on mobile, where the aside is already narrower in
          absolute terms than the 440px desktop sidebar - team names on
          the leaderboard were actually clipping there under an even
          split, not just feeling tight. */}
      <aside className="grid grid-cols-[6fr_5fr] gap-4 lg:sticky lg:top-24">
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
