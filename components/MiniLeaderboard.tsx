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

  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;

  // Only add live GW points on top of totalPoints if that gameweek isn't
  // already baked into totalPoints via the daily sync - strict >, not >=
  // (unlike useLive below, which is comparing "which source describes
  // this GW" not "is this GW already summed into a different value").
  // Equal means the sheet's already synced it into totalPoints; adding it
  // again here would double-count.
  const canOverlayLiveOnOverall =
    liveGameweek !== null &&
    (syncedLatestGw === null || liveGameweek.eventNumber > syncedLatestGw);

  const overallRows: LeaderboardRow[] = canOverlayLiveOnOverall
    ? (() => {
        const livePointsByEntry = new Map(
          liveGameweek!.entries.map((e) => [e.entryId, e.eventTotal]),
        );
        return standings
          .map((s) => ({
            entryId: s.entryId,
            teamName: s.teamName,
            value: s.totalPoints + (livePointsByEntry.get(s.entryId) ?? 0),
            // no rank here on purpose - LeaderboardToggle falls back to
            // array index (row.rank ?? i + 1), so the sort below is what
            // actually drives the displayed position number.
          }))
          .sort((a, b) => b.value - a.value);
      })()
    : standings.map((s) => ({
        entryId: s.entryId,
        teamName: s.teamName,
        value: s.totalPoints,
        rank: s.rank,
      }));

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
