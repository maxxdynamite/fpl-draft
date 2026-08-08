import { getStandings } from "@/lib/standings";
import { getLeagueName } from "@/lib/leagueInfo";
import { getGwScores } from "@/lib/gwScores";
import { getManagers } from "@/lib/managers";
import { LeaderboardToggle, type LeaderboardRow } from "./LeaderboardToggle";

export async function MiniLeaderboard() {
  const [standings, leagueName, gwScores, managers] = await Promise.all([
    getStandings(),
    getLeagueName(),
    getGwScores(),
    getManagers(),
  ]);

  const overallRows: LeaderboardRow[] = standings.map((s) => ({
    entryId: s.entryId,
    teamName: s.teamName,
    value: s.totalPoints,
    rank: s.rank,
  }));

  const latestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;

  // Every manager appears even if their gameweek score hasn't synced yet
  // (defaults to 0), rather than only showing whoever has data so far.
  const scoresByEntry = new Map(
    gwScores
      .filter((r) => r.gameweek === latestGw)
      .map((r) => [r.entryId, r.eventTotal]),
  );

  const gameweekRows: LeaderboardRow[] =
    latestGw === null
      ? []
      : managers
          .map((m) => ({
            entryId: m.entryId,
            teamName: m.teamName,
            value: scoresByEntry.get(m.entryId) ?? 0,
          }))
          .sort((a, b) => b.value - a.value);

  return (
    <LeaderboardToggle
      leagueName={leagueName}
      overallRows={overallRows}
      gameweekRows={gameweekRows}
      latestGw={latestGw}
    />
  );
}
