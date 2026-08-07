import { getManagers } from "./managers";
import { getGwScores } from "./gwScores";

export type WeeklyAwards = {
  gameweek: number;
  motwTeam: string;
  motwPoints: number;
  sotwTeam: string;
  sotwPoints: number;
};

// Manager of the Week / Spanner of the Week for whichever gameweek has the
// most recent scores in GW_Scores — highest and lowest event_total that week.
export async function getWeeklyAwards(): Promise<WeeklyAwards | null> {
  const [managers, gwScores] = await Promise.all([
    getManagers(),
    getGwScores(),
  ]);

  if (gwScores.length === 0) return null;

  const latestGameweek = Math.max(...gwScores.map((row) => row.gameweek));
  const rows = gwScores.filter((row) => row.gameweek === latestGameweek);

  const motwRow = rows.reduce((best, row) =>
    row.eventTotal > best.eventTotal ? row : best,
  );
  const sotwRow = rows.reduce((worst, row) =>
    row.eventTotal < worst.eventTotal ? row : worst,
  );

  const teamsByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));

  return {
    gameweek: latestGameweek,
    motwTeam: teamsByEntry.get(motwRow.entryId) ?? "Unknown",
    motwPoints: motwRow.eventTotal,
    sotwTeam: teamsByEntry.get(sotwRow.entryId) ?? "Unknown",
    sotwPoints: sotwRow.eventTotal,
  };
}
