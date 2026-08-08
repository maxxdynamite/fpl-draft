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
  const teamsByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));

  const gameweekRows: LeaderboardRow[] =
    latestGw === null
      ? []
      : gwScores
          .filter((r) => r.gameweek === latestGw)
          .sort((a, b) => b.eventTotal - a.eventTotal)
          .map((r) => ({
            entryId: r.entryId,
            teamName: teamsByEntry.get(r.entryId) ?? "Unknown",
            value: r.eventTotal,
          }));

  return (
    <LeaderboardToggle
      leagueName={leagueName}
      overallRows={overallRows}
      gameweekRows={gameweekRows}
      latestGw={latestGw}
    />
  );
}
