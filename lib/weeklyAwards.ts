import { getManagers } from "./managers";
import { getGwScores } from "./gwScores";
import { getLiveGameweek } from "./liveGwScores";

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
  const [managers, gwScores, liveGameweek] = await Promise.all([
    getManagers(),
    getGwScores(),
    getLiveGameweek(),
  ]);

  if (gwScores.length === 0) return null;

  const latestGameweek = Math.max(...gwScores.map((row) => row.gameweek));

  // Same "can't award a gameweek that hasn't synced yet" rule as
  // lib/h2h.ts's isLatestMotw/isLatestSotw — once a newer gameweek is
  // live, GW_Scores' own latest row is no longer "this week's" award, and
  // there's nothing to replace it with until the new one finishes and
  // syncs. Hide the tile entirely rather than keep showing a stale winner
  // while a newer gameweek is already being played elsewhere on the page.
  if (liveGameweek !== null && liveGameweek.eventNumber > latestGameweek) {
    return null;
  }

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
