import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";
import { getDraftOrder } from "./draftOrder";
import { getPlayersData } from "./players";

export type H2hSide = {
  entryId: number;
  teamName: string;
  managerName: string;
  wins: number;
  pl: number;
  latestGameweek: number | null;
  latestScore: number | null;
  streak: number;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
  draftPosition: number | null;
  // Set once at draft time and never changes after - shown in the H2H
  // stats menu as a permanent record of round 1, not a live value.
  firstPick: string | null;
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
  const [managers, standings, gwScores, draftOrder, { players }] = await Promise.all([
    getManagers(),
    getStandings(),
    getGwScores(),
    getDraftOrder(),
    getPlayersData(),
  ]);

  const standingsByEntry = new Map(standings.map((s) => [s.entryId, s]));
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));
  const playerNameById = new Map(players.map((p) => [p.id, p.name]));

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
    const draft = draftOrder.get(entryId);

    return {
      entryId,
      teamName: manager?.teamName ?? "Unknown",
      managerName: manager?.managerName ?? "Unknown",
      wins: standing?.h2hWins ?? 0,
      pl: standing?.pl ?? 0,
      latestGameweek: latest?.gameweek ?? null,
      latestScore: latest?.eventTotal ?? null,
      streak,
      overallRank: standing?.rank ?? null,
      totalPoints: standing?.totalPoints ?? null,
      motwCount: standing?.motwCount ?? null,
      sotwCount: standing?.sotwCount ?? null,
      draftPosition: draft?.position ?? null,
      firstPick: draft ? (playerNameById.get(draft.firstPickElementId) ?? null) : null,
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

  return matchups;
}
