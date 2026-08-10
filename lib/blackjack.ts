import { getManagers } from "./managers";
import { getBlackjackPicks } from "./blackjackPicks";
import { getPlayersData, type Player } from "./players";
import { getCurrentGameweek } from "./gameweek";

export const BLACKJACK_TARGET = 21;
export const TOTAL_GAMEWEEKS = 38;
const PACE_TOLERANCE = 2;

export type BlackjackStatus =
  | "no-picks"
  | "bust"
  | "blackjack"
  | "ahead"
  | "on-pace"
  | "behind";

export type BlackjackParticipant = {
  entryId: number;
  managerName: string;
  teamName: string;
  players: Player[] | null; // null until picks are submitted
  totalGoals: number;
  status: BlackjackStatus;
};

function computeStatus(totalGoals: number, currentGameweek: number): BlackjackStatus {
  if (totalGoals > BLACKJACK_TARGET) return "bust";
  if (totalGoals === BLACKJACK_TARGET) return "blackjack";

  const expectedPace = (BLACKJACK_TARGET * currentGameweek) / TOTAL_GAMEWEEKS;
  if (totalGoals > expectedPace + PACE_TOLERANCE) return "ahead";
  if (totalGoals < expectedPace - PACE_TOLERANCE) return "behind";
  return "on-pace";
}

// Combines manager identity, submitted picks, and live player goal counts
// into a per-participant result, ranked by total goals (leaderboard order).
export async function getBlackjackLeaderboard(): Promise<BlackjackParticipant[]> {
  const [managers, picks, { players }, gameweek] = await Promise.all([
    getManagers(),
    getBlackjackPicks(),
    getPlayersData(),
    getCurrentGameweek(),
  ]);

  const playersById = new Map(players.map((p) => [p.id, p]));
  const picksByEntry = new Map(picks.map((p) => [p.entryId, p]));
  const currentGameweek = gameweek?.number ?? 0;

  const participants: BlackjackParticipant[] = managers.map((manager) => {
    const pick = picksByEntry.get(manager.entryId);
    const pickedPlayers =
      pick && pick.playerIds.length === 4
        ? pick.playerIds.map((id) => playersById.get(id)).filter((p): p is Player => !!p)
        : null;

    const validPicks = pickedPlayers && pickedPlayers.length === 4 ? pickedPlayers : null;
    const totalGoals = validPicks ? validPicks.reduce((sum, p) => sum + p.goals, 0) : 0;

    return {
      entryId: manager.entryId,
      managerName: manager.managerName,
      teamName: manager.teamName,
      players: validPicks,
      totalGoals,
      status: validPicks ? computeStatus(totalGoals, currentGameweek) : "no-picks",
    };
  });

  return participants.sort((a, b) => b.totalGoals - a.totalGoals);
}
