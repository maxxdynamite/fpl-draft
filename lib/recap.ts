import { getH2hMatchups, type H2hSide } from "./h2h";
import { getBlackjackLeaderboard, getGameweekGoalsByPlayerId, type BlackjackStatus } from "./blackjack";
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

// Both managerName and teamName travel together almost everywhere now -
// the dry-humour voice leans on team names (this league's are mostly
// jokes) for flavour while keeping the manager identifiable, rather than
// segregating "this line gets one, that line gets the other". Blackjack
// stays managerName-only throughout, deliberately - see RecapBlackjackRow.
export type RecapHotStreak = { managerName: string; teamName: string; streak: number };
export type RecapSeasonScore = { teamName: string; score: number; gameweek: number };
export type RecapOverallStanding = { teamName: string; totalPoints: number };
export type RecapAward = { teamName: string; points: number };
// A manager's picks scored this specific gameweek - not the season total
// (BlackjackParticipant.totalGoals) or the live current gameweek's delta
// (BlackjackParticipant.goalsThisGw, which drifts once a later gameweek
// goes live) - see getRecapData's own comment on why a recap always
// targets one fixed, already-synced gameweek.
export type RecapBlackjackMove = { managerName: string; goalsAdded: number };
export type RecapTopScorer = { managerName: string; teamName: string; points: number };
export type RecapBlackjackLeader = { managerName: string; goals: number; status: BlackjackStatus };

