import { getManagers } from "./managers";
import { getBlackjackPicks } from "./blackjackPicks";
import { getPlayersData, type Player } from "./players";

export const BLACKJACK_TARGET = 21;
export const TOTAL_GAMEWEEKS = 38;
const PACE_TOLERANCE_INNER = 2; // on-pace boundary
const PACE_TOLERANCE_OUTER = 5; // at-risk / miles-off boundary

export type BlackjackStatus =
  | "no-picks"
  | "bust"
  | "blackjack"
  | "at-risk"
  | "ahead"
  | "on-pace"
  | "behind"
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
  if (totalGoals > BLACKJACK_TARGET) return "bust";
  if (totalGoals === BLACKJACK_TARGET && allScored) return "blackjack";

  const expectedPace = (BLACKJACK_TARGET * currentGameweek) / TOTAL_GAMEWEEKS;
  const delta = totalGoals - expectedPace;
  if (delta > PACE_TOLERANCE_OUTER) return "at-risk";
  if (delta > PACE_TOLERANCE_INNER) return "ahead";
  if (delta < -PACE_TOLERANCE_OUTER) return "miles-off";
  if (delta < -PACE_TOLERANCE_INNER) return "behind";
  return "on-pace";
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
