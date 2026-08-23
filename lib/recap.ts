import { getH2hMatchups } from "./h2h";
import { getBlackjackLeaderboard } from "./blackjack";
import { getLeagueName } from "./leagueInfo";

export type RecapMatchup = {
  winnerName: string;
  winnerScore: number;
  loserName: string;
  loserScore: number;
  margin: number;
};

export type RecapBlackjackRow = {
  managerName: string;
  goals: number;
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
  h2hResults: RecapMatchup[]; // sorted by margin, biggest first
  closestMatch: RecapMatchup | null;
  blackjackTop: RecapBlackjackRow[];
  bottomManagerName: string | null;
  bottomScore: number | null;
};

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

  const h2hResults: RecapMatchup[] = matchups
    .map((m): RecapMatchup | null => {
      const a = m.teamA;
      const b = m.teamB;
      if (a.latestScore === null || b.latestScore === null) return null;
      const [winner, loser] =
        a.latestScore >= b.latestScore ? [a, b] : [b, a];
      return {
        winnerName: winner.managerName,
        winnerScore: winner.latestScore!,
        loserName: loser.managerName,
        loserScore: loser.latestScore!,
        margin: winner.latestScore! - loser.latestScore!,
      };
    })
    .filter((r): r is RecapMatchup => r !== null)
    .sort((a, b) => b.margin - a.margin);

  const biggestWin = h2hResults[0] ?? null;
  const closestMatch =
    h2hResults.length > 0 ? h2hResults[h2hResults.length - 1] : null;

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

  const blackjackTop: RecapBlackjackRow[] = blackjackParticipants
    .filter((p) => p.players !== null)
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .slice(0, 3)
    .map((p) => ({ managerName: p.managerName, goals: p.totalGoals }));
  const blackjackLeader = blackjackTop[0] ?? null;

  // Same top-scorer as the Blackjack leader is a genuinely different,
  // better story than either fact alone - worth its own sentence rather
  // than two generic ones.
  const headline: RecapToken[] =
    topManager && blackjackLeader && topManager.managerName === blackjackLeader.managerName
      ? [
          { text: topManager.managerName, strong: true },
          { text: " is having himself a week — top scorer on " },
          { text: `${topManager.latestScore} pts`, strong: true },
          { text: " and leading the Blackjack pot with " },
          { text: `${blackjackLeader.goals} goals`, strong: true },
          { text: " already." },
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
    closestMatch: closestMatch && closestMatch !== biggestWin ? closestMatch : null,
    blackjackTop,
    bottomManagerName: bottomManager?.managerName ?? null,
    bottomScore: bottomManager?.latestScore ?? null,
  };
}

// Plain-text version of a token run, for the WhatsApp caption - the image
// route renders the same tokens as styled JSX spans instead.
export function tokensToText(tokens: RecapToken[]): string {
  return tokens.map((t) => t.text).join("");
}
