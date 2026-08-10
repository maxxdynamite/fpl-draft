import { getManagers } from "./managers";
import { getBlackjackPicks } from "./blackjackPicks";
import { getPlayersData, type Player } from "./players";

export const BLACKJACK_TARGET = 21;
export const TOTAL_GAMEWEEKS = 38;
// Mirrors the user's own spreadsheet pace formula exactly (including the
// asymmetric outer bounds - miles-off at -5, at-risk at +4, not a rounded
// +-5): =IF(C3>21,"BUST",IF(C3<pace-5,"Miles Off It",IF(C3<pace-0.5,
// "Under Target",IF(C3<=pace+0.5,"On Target",IF(C3<=pace+4,"Over Target",
// "At Risk")))))
const PACE_TOLERANCE = 0.5; // on-target boundary
const PACE_LOW_OUTER = 5; // miles-off boundary (below expected pace)
const PACE_HIGH_OUTER = 4; // at-risk boundary (above expected pace)

export type BlackjackStatus =
  | "no-picks"
  | "selected"
  | "bust"
  | "blackjack"
  | "at-risk"
  | "over-target"
  | "on-target"
  | "under-target"
  | "miles-off";

export type BlackjackParticipant = {
  entryId: number;
  managerName: string;
  teamName: string;
  players: Player[] | null; // null until picks are submitted
  totalGoals: number;
  allScored: boolean; // every pick has scored at least once
  status: BlackjackStatus;
};

// Blackjack requires every pick to have actually scored, not just the
// combined total landing on 21 - a squad with three big scorers and one
// on zero hasn't really "hit" blackjack, the same way a card game hand
// needs every card face-up. Short of the target, allScored isn't a status
// of its own (it's shown as a separate indicator alongside pace), but it
// gates the win itself.
export function computeStatus(
  totalGoals: number,
  allScored: boolean,
  currentGameweek: number,
): BlackjackStatus {
  // currentGameweek is 0 before the season's first ball is kicked (see
  // lib/players.ts's seasonHasStarted). Pre-season the pace formula is
  // meaningless - expectedPace works out to 0, which everyone's 0-goal
  // total trivially satisfies as "on target" - so this is only ever
  // called for participants who already have 4 valid picks in, "Selected"
  // overrides the pace calculation entirely rather than showing a
  // misleading pace read against a season that hasn't started.
  if (currentGameweek === 0) return "selected";

  if (totalGoals > BLACKJACK_TARGET) return "bust";
  if (totalGoals === BLACKJACK_TARGET && allScored) return "blackjack";

  const expectedPace = (BLACKJACK_TARGET * currentGameweek) / TOTAL_GAMEWEEKS;
  if (totalGoals < expectedPace - PACE_LOW_OUTER) return "miles-off";
  if (totalGoals < expectedPace - PACE_TOLERANCE) return "under-target";
  if (totalGoals <= expectedPace + PACE_TOLERANCE) return "on-target";
  if (totalGoals <= expectedPace + PACE_HIGH_OUTER) return "over-target";
  return "at-risk";
}

// Combines manager identity, submitted picks, and live player goal counts
// into a per-participant result, ranked by total goals (leaderboard order).
export async function getBlackjackLeaderboard(): Promise<BlackjackParticipant[]> {
  const [managers, picks, { players, currentGameweek }] = await Promise.all([
    getManagers(),
    getBlackjackPicks(),
    getPlayersData(),
  ]);

  const playersById = new Map(players.map((p) => [p.id, p]));
  const picksByEntry = new Map(picks.map((p) => [p.entryId, p]));

  const participants: BlackjackParticipant[] = managers.map((manager) => {
    const pick = picksByEntry.get(manager.entryId);
    const pickedPlayers =
      pick && pick.playerIds.length === 4
        ? pick.playerIds.map((id) => playersById.get(id)).filter((p): p is Player => !!p)
        : null;

    const validPicks = pickedPlayers && pickedPlayers.length === 4 ? pickedPlayers : null;
    const totalGoals = validPicks ? validPicks.reduce((sum, p) => sum + p.goals, 0) : 0;
    const allScored = validPicks ? validPicks.every((p) => p.goals > 0) : false;

    return {
      entryId: manager.entryId,
      managerName: manager.managerName,
      teamName: manager.teamName,
      players: validPicks,
      totalGoals,
      allScored,
      status: validPicks
        ? computeStatus(totalGoals, allScored, currentGameweek)
        : "no-picks",
    };
  });

  return participants.sort((a, b) => b.totalGoals - a.totalGoals);
}
