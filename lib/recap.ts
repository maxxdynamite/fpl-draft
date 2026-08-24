import { getH2hMatchups, type H2hSide } from "./h2h";
import { getBlackjackLeaderboard, type BlackjackStatus } from "./blackjack";
import { getLeagueName } from "./leagueInfo";
import { getManagers } from "./managers";
import { getGwScores } from "./gwScores";
import { getStandings } from "./standings";
import { getWeeklyAwards } from "./weeklyAwards";

// Same threshold H2hTile's own StreakBadge uses to decide a streak is
// worth calling out at all - a 1 or 2-game run isn't a story yet.
const STREAK_THRESHOLD = 3;
// Season high/low only means something once there's an actual season's
// worth of weeks to compare - at GW1 or 2 it would just silently repeat
// this week's own top/bottom score under a fancier name.
const MIN_GAMEWEEKS_FOR_SEASON_RECORDS = 3;

// aName/aScore is always teamA, bName/bScore always teamB - same left/right
// pairing as the draft page's own H2H tiles (getH2hMatchups() already
// produces that order), not "winner first". Which side actually won is
// derived separately wherever it's needed (colouring a row, describing
// the closest match in words) rather than baked into the list order.
// aTeam/bTeam are caption-only (the image route never reads them) - the
// dry-humour voice wants both the manager and their team name in play,
// not just one or the other.
export type RecapMatchup = {
  aName: string;
  aTeam: string;
  aScore: number;
  bName: string;
  bTeam: string;
  bScore: number;
  margin: number;
};

