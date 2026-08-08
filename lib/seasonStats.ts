import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";

export type AwardLeader = {
  entryId: number;
  teamName: string;
  count: number;
};

export type MotwSotwLeaders = {
  motw: AwardLeader[];
  sotw: AwardLeader[];
};

// Top managers by season-long MOTW/SOTW tally, zero-count entries excluded
// so the list only shows once someone's actually won one.
export async function getMotwSotwLeaders(limit = 3): Promise<MotwSotwLeaders> {
  const standings = await getStandings();

  const toLeaders = (key: "motwCount" | "sotwCount") =>
    standings
      .filter((s) => s[key] > 0)
      .sort((a, b) => b[key] - a[key])
      .slice(0, limit)
      .map((s) => ({
        entryId: s.entryId,
        teamName: s.teamName,
        count: s[key],
      }));

  return {
    motw: toLeaders("motwCount"),
    sotw: toLeaders("sotwCount"),
  };
}

export type GwScoreRecord = {
  entryId: number;
  teamName: string;
  gameweek: number;
  score: number;
};

export type GwScoreRecords = {
  highest: GwScoreRecord | null;
  lowest: GwScoreRecord | null;
};

// Best and worst single-gameweek scores across the whole league this
// season (not per-H2H-matchup) — scans every recorded GW_Scores row.
export async function getGwScoreRecords(): Promise<GwScoreRecords> {
  const [managers, gwScores] = await Promise.all([
    getManagers(),
    getGwScores(),
  ]);

  if (gwScores.length === 0) return { highest: null, lowest: null };

  const teamsByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));

  const highestRow = gwScores.reduce((best, row) =>
    row.eventTotal > best.eventTotal ? row : best,
  );
  const lowestRow = gwScores.reduce((worst, row) =>
    row.eventTotal < worst.eventTotal ? row : worst,
  );

  const toRecord = (row: (typeof gwScores)[number]): GwScoreRecord => ({
    entryId: row.entryId,
    teamName: teamsByEntry.get(row.entryId) ?? "Unknown",
    gameweek: row.gameweek,
    score: row.eventTotal,
  });

  return { highest: toRecord(highestRow), lowest: toRecord(lowestRow) };
}
