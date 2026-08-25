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
  | "winner"
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
  goalsThisGw: number; // goals from this participant's picks in the current gameweek only, not the season total
  allScored: boolean; // every pick has scored at least once
  status: BlackjackStatus;
  // Same formula computeStatus's own pace ladder uses internally, exposed
  // here for the progress bar's pace tick (BlackjackParticipantCard) - not
  // a new calculation, just this one already being made visible. Null
  // whenever there's no season left to chase pace in: pre-season, no
  // picks, or any terminal status (bust/blackjack/winner/fell-short).
  expectedPace: number | null;
};

const TERMINAL_STATUSES: readonly BlackjackStatus[] = [
  "no-picks",
  "selected",
  "bust",
  "blackjack",
  "winner",
  "fell-short",
];

// Same formula computeStatus's own pace ladder uses internally - exported
// so callers building a BlackjackParticipant (getBlackjackLeaderboard
// below, and app/blackjack/preview/page.tsx's mock data) share one
// implementation instead of two that could drift apart.
export function computeExpectedPace(status: BlackjackStatus, currentGameweek: number): number | null {
  return TERMINAL_STATUSES.includes(status) ? null : (BLACKJACK_TARGET * currentGameweek) / TOTAL_GAMEWEEKS;
}

// Per-player goals scored in one specific gameweek - separate from
// lib/players.ts's Player.goals, which is the season-to-date total. The
// general FPL API (not the Draft-specific one, same convention as
// getPlayersData) tracks this per event; used to show "+N this GW" next
// to a participant's season total without needing any historical
// snapshot of our own - it's a live, independently queryable stat for
// whichever gameweek is currently live, same as everything else this
// game reads from bootstrap-static.
async function getGameweekGoalsByPlayerId(gameweek: number): Promise<Map<number, number>> {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/event/${gameweek}/live/`,
    { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch gameweek ${gameweek} live stats: ${res.status}`);
  }
  const data = await res.json();
  const elements: Array<{ id: number; stats: { goals_scored: number } }> = data.elements ?? [];
  return new Map(elements.map((e) => [e.id, e.stats.goals_scored]));
}

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

// The actual Blackjack pot winner: highest totalGoals among everyone who
// isn't bust, ties broken by lower entryId. Shared between here (to know
// whose status becomes "winner" below) and lib/money.ts's blackjackPotRule
// (who actually gets paid) - both need to agree on exactly the same
// person, so there's one implementation, not two that could drift.
export function findBlackjackWinner<T extends { entryId: number; totalGoals: number; status: string }>(
  participants: T[],
): T | null {
  const contenders = participants.filter((p) => p.status !== "bust");
  if (contenders.length === 0) return null;

  let winner = contenders[0];
  for (const p of contenders) {
    if (p.totalGoals > winner.totalGoals || (p.totalGoals === winner.totalGoals && p.entryId < winner.entryId)) {
      winner = p;
    }
  }
  return winner;
}

// Once the season's over, the pot winner is real regardless of how they
// got there - if they reached it any way other than an actual 21-goal
// blackjack (e.g. everyone else busted or fell short, and 18 goals turned
// out to be the best total), their status upgrades from "fell-short" to
// "winner" instead. A real blackjack winner (status "blackjack" already)
// is left alone - they don't need upgrading, they already have the best
// possible result. Mutates the given array's entries in place, since
// every caller (getBlackjackLeaderboard below, the dev preview page)
// already owns the array it's passing in.
export function applyWinnerStatus(
  participants: BlackjackParticipant[],
  currentGameweek: number,
): void {
  if (currentGameweek < TOTAL_GAMEWEEKS) return;
  const winner = findBlackjackWinner(participants);
  if (winner && winner.status === "fell-short") {
    winner.status = "winner";
  }
}

// Combines manager identity, submitted picks, and live player goal counts
// into a per-participant result, ranked by total goals (leaderboard order).
export async function getBlackjackLeaderboard(): Promise<BlackjackParticipant[]> {
  const [managers, picks, { players, currentGameweek }] = await Promise.all([
    getManagers(),
    getBlackjackPicks(),
    getPlayersData(),
  ]);
  // Pre-season there's no live gameweek to ask about yet - same guard
  // computeStatus itself already uses for currentGameweek === 0.
  const gwGoalsByPlayerId =
    currentGameweek > 0 ? await getGameweekGoalsByPlayerId(currentGameweek) : new Map<number, number>();

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
    // Clamped to totalGoals: this comes from a separate live endpoint
    // (the per-gameweek event feed) than the season-cumulative Player.goals
    // above (bootstrap-static), and the two don't always update in lockstep
    // - bootstrap-static has been observed lagging a goal the live event
    // feed already has. A weekly delta can never legitimately exceed the
    // season total, so if they ever disagree, trust the more conservative
    // number rather than show something that looks self-contradictory
    // ("0 / 21, +4 this GW").
    const goalsThisGw = validPicks
      ? Math.min(totalGoals, validPicks.reduce((sum, p) => sum + (gwGoalsByPlayerId.get(p.id) ?? 0), 0))
      : 0;
    const allScored = validPicks ? validPicks.every((p) => p.goals > 0) : false;
    const status: BlackjackStatus = validPicks
      ? computeStatus(totalGoals, allScored, currentGameweek)
      : "no-picks";

    return {
      entryId: manager.entryId,
      managerName: manager.managerName,
      teamName: manager.teamName,
      players: validPicks,
      totalGoals,
      goalsThisGw,
      allScored,
      status,
      expectedPace: computeExpectedPace(status, currentGameweek),
    };
  });

  applyWinnerStatus(participants, currentGameweek);

  return participants.sort((a, b) => b.totalGoals - a.totalGoals);
}
