import { getStandings } from "@/lib/standings";
import { getLeagueName } from "@/lib/leagueInfo";
import { getGwScores } from "@/lib/gwScores";
import { getManagers } from "@/lib/managers";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { LeaderboardToggle, type LeaderboardRow } from "./LeaderboardToggle";

export async function MiniLeaderboard() {
  const [standings, leagueName, gwScores, managers, liveGameweek] = await Promise.all([
    getStandings(),
    getLeagueName(),
    getGwScores(),
    getManagers(),
    getLiveGameweek(),
  ]);

  const overallRows: LeaderboardRow[] = standings.map((s) => ({
    entryId: s.entryId,
    teamName: s.teamName,
    value: s.totalPoints,
    rank: s.rank,
  }));

  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;

  // Same live-preferred pattern as the H2H headline score: the "Gameweek"
  // toggle is a live, in-progress number people check mid-round, not a
  // settled record, so it should track the live feed whenever it's at
  // least as recent as what's synced - never stuck showing last week's
  // while this week is being played.
  const useLive =
    liveGameweek !== null &&
    (syncedLatestGw === null || liveGameweek.eventNumber >= syncedLatestGw);
  const latestGw = useLive ? liveGameweek!.eventNumber : syncedLatestGw;

  // Every manager appears even if their gameweek score hasn't synced/gone
  // live yet (defaults to 0), rather than only showing whoever has data.
  const scoresByEntry = useLive
    ? new Map(liveGameweek!.entries.map((e) => [e.entryId, e.eventTotal]))
    : new Map(
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
