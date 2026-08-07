import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";

export type H2hSide = {
  entryId: number;
  teamName: string;
  managerName: string;
  wins: number;
  pl: number;
  latestGameweek: number | null;
  latestScore: number | null;
  streak: number;
};

export type GwHistoryRow = {
  gameweek: number;
  aScore: number;
  bScore: number;
};

// Consecutive gameweeks (most recent first) this side has beaten their
// rival head-to-head, stopping at the first loss, tie, or start of history.
function computeStreak(history: GwHistoryRow[], side: "a" | "b"): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const row = history[i];
    const won = side === "a" ? row.aScore > row.bScore : row.bScore > row.aScore;
    if (!won) break;
    streak++;
  }
  return streak;
}

export type H2hMatchup = {
  teamA: H2hSide;
  teamB: H2hSide;
  history: GwHistoryRow[];
};

// Pairs each manager with their season-long rival, using each rival
// relationship once (lower entry_id first) rather than twice, and attaches
// the full gameweek-by-gameweek score history between the two of them.
export async function getH2hMatchups(): Promise<H2hMatchup[]> {
  const [managers, standings, gwScores] = await Promise.all([
    getManagers(),
    getStandings(),
    getGwScores(),
  ]);

  const standingsByEntry = new Map(standings.map((s) => [s.entryId, s]));
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));

  const scoresByEntry = new Map<number, typeof gwScores>();
  for (const row of gwScores) {
    const list = scoresByEntry.get(row.entryId) ?? [];
    list.push(row);
    scoresByEntry.set(row.entryId, list);
  }

  function buildSide(entryId: number, streak: number): H2hSide {
    const manager = managersByEntry.get(entryId);
    const standing = standingsByEntry.get(entryId);
    const rows = scoresByEntry.get(entryId) ?? [];
    const latest = rows[rows.length - 1];

    return {
      entryId,
      teamName: manager?.teamName ?? "Unknown",
      managerName: manager?.managerName ?? "Unknown",
      wins: standing?.h2hWins ?? 0,
      pl: standing?.pl ?? 0,
      latestGameweek: latest?.gameweek ?? null,
      latestScore: latest?.eventTotal ?? null,
      streak,
    };
  }

  const matchups: H2hMatchup[] = [];
  const seen = new Set<number>();

  for (const manager of managers) {
    if (seen.has(manager.entryId)) continue;
    const rival = managersByEntry.get(manager.rivalEntryId);
    if (!rival) continue;

    seen.add(manager.entryId);
    seen.add(rival.entryId);

    const aRows = scoresByEntry.get(manager.entryId) ?? [];
    const history: GwHistoryRow[] = aRows.map((row) => ({
      gameweek: row.gameweek,
      aScore: row.eventTotal,
      bScore: row.rivalEventTotal,
    }));

    matchups.push({
      teamA: buildSide(manager.entryId, computeStreak(history, "a")),
      teamB: buildSide(rival.entryId, computeStreak(history, "b")),
      history,
    });
  }

  // TEMP DEMO ONLY — real data only has 1 week of streaks so far, so tiers
  // 2 (5+) and 3 (10+) can't occur naturally yet. Bumping two examples so
  // all three streak-badge tiers are visible on the preview. Remove once
  // real 5+/10+ week streaks exist.
  const demoTier2 = matchups.find((m) => m.teamA.entryId === 59034);
  if (demoTier2) demoTier2.teamA.streak = 5;
  const demoTier3 = matchups.find((m) => m.teamA.entryId === 59042);
  if (demoTier3) demoTier3.teamA.streak = 10;

  return matchups;
}
