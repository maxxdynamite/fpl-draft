import { NextResponse } from "next/server";
import { getManagers } from "@/lib/managers";
import { getBlackjackPicks } from "@/lib/blackjackPicks";
import { getPlayersData } from "@/lib/players";
import { getGoalsHistoryByPlayerIds, BLACKJACK_TARGET, TOTAL_GAMEWEEKS } from "@/lib/blackjack";

// Backs the "All Gameweeks" chart on a Blackjack card - deliberately its
// own on-demand endpoint rather than baked into getBlackjackLeaderboard,
// which every card on the page needs on every /blackjack load. Per-player
// history (getGoalsHistoryByPlayerIds) costs one fetch per unique pick;
// paying that for all 14 managers upfront would be wasted on every card
// nobody expands. This route pays it only for the one entry actually
// requested, when a card's chart is actually opened.
export async function GET(request: Request) {
  const entryId = Number(new URL(request.url).searchParams.get("entryId"));
  if (!entryId) {
    return NextResponse.json({ error: "Missing or invalid entryId." }, { status: 400 });
  }

  const [managers, picks, { players, currentGameweek }] = await Promise.all([
    getManagers(),
    getBlackjackPicks(),
    getPlayersData(),
  ]);

  if (!managers.some((m) => m.entryId === entryId)) {
    return NextResponse.json({ error: "Unrecognised participant." }, { status: 404 });
  }

  if (currentGameweek === 0) {
    return NextResponse.json({ error: "Season hasn't started yet." }, { status: 400 });
  }

  const pick = picks.find((p) => p.entryId === entryId);
  const playersById = new Map(players.map((p) => [p.id, p]));
  const validPlayerIds =
    pick && pick.playerIds.length === 4 && pick.playerIds.every((id) => playersById.has(id))
      ? pick.playerIds
      : null;

  if (!validPlayerIds) {
    return NextResponse.json({ error: "No picks submitted." }, { status: 400 });
  }

  const historyByPlayerId = await getGoalsHistoryByPlayerIds(validPlayerIds, currentGameweek);

  const weekly = Array.from({ length: currentGameweek }, (_, gwIndex) =>
    validPlayerIds.reduce((sum, id) => sum + (historyByPlayerId.get(id)?.[gwIndex] ?? 0), 0),
  );

  // element-summary (weekly, above) and bootstrap-static (canonicalTotal,
  // below - the same season-cumulative source the card's own totalGoals
  // comes from) are two independently-cached live endpoints that don't
  // always update in lockstep, same root cause as goalsThisGw's clamp in
  // getBlackjackLeaderboard. Observed directly: a goal landed in
  // element-summary a few minutes before bootstrap-static's cache
  // refreshed, making this chart's total briefly exceed the big number on
  // the card it belongs to. The season total is the one number the whole
  // card is already built around, so it wins - any drift gets folded into
  // the most recent (still live) gameweek only, never into historical
  // weeks that are long since locked in.
  const canonicalTotal = validPlayerIds.reduce((sum, id) => sum + (playersById.get(id)?.goals ?? 0), 0);
  const rawTotal = weekly.reduce((sum, goals) => sum + goals, 0);
  const drift = canonicalTotal - rawTotal;
  if (drift !== 0 && weekly.length > 0) {
    weekly[weekly.length - 1] = Math.max(0, weekly[weekly.length - 1] + drift);
  }

  let running = 0;
  const cumulative = weekly.map((goals) => (running += goals));

  return NextResponse.json({
    weekly,
    cumulative,
    currentGameweek,
    totalGameweeks: TOTAL_GAMEWEEKS,
    target: BLACKJACK_TARGET,
  });
}
