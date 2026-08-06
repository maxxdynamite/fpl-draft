import { getH2hMatchups } from "@/lib/h2h";
import { H2hTile } from "@/components/H2hTile";

export default async function H2hPage() {
  const matchups = await getH2hMatchups();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {matchups.map((matchup) => (
        <H2hTile
          key={`${matchup.teamA.entryId}-${matchup.teamB.entryId}`}
          matchup={matchup}
        />
      ))}
    </div>
  );
}
