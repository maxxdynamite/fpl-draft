import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";
import { getLiveGameweek } from "./liveGwScores";

export type LiveAdjustedStanding = {
  value: number; // totalPoints, with the live gameweek layered on top when applicable
  rank: number; // 1-based, re-derived from `value` when live-adjusted
  isLive: boolean;
};

// Season-total points with the current live/unsynced gameweek's points
// added on top, re-ranked to match - shared by the mini leaderboard's
// Overall tab and the H2H stats menu's Total Points/Overall Rank rows, so
// both surfaces always agree on the same live standing instead of two
// independent implementations quietly drifting apart.
//
// Only overlays when the live gameweek isn't already synced into
// totalPoints (strict >, not >= - equal means the sheet's daily sync has
// already summed it in, so adding it again would double-count).
export async function getLiveAdjustedStandings(): Promise<Map<number, LiveAdjustedStanding>> {
  const [standings, gwScores, liveGameweek] = await Promise.all([
    getStandings(),
    getGwScores(),
    getLiveGameweek(),
  ]);

  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;
  const canOverlay =
    liveGameweek !== null &&
    (syncedLatestGw === null || liveGameweek.eventNumber > syncedLatestGw);

  const result = new Map<number, LiveAdjustedStanding>();

  if (!canOverlay) {
    // No overlay to apply - keep the sheet's own rank exactly as-is
    // (preserves whatever tie-handling the sheet itself encodes, rather
    // than recomputing from array position).
    for (const s of standings) {
      result.set(s.entryId, { value: s.totalPoints, rank: s.rank, isLive: false });
    }
    return result;
  }

  const livePointsByEntry = new Map(
    liveGameweek!.entries.map((e) => [e.entryId, e.eventTotal]),
  );
  const adjusted = standings
    .map((s) => ({
      entryId: s.entryId,
      value: s.totalPoints + (livePointsByEntry.get(s.entryId) ?? 0),
    }))
    .sort((a, b) => b.value - a.value);

  adjusted.forEach((row, i) => {
    result.set(row.entryId, { value: row.value, rank: i + 1, isLive: true });
  });
  return result;
}
