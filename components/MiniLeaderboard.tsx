import { getStandings } from "@/lib/standings";
import { getLeagueName } from "@/lib/leagueInfo";
import { getGwScores } from "@/lib/gwScores";
import { getManagers } from "@/lib/managers";
import { getLiveGameweek } from "@/lib/liveGwScores";
import { getLiveAdjustedStandings } from "@/lib/liveStandings";
import { LeaderboardToggle, type LeaderboardRow } from "./LeaderboardToggle";

export async function MiniLeaderboard() {
  const [standings, leagueName, gwScores, managers, liveGameweek, liveAdjusted] =
    await Promise.all([
      getStandings(),
      getLeagueName(),
      getGwScores(),
      getManagers(),
      getLiveGameweek(),
      getLiveAdjustedStandings(),
    ]);

  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;

  // Shared with the H2H stats menu's Total Points/Overall Rank rows (see
  // lib/liveStandings.ts) so both surfaces always agree on the same live
  // standing. No rank passed through when it's live-adjusted -
  // LeaderboardToggle falls back to array index (row.rank ?? i + 1), and
  // these rows are already sorted by the live-adjusted value inside the
  // helper, so that fallback is what actually drives the position number.
  const overallRows: LeaderboardRow[] = standings
    .map((s) => {
      const adjusted = liveAdjusted.get(s.entryId);
      return {
        entryId: s.entryId,
        teamName: s.teamName,
        value: adjusted?.value ?? s.totalPoints,
        rank: adjusted?.isLive ? undefined : (adjusted?.rank ?? s.rank),
      };
    })
    .sort((a, b) => (a.rank !== undefined && b.rank !== undefined ? a.rank - b.rank : b.value - a.value));

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