export type RecapWinnerLoser = {
  winnerName: string;
  winnerTeam: string;
  winnerScore: number;
  loserName: string;
  loserTeam: string;
  loserScore: number;
  // A genuine tie has no winner - winnerName/loserName still get
  // populated (one side arbitrarily first) so callers that don't care
  // about ties don't need a separate null-handling path, but anything
  // narrating this in words needs to check isTie first rather than
  // calling a 12-12 draw an "edge".
  isTie: boolean;
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

// Both managerName and teamName travel together almost everywhere now -
// the dry-humour voice leans on team names (this league's are mostly
// jokes) for flavour while keeping the manager identifiable, rather than
// segregating "this line gets one, that line gets the other". Blackjack
// stays managerName-only throughout, deliberately - see RecapBlackjackRow.
export type RecapPersonScore = { managerName: string; teamName: string; score: number };
export type RecapHotStreak = { managerName: string; teamName: string; streak: number };
export type RecapSeasonScore = { teamName: string; score: number; gameweek: number };
export type RecapOverallStanding = { teamName: string; totalPoints: number };
export type RecapAward = { teamName: string; points: number };

export type RecapData = {
  gameweek: number;
  leagueName: string;
  headline: RecapToken[];
  h2hResults: RecapMatchup[]; // draft-page order, not sorted by margin
  closestMatch: RecapWinnerLoser | null;
  blackjackAll: RecapBlackjackRow[]; // every manager, ranked by goals
  bottomOfWeek: RecapPersonScore | null;
  hotStreak: RecapHotStreak | null; // longest active H2H win streak, gated at STREAK_THRESHOLD
  seasonHigh: RecapSeasonScore | null; // gated at MIN_GAMEWEEKS_FOR_SEASON_RECORDS
  seasonLow: RecapSeasonScore | null;
  overallTop: RecapOverallStanding | null;
  overallBottom: RecapOverallStanding | null;
  motw: RecapAward | null;
  sotw: RecapAward | null;
};

function winnerLoser(m: RecapMatchup): RecapWinnerLoser {
  const isTie = m.aScore === m.bScore;
  return m.aScore >= m.bScore
    ? {
        winnerName: m.aName,
        winnerTeam: m.aTeam,
        winnerScore: m.aScore,
        loserName: m.bName,
        loserTeam: m.bTeam,
        loserScore: m.bScore,
        isTie,
      }
    : {
        winnerName: m.bName,
        winnerTeam: m.bTeam,
        winnerScore: m.bScore,
        loserName: m.aName,
        loserTeam: m.aTeam,
        loserScore: m.aScore,
        isTie,
      };
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
      // A generic "too early to call" undersold a genuinely blistering
      // start (4 from 4 picks in Gameweek 1 alone) as a shrug - the
      // grace period (see GRACE_PERIOD_GAMEWEEKS, lib/blackjack.ts) means
      // the pace ladder itself can't judge it yet, but the caption can
      // still clock that it's a hot start without pretending to know if
      // it'll last.
      return row.goals >= 3
        ? [
            { text: " and has already banked " },
            goals,
            {
              text: " for the Blackjack pot — a blistering start that's either a golden touch or a bust with extra steps.",
            },
          ]
        : [
            { text: " and currently tops the Blackjack pot with " },
            goals,
            { text: " — nothing worth reading into yet." },
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
  const [matchups, blackjackParticipants, leagueName, managers, gwScores, standings, weeklyAwards] =
    await Promise.all([
      getH2hMatchups(),
      getBlackjackLeaderboard(),
      getLeagueName(),
      getManagers(),
      getGwScores(),
      getStandings(),
      getWeeklyAwards(),
    ]);
  const managerNameByEntry = new Map(managers.map((m) => [m.entryId, m.managerName]));
  const teamNameByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));

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
        aTeam: a.teamName,
        aScore: a.latestScore,
        bName: b.managerName,
        bTeam: b.teamName,
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
          { text: ` (${topManager.teamName}) is quietly making everyone else look bad — top scorer on ` },
          { text: `${topManager.latestScore} pts`, strong: true },
          ...blackjackLeaderClause(blackjackLeader),
        ]
      : topManager
        ? [
            { text: topManager.managerName, strong: true },
            { text: ` (${topManager.teamName}) tops the gameweek on ` },
            { text: `${topManager.latestScore} pts`, strong: true },
            { text: ". Try again next week, everyone else." },
          ]
        : [];

  // Longest active H2H win streak across the whole league, not just this
  // matchup's two sides - same field (H2hSide.streak) the H2H tiles
  // themselves already show a badge for, gated at the same threshold so
  // this only calls out a streak actually worth boasting about.
  const streakLeader = allSides.reduce<H2hSide | null>(
    (best, s) => (best === null || s.streak > best.streak ? s : best),
    null,
  );
  const hotStreak: RecapHotStreak | null =
    streakLeader && streakLeader.streak >= STREAK_THRESHOLD
      ? { managerName: streakLeader.managerName, teamName: streakLeader.teamName, streak: streakLeader.streak }
      : null;

  // Season-wide extremes from GW_Scores (every gameweek played so far),
  // not just this week's - gated on having enough weeks that "season
  // high/low" means something more than "this week's high/low again".
  const distinctGameweeksPlayed = new Set(gwScores.map((row) => row.gameweek)).size;
  let seasonHigh: RecapSeasonScore | null = null;
  let seasonLow: RecapSeasonScore | null = null;
  if (distinctGameweeksPlayed >= MIN_GAMEWEEKS_FOR_SEASON_RECORDS && gwScores.length > 0) {
    const highRow = gwScores.reduce((best, row) => (row.eventTotal > best.eventTotal ? row : best));
    const lowRow = gwScores.reduce((worst, row) => (row.eventTotal < worst.eventTotal ? row : worst));
    seasonHigh = {
      teamName: teamNameByEntry.get(highRow.entryId) ?? "Unknown",
      score: highRow.eventTotal,
      gameweek: highRow.gameweek,
    };
    seasonLow = {
      teamName: teamNameByEntry.get(lowRow.entryId) ?? "Unknown",
      score: lowRow.eventTotal,
      gameweek: lowRow.gameweek,
    };
  }

  // Standings is already rank-sorted (see lib/standings.ts) - first/last
  // are simply the current overall leader and anchor. Pre-season (or any
  // point before the sheet's had a single gameweek synced into it), every
  // row sits tied at 0 - a "leader vs. bottom" sentence built from that
  // would be a coin flip between two managers who haven't actually done
  // anything yet, not a real story, so it's suppressed until the table
  // shows an actual spread.
  const standingsHaveSpread =
    standings.length > 0 && !standings.every((s) => s.totalPoints === standings[0].totalPoints);
  const overallTop: RecapOverallStanding | null =
    standingsHaveSpread && standings[0]
      ? { teamName: teamNameByEntry.get(standings[0].entryId) ?? "Unknown", totalPoints: standings[0].totalPoints }
      : null;
  const overallBottom: RecapOverallStanding | null =
    standingsHaveSpread && standings[standings.length - 1]
      ? {
          teamName: teamNameByEntry.get(standings[standings.length - 1].entryId) ?? "Unknown",
          totalPoints: standings[standings.length - 1].totalPoints,
        }
      : null;

  return {
    gameweek,
    leagueName,
    headline,
    h2hResults,
    closestMatch,
    blackjackAll,
    bottomOfWeek:
      bottomManager && bottomManager.latestScore !== null
        ? { managerName: bottomManager.managerName, teamName: bottomManager.teamName, score: bottomManager.latestScore }
        : null,
    hotStreak,
    seasonHigh,
    seasonLow,
    overallTop,
    overallBottom,
    motw: weeklyAwards ? { teamName: weeklyAwards.motwTeam, points: weeklyAwards.motwPoints } : null,
    sotw: weeklyAwards ? { teamName: weeklyAwards.sotwTeam, points: weeklyAwards.sotwPoints } : null,
  };
}

// Plain-text version of a token run, for the WhatsApp caption - the image
// route renders the same tokens as styled JSX spans instead.
export function tokensToText(tokens: RecapToken[]): string {
  return tokens.map((t) => t.text).join("");
}