export type RecapData = {
  gameweek: number;
  leagueName: string;
  // Raw top-scorer/Blackjack-leader facts, for lib/recapSummary.ts's AI
  // writer (see that file for how they're used).
  topScorer: RecapTopScorer | null;
  blackjackLeader: RecapBlackjackLeader | null;
  h2hResults: RecapMatchup[]; // draft-page order, not sorted by margin
  closestMatch: RecapWinnerLoser | null;
  otherMatches: RecapWinnerLoser[]; // every h2hResults entry except closestMatch, draft-page order
  blackjackAll: RecapBlackjackRow[]; // every manager, ranked by goals
  hotStreak: RecapHotStreak | null; // longest active H2H win streak, gated at STREAK_THRESHOLD
  seasonHigh: RecapSeasonScore | null; // gated at MIN_GAMEWEEKS_FOR_SEASON_RECORDS
  seasonLow: RecapSeasonScore | null;
  overallTop: RecapOverallStanding | null;
  overallBottom: RecapOverallStanding | null;
  // Top 3 only, for the outline caption's "BB Draft" section - separate
  // from overallTop above (which is just 1st, used elsewhere) rather than
  // slicing it out of a full standings list every caller would otherwise
  // need to fetch again.
  overallTop3: RecapOverallStanding[];
  motw: RecapAward | null;
  sotw: RecapAward | null;
  // Every manager who added at least one Blackjack goal this gameweek
  // specifically, highest first - empty (not null) when nobody did.
  blackjackMoves: RecapBlackjackMove[];
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

// A recap is an "official" summary in the same sense as H2H tallies and
// wagers (see lib/h2h.ts, lib/liveStandings.ts, app/money/page.tsx) - it
// must describe a gameweek that's actually finished and synced, never a
// live/in-progress one. Unlike those other views, a recap also can't
// silently fall back to "no live data yet, show official instead" - it
// specifically narrates ONE gameweek, so it needs its own target rather
// than picking up whatever getH2hMatchups() happens to be showing live
// right now (which would start describing gameweek 2's in-progress
// scores the moment it kicks off, instead of recapping gameweek 1).
// gwScores is the only source that's ever purely synced/official, so the
// target gameweek - and every score quoted for it - comes from there,
// not from matchups' live-preferred latestScore/latestGameweek. Returns
// null before the very first sync has happened, since there's nothing to
// recap yet.
export async function getRecapData(): Promise<RecapData | null> {
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
  if (gwScores.length === 0) return null;

  const managerNameByEntry = new Map(managers.map((m) => [m.entryId, m.managerName]));
  const teamNameByEntry = new Map(managers.map((m) => [m.entryId, m.teamName]));

  const gameweek = Math.max(...gwScores.map((r) => r.gameweek));
  const syncedScoreByEntry = new Map(
    gwScores.filter((r) => r.gameweek === gameweek).map((r) => [r.entryId, r.eventTotal]),
  );

  // Goals scored in this specific (already-locked) gameweek, not whatever
  // gameweek happens to be live right now - same targeted-gameweek
  // reasoning as syncedScoreByEntry above, just for Blackjack instead of
  // H2H scores.
  const gwGoalsByPlayerId = await getGameweekGoalsByPlayerId(gameweek);

  // Draft-page order, not re-sorted - same pairing/left-right as
  // getH2hMatchups() already gives every other H2H view in the app.
  // Scores come from syncedScoreByEntry (this gameweek's official
  // GW_Scores rows), not matchups' own live-preferred latestScore - see
  // this function's own comment above for why.
  const h2hResults: RecapMatchup[] = matchups
    .map((m): RecapMatchup | null => {
      const a = m.teamA;
      const b = m.teamB;
      const aScore = syncedScoreByEntry.get(a.entryId);
      const bScore = syncedScoreByEntry.get(b.entryId);
      if (aScore === undefined || bScore === undefined) return null;
      return {
        aName: a.managerName,
        aTeam: a.teamName,
        aScore,
        bName: b.managerName,
        bTeam: b.teamName,
        bScore,
        margin: Math.abs(aScore - bScore),
      };
    })
    .filter((r): r is RecapMatchup => r !== null);

  // Sorted by margin only for picking out the closest match's words in
  // the caption - the list above stays in draft-page order regardless.
  const byMargin = [...h2hResults].sort((x, y) => x.margin - y.margin);
  const closestMatchRow = byMargin[0] ?? null;
  const closestMatch = closestMatchRow ? winnerLoser(closestMatchRow) : null;

  // Every other matchup, for the caption's rundown of results that
  // didn't already get their own sentence - draft-page order, same as
  // h2hResults, not resorted by margin like closestMatch was. Compared
  // by reference (same array as h2hResults, just filtered), not by
  // score, since two different pairings could share the same margin.
  const otherMatches: RecapWinnerLoser[] = h2hResults
    .filter((m) => m !== closestMatchRow)
    .map(winnerLoser);

  // Flattened across both sides of every matchup - covers every manager
  // exactly once, same pool getH2hMatchups() already builds from. Scores
  // come from syncedScoreByEntry, same reasoning as h2hResults above.
  const allSides = matchups
    .flatMap((m) => [m.teamA, m.teamB])
    .map((s) => ({ ...s, syncedScore: syncedScoreByEntry.get(s.entryId) ?? null }));
  const scored = allSides.filter((s) => s.syncedScore !== null);
  const topManager = scored.reduce(
    (best, s) => (s.syncedScore! > best.syncedScore! ? s : best),
    scored[0],
  );

  const blackjackAll: RecapBlackjackRow[] = blackjackParticipants
    .filter((p) => p.players !== null)
    .sort((a, b) => b.totalGoals - a.totalGoals)
    .map((p) => ({ managerName: p.managerName, goals: p.totalGoals, status: p.status }));
  const blackjackLeader = blackjackAll[0] ?? null;

  // This gameweek's Blackjack additions specifically - each participant's
  // own picks (already resolved on BlackjackParticipant.players) summed
  // against gwGoalsByPlayerId above, not the season-total goals those
  // Player records also carry. Highest first; entryId tie-break for a
  // stable order, same convention as findBlackjackWinner.
  const blackjackMoves: RecapBlackjackMove[] = blackjackParticipants
    .filter((p) => p.players !== null)
    .map((p) => ({
      entryId: p.entryId,
      managerName: p.managerName,
      goalsAdded: p.players!.reduce((sum, pl) => sum + (gwGoalsByPlayerId.get(pl.id) ?? 0), 0),
    }))
    .filter((m) => m.goalsAdded > 0)
    .sort((a, b) => b.goalsAdded - a.goalsAdded || a.entryId - b.entryId)
    .map(({ managerName, goalsAdded }) => ({ managerName, goalsAdded }));

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
  const overallTop3: RecapOverallStanding[] = standingsHaveSpread
    ? standings
        .slice(0, 3)
        .map((s) => ({ teamName: teamNameByEntry.get(s.entryId) ?? "Unknown", totalPoints: s.totalPoints }))
    : [];

  return {
    gameweek,
    leagueName,
    topScorer: topManager
      ? { managerName: topManager.managerName, teamName: topManager.teamName, points: topManager.syncedScore! }
      : null,
    blackjackLeader: blackjackLeader
      ? { managerName: blackjackLeader.managerName, goals: blackjackLeader.goals, status: blackjackLeader.status }
      : null,
    h2hResults,
    closestMatch,
    otherMatches,
    blackjackAll,
    hotStreak,
    seasonHigh,
    seasonLow,
    overallTop,
    overallBottom,
    overallTop3,
    motw: weeklyAwards ? { teamName: weeklyAwards.motwTeam, points: weeklyAwards.motwPoints } : null,
    sotw: weeklyAwards ? { teamName: weeklyAwards.sotwTeam, points: weeklyAwards.sotwPoints } : null,
    blackjackMoves,
  };
}

// Scheme included (not just the bare domain) so WhatsApp reliably treats it
// as a tappable link even embedded in an image caption, not just as a
// plain-text message on its own - see ShareButton's own comment on what
// that combination does and doesn't get you. Appended identically to both
// the AI-written caption and this template fallback, rather than trusting
// either path to reproduce it exactly.
export const RECAP_LINK_LINE = "Everything else is in the app 👉 https://badblokesweekly.vercel.app";

// A scannable outline, not prose - just the facts, laid out under fixed
// headers rather than woven into sentences. Used as the reliability
// fallback when the AI-written recap (lib/recapSummary.ts) is unavailable
// (no API key, request failure, refusal), but also the default shape as
// long as the AI path stays off - see app/recap/page.tsx.
export function buildTemplateCaption(data: RecapData): string {
  const sections = [
    `GW${data.gameweek}:`,
    data.motw && data.sotw
      ? `🏆 MOTW: ${data.motw.teamName} (${data.motw.points} pts)\n🔧 SOTW: ${data.sotw.teamName} (${data.sotw.points} pts)`
      : null,
    data.h2hResults.length > 0
      ? `H2H:\n${data.h2hResults.map((m) => `${m.aName} ${m.aScore} – ${m.bScore} ${m.bName}`).join("\n")}`
      : null,
    data.overallTop3.length > 0
      ? `BB Draft:\n${data.overallTop3.map((s, i) => `${i + 1}. ${s.teamName} — ${s.totalPoints} pts`).join("\n")}`
      : null,
    data.blackjackMoves.length > 0
      ? `Blackjack Moves:\n${data.blackjackMoves.map((m) => `${m.managerName} ⬆️${m.goalsAdded}`).join("\n")}`
      : null,
    RECAP_LINK_LINE,
  ].filter((s): s is string => s !== null);
  return sections.join("\n\n");
}
