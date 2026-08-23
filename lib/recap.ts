import { getH2hMatchups } from "./h2h";
import { getBlackjackLeaderboard, type BlackjackStatus } from "./blackjack";
import { getLeagueName } from "./leagueInfo";

// aName/aScore is always teamA, bName/bScore always teamB - same left/right
// pairing as the draft page's own H2H tiles (getH2hMatchups() already
// produces that order), not "winner first". Which side actually won is
// derived separately wherever it's needed (colouring a row, describing
// the closest match in words) rather than baked into the list order.
export type RecapMatchup = {
  aName: string;
  aScore: number;
  bName: string;
  bScore: number;
  margin: number;
};

export type RecapWinnerLoser = {
  winnerName: string;
  winnerScore: number;
  loserName: string;
  loserScore: number;
};

export type RecapBlackjackRow = {
  managerName: string;
  goals: number;
  status: BlackjackStatus;
};

// A small run of text where some spans are emphasised (bold/bright) -
// shared by both the generated image (each token becomes a styled JSX
// span) and the WhatsApp caption (tokens just concatenate), so the two
// never drift out of sync with each other.
export type RecapToken = { text: string; strong?: boolean };

export type RecapData = {
  gameweek: number;
  leagueName: string;
  headline: RecapToken[];
  h2hResults: RecapMatchup[]; // draft-page order, not sorted by margin
  closestMatch: RecapWinnerLoser | null;
  blackjackAll: RecapBlackjackRow[]; // every manager, ranked by goals
  bottomManagerName: string | null;
  bottomScore: number | null;
};

function winnerLoser(m: RecapMatchup): RecapWinnerLoser {
  return m.aScore >= m.bScore
    ? { winnerName: m.aName, winnerScore: m.aScore, loserName: m.bName, loserScore: m.bScore }
    : { winnerName: m.bName, winnerScore: m.bScore, loserName: m.aName, loserScore: m.aScore };
}

// A raw goal tally alone doesn't say whether the Blackjack leader is in a
// good spot - reaching 21 needs the right pace across the whole season,
// so being well ahead this early is a genuine risk (busting before it
// counts), not an unambiguous positive, while being right on target is
// the actually good outcome. Reuses the same status the rest of the app
// already computes (lib/blackjackStatus.ts) rather than re-deriving pace
// judgement from scratch here.
function blackjackLeaderClause(row: RecapBlackjackRow): RecapToken[] {
  const goals: RecapToken = { text: `${row.goals} goal${row.goals === 1 ? "" : "s"}`, strong: true };
  switch (row.status) {
    case "blackjack":
    case "winner":
      return [{ text: " and has already hit an actual blackjack — " }, goals, { text: ", dead on 21." }];
    case "over-target":
      return [
        { text: " and leads the Blackjack pot with " },
        goals,
        { text: " — well ahead of pace already, which isn't unambiguously good news this early." },
      ];
    case "at-risk":
    case "edge":
      return [
        { text: " and leads the Blackjack pot on " },
        goals,
        { text: ", but is living dangerously close to busting." },
      ];
    case "on-target":
      return [{ text: " and is right on pace atop the Blackjack pot with " }, goals, { text: "." }];
    case "early-days":
      return [
        { text: " and currently leads the Blackjack pot with " },
        goals,
        { text: " — too early to read much into pace yet." },
      ];
    default:
      return [{ text: " and leads the Blackjack pot with " }, goals, { text: "." }];
  }
}

// MOCKUP MODE: this project's whole live-data philosophy (see
// lib/h2h.ts, lib/liveStandings.ts, app/money/page.tsx) is that nothing
// "official" - H2H tallies, wagers - should reflect a gameweek before FPL
// actually locks it. A recap is exactly that kind of official summary, so
// the real version of this function will need the same finished-gameweek
// gate before it's ever shown beyond this dev build. For now it
// deliberately ignores that and narrates whatever getH2hMatchups()'s
// live-preferred scores currently say, since the point of this pass is
// to see the actual page/image working end-to-end before gameweek 1 has
// really finished. Revisit before this goes further than a dev preview.
export async function getRecapData(): Promise<RecapData> {
  const [matchups, blackjackParticipants, leagueName] = await Promise.all([
    getH2hMatchups(),
    getBlackjackLeaderboard(),
    getLeagueName(),
  ]);

  const gameweek = matchups[0]?.teamA.latestGameweek ?? 1;

  // Draft-page order, not re-sorted - same pairing/left-right as
  // getH2hMatchups() already gives every other H2H view in the app.
  const h2hResults: RecapMatchup[] = matchups
    .map((m): RecapMatchup | null => {
      const a = m.teamA;
      const b = m.teamB;
      if (a.latestScore === null || b.latestScore === null) return null;
      return {
        aName: a.managerName,
        aScore: a.latestScore,
        bName: b.managerName,
        bScore: b.latestScore,
        margin: Math.abs(a.latestScore - b.latestScore),
      };
    })
    .filter((r): r is RecapMatchup => r !== null);

  // Sorted by margin only for picking out the closest match's words in
  // the caption - the list above stays in draft-page order regardless.
  const byMargin = [...h2hResults].sort((x, y) => x.margin - y.margin);
  const closestMatch = byMargin.length > 0 ? winnerLoser(byMargin[0]) : null;

  // Flattened across both sides of every matchup - covers every manager
  // exactly once, same pool getH2hMatchups() already builds from.
  const allSides = matchups.flatMap((m) => [m.teamA, m.teamB]);
  const scored = allSides.filter((s) => s.latestScore !== null);
  const topManager = scored.reduce(
    (best, s) => (s.latestScore! > best.latestScore! ? s : best),
    scored[0],
  );
  const bottomManager = scored.reduce(
    (worst, s) => (s.latestScore! < worst.latestScore! ? s : worst),
    scored[0],
  );

  const blackjackAll: RecapBlackjackRow[] = blackjackParticipants
    .filter((p) => p.players !== null)
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .map((p) => ({ managerName: p.managerName, goals: p.totalGoals, status: p.status }));
  const blackjackLeader = blackjackAll[0] ?? null;

  // Same top-scorer as the Blackjack leader is a genuinely different,
  // better story than either fact alone - worth its own sentence rather
  // than two generic ones. The Blackjack half is pace-aware (see
  // blackjackLeaderClause) rather than just repeating the goal count.
  const headline: RecapToken[] =
    topManager && blackjackLeader && topManager.managerName === blackjackLeader.managerName
      ? [
          { text: topManager.managerName, strong: true },
          { text: " is having himself a week — top scorer on " },
          { text: `${topManager.latestScore} pts`, strong: true },
          ...blackjackLeaderClause(blackjackLeader),
        ]
      : topManager
        ? [
            { text: topManager.managerName, strong: true },
            { text: " tops the gameweek on " },
            { text: `${topManager.latestScore} pts`, strong: true },
            { text: "." },
          ]
        : [];

  return {
    gameweek,
    leagueName,
    headline,
    h2hResults,
    closestMatch,
    blackjackAll,
    bottomManagerName: bottomManager?.managerName ?? null,
    bottomScore: bottomManager?.latestScore ?? null,
  };
}

// Plain-text version of a token run, for the WhatsApp caption - the image
// route renders the same tokens as styled JSX spans instead.
export function tokensToText(tokens: RecapToken[]): string {
  return tokens.map((t) => t.text).join("");
}
