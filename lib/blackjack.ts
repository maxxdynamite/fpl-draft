import { getManagers } from "./managers";
import { getBlackjackPicks } from "./blackjackPicks";
import { getPlayersData, type Player } from "./players";

export const BLACKJACK_TARGET = 21;
export const TOTAL_GAMEWEEKS = 38;
// The pace-band ladder (miles-off/under/on/over-target/at-risk) mirrors
// the user's own spreadsheet formula exactly, including the asymmetric
// outer bounds - miles-off at -5, at-risk at +4, not a rounded +-5:
// =IF(C3>21,"BUST",IF(C3<pace-5,"Miles Off It",IF(C3<pace-0.5,
// "Under Target",IF(C3<=pace+0.5,"On Target",IF(C3<=pace+4,"Over Target",
// "At Risk")))))
// That asymmetry is deliberate, not just copied: falling behind is
// recoverable (more patience before "Miles Off It"), busting isn't (less
// patience before "At Risk"). computeStatus below wraps this ladder with
// absolute/terminal checks - see its own comment for what those cover and
// why the ladder alone was never the whole picture.
const PACE_TOLERANCE = 0.5; // on-target boundary
const PACE_LOW_OUTER = 5; // miles-off boundary (below expected pace)
const PACE_HIGH_OUTER = 4; // at-risk boundary (above expected pace)
// Gameweeks 1-3 aren't enough sample to read pace from - expectedPace is
// so small this early (~0.55 at GW1) that a single goal is effectively
// the entire on-target band. "Early Days" (below) stands in until there's
// enough season played for the ladder to mean anything; GW4 is the first
// point a single goal can no longer swing more than about half of
// expectedPace.
const GRACE_PERIOD_GAMEWEEKS = 4;

export type BlackjackStatus =
  | "no-picks"
  | "selected"
  | "early-days"
  | "bust"
  | "edge"
  | "blackjack"
  | "fell-short"
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
//
// Priority order below, and why each check comes before the pace ladder:
//
// 1. Pre-season (currentGameweek===0): pace is meaningless before a ball's
//    been kicked - expectedPace works out to 0, which everyone's 0-goal
//    total trivially satisfies as "on target".
// 2. totalGoals > 21: bust, always, any gameweek - permanent and
//    irreversible the instant it happens, nothing later can undo it.
// 3. totalGoals === 21 && !allScored: also bust, immediately, not just
//    once the season ends. This is a dead end regardless of when it
//    happens - the zero-scoring pick either eventually scores (pushing
//    the total to 22+, an eventual real bust) or never does (ending
//    unqualified at 21) - there is no path from here to a real win, ever.
//    lib/money.ts and app/money/page.tsx both gate Blackjack pot
//    eligibility on status !== "bust", so this is also what correctly
//    excludes these participants from the pot once the season's done.
// 4. totalGoals === 21 && allScored: sitting exactly on the winning
//    number. Only reads as the real "blackjack" win once the season is
//    actually over (currentGameweek >= TOTAL_GAMEWEEKS) - before that,
//    totalGoals only ever goes up, so the very next goal from *any* of
//    the 4 picks (even ones who've already scored) would flip it straight
//    to bust. Reading it as final mid-season let a claimed win silently
//    disappear on the next data refresh; "edge" instead marks it as the
//    single most precarious state in the game - zero buffer, could still
//    go either way.
// 5. Season over, totalGoals < 21: "fell-short" - a final result, not a
//    "keep chasing" pace read, since there's no season left to catch up
//    in.
// 6. currentGameweek < GRACE_PERIOD_GAMEWEEKS: "early-days" - too little
//    of the season played for the pace ladder to mean anything yet (see
//    GRACE_PERIOD_GAMEWEEKS's own comment).
// 7. Everything else: the unchanged pace-band ladder.
export function computeStatus(
  totalGoals: number,
  allScored: boolean,
  currentGameweek: number,
): BlackjackStatus {
  if (currentGameweek === 0) return "selected";

  if (totalGoals > BLACKJACK_TARGET) return "bust";
  if (totalGoals === BLACKJACK_TARGET && !allScored) return "bust";

  const seasonOver = currentGameweek >= TOTAL_GAMEWEEKS;

  if (totalGoals === BLACKJACK_TARGET) {
    // allScored is guaranteed true here (the !allScored case returned above).
    return seasonOver ? "blackjack" : "edge";
  }

  if (seasonOver) return "fell-short";
  if (currentGameweek < GRACE_PERIOD_GAMEWEEKS) return "early-days";

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
