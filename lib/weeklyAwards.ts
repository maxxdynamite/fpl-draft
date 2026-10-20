import { getManagers } from "./managers";
import { getGwScores, groupTiedMotwSotw } from "./gwScores";
import { getLiveGameweek } from "./liveGwScores";

export type WeeklyAwards = {
  gameweek: number;
  motwTeams: string[];
  motwPoints: number;
  sotwTeams: string[];
  sotwPoints: number;
};

// Manager of the Week / Spanner of the Week for whichever gameweek has the
// most recent scores in GW_Scores - highest and lowest event_total that
// week. Every manager tied for highest (or lowest) is awarded it, not
// just one - see groupTiedMotwSotw (lib/gwScores.ts).
export async function getWeeklyAwards(): Promise<WeeklyAwards | null> {
  const [managers, gwScores, liveGameweek] = await Promise.all([
    getManagers(),
    getGwScores(),
    getLiveGameweek(),
  ]);

  if (gwScores.length === 0) return null;

  const latestGameweek = Math.max(...gwScores.map((row) => row.gameweek));

  // Same "can't award a gameweek that hasn't synced yet" rule as
  // lib/h2h.ts's isLatestMotw/isLatestSotw - once a newer gameweek is
  // live, GW_Scores' own latest row is no longer "this week's" award, and
  // there's nothing to replace it with until the new one finishes and
  // syncs. Hide the tile entirely rather than keep showing a stale winner
  // while a newer gameweek is already being played elsewhere on the page.
  if (liveGameweek !== null && liveGameweek.eventNumber > latestGameweek) {
    return null;
  }

  const rows = gwScores.filter((row) => row.gameweek === latestGameweek);
  const { motwEntryIds, sotwEntryIds } = groupTiedMotwSotw(rows);

  // Nobody's actually above or below anyone else this week (only one
  // entrant, or everyone tied) - nothing to award.
  if (motwEntryIds.length === 0) return null;

  const teamsByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));
  const pointsByEntry = new Map(rows.map((row) => [row.entryId, row.eventTotal]));

  return {
    gameweek: latestGameweek,
    motwTeams: motwEntryIds.map((id) => teamsByEntry.get(id) ?? "Unknown"),
    motwPoints: pointsByEntry.get(motwEntryIds[0])!,
    sotwTeams: sotwEntryIds.map((id) => teamsByEntry.get(id) ?? "Unknown"),
    sotwPoints: pointsByEntry.get(sotwEntryIds[0])!,
  };
}
