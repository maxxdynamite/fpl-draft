import { getManagers } from "./managers";
import { getGwScores, computeMotwSotwTallies } from "./gwScores";

// Sorts descending by value and takes the top `limit`, but extends past
// that cutoff to include anyone tied with the last qualifying entry —
// so "top 3" never arbitrarily cuts a tie in half.
function topWithTies<T>(
  items: T[],
  value: (item: T) => number,
  limit: number,
): T[] {
  const sorted = [...items].sort((a, b) => value(b) - value(a));
  if (sorted.length <= limit) return sorted;
  const cutoff = value(sorted[limit - 1]);
  return sorted.filter((item) => value(item) >= cutoff);
}

export type AwardLeader = {
  entryId: number;
  managerName: string;
  count: number;
};

export type MotwSotwLeaders = {
  motw: AwardLeader[];
  sotw: AwardLeader[];
};

// Top managers by season-long MOTW/SOTW tally, zero-count entries excluded
// so the list only shows once someone's actually won one.
export async function getMotwSotwLeaders(limit = 3): Promise<MotwSotwLeaders> {
  const [gwScores, managers] = await Promise.all([
    getGwScores(),
    getManagers(),
  ]);
  const managerNameByEntry = new Map(
    managers.map((m) => [m.entryId, m.managerName]),
  );
  const tallies = computeMotwSotwTallies(gwScores);
  const entries = [...tallies.entries()].map(([entryId, t]) => ({ entryId, ...t }));

  const toLeaders = (key: "motwCount" | "sotwCount") =>
    topWithTies(
      entries.filter((e) => e[key] > 0),
      (e) => e[key],
      limit,
    ).map((e) => ({
      entryId: e.entryId,
      managerName: managerNameByEntry.get(e.entryId) ?? "Unknown",
      count: e[key],
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
  highest: GwScoreRecord[];
  lowest: GwScoreRecord[];
};

// Best and worst single-gameweek scores across the whole league this
// season (not per-H2H-matchup) — scans every recorded GW_Scores row.
export async function getGwScoreRecords(limit = 3): Promise<GwScoreRecords> {
  const [managers, gwScores] = await Promise.all([
    getManagers(),
    getGwScores(),
  ]);

  if (gwScores.length === 0) return { highest: [], lowest: [] };

  const teamsByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));
  const toRecord = (row: (typeof gwScores)[number]): GwScoreRecord => ({
    entryId: row.entryId,
    teamName: teamsByEntry.get(row.entryId) ?? "Unknown",
    gameweek: row.gameweek,
    score: row.eventTotal,
  });

  return {
    highest: topWithTies(gwScores, (r) => r.eventTotal, limit).map(toRecord),
    lowest: topWithTies(gwScores, (r) => -r.eventTotal, limit).map(toRecord),
  };
}
