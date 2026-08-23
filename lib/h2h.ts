import { getManagers } from "./managers";
import { getStandings } from "./standings";
import { getGwScores } from "./gwScores";
import { getDraftOrder } from "./draftOrder";
import { getPlayersData } from "./players";
import { getLiveGameweek } from "./liveGwScores";
import { getLiveAdjustedStandings } from "./liveStandings";

const H2H_STAKE = 5;

export type H2hSide = {
  entryId: number;
  teamName: string;
  managerName: string;
  wins: number;
  pl: number;
  latestGameweek: number | null;
  latestScore: number | null;
  streak: number;
  overallRank: number | null;
  totalPoints: number | null;
  motwCount: number | null;
  sotwCount: number | null;
  draftPosition: number | null;
  // Set once at draft time and never changes after - shown in the H2H
  // stats menu as a permanent record of round 1, not a live value.
  firstPick: string | null;
};

export type GwHistoryRow = {
  gameweek: number;
  aScore: number;
  bScore: number;
};

// Consecutive gameweeks (most recent first) this side has beaten their
// rival head-to-head, stopping at the first loss, tie, or start of history.
function computeStreak(history: GwHistoryRow[], side: "a" | "b"): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const row = history[i];
    const won = side === "a" ? row.aScore > row.bScore : row.bScore > row.aScore;
    if (!won) break;
    streak++;
  }
  return streak;
}

export type H2hMatchup = {
  teamA: H2hSide;
  teamB: H2hSide;
  history: GwHistoryRow[];
};

// Pairs each manager with their season-long rival, using each rival
// relationship once (lower entry_id first) rather than twice, and attaches
// the full gameweek-by-gameweek score history between the two of them.
export async function getH2hMatchups(): Promise<H2hMatchup[]> {
  const [managers, standings, gwScores, draftOrder, { players }, liveGameweek, liveAdjusted] =
    await Promise.all([
      getManagers(),
      getStandings(),
      getGwScores(),
      getDraftOrder(),
      getPlayersData(),
      getLiveGameweek(),
      getLiveAdjustedStandings(),
    ]);

  const standingsByEntry = new Map(standings.map((s) => [s.entryId, s]));
  const managersByEntry = new Map(managers.map((m) => [m.entryId, m]));
  const playerNameById = new Map(players.map((p) => [p.id, p.name]));
  const liveEventTotalByEntry = new Map(
    liveGameweek?.entries.map((e) => [e.entryId, e.eventTotal]) ?? [],
  );

  const scoresByEntry = new Map<number, typeof gwScores>();
  for (const row of gwScores) {
    const list = scoresByEntry.get(row.entryId) ?? [];
    list.push(row);
    scoresByEntry.set(row.entryId, list);
  }

  // A wager settling is a different bar than a display number going live -
  // this stake must wait for liveGameweek.finished (FPL's own official
  // lockdown), not just "live" or "provisional", since bonus/defensive
  // contribution points can still move the result right up until then.
  // Strict >, not >=, for the double-counting reason noted elsewhere in
  // this file: equal means that gameweek's already synced (and its stake
  // already settled), so applying this again would double-count it.
  const syncedLatestGw =
    gwScores.length > 0 ? Math.max(...gwScores.map((r) => r.gameweek)) : null;
  const canProjectLiveH2hPl =
    liveGameweek !== null &&
    liveGameweek.finished &&
    (syncedLatestGw === null || liveGameweek.eventNumber > syncedLatestGw);

  function buildSide(entryId: number, streak: number, livePlDelta: number): H2hSide {
    const manager = managersByEntry.get(entryId);
    const standing = standingsByEntry.get(entryId);
    const rows = scoresByEntry.get(entryId) ?? [];
    const latest = rows[rows.length - 1];
    const draft = draftOrder.get(entryId);
    const liveStanding = liveAdjusted.get(entryId);

    // The headline score is the only thing that goes live mid-gameweek -
    // wins/streak/history stay sheet-only (see syncCurrentGameweek's
    // finished-only guard) since those shouldn't reflect a result bonus
    // points could still flip. Prefer the live gameweek whenever it's at
    // least as recent as the last synced row, so the number people are
    // actually looking at during play isn't stuck showing last week's.
    const useLiveScore =
      liveGameweek !== null && (latest === undefined || liveGameweek.eventNumber >= latest.gameweek);
    const latestGameweek = useLiveScore ? liveGameweek!.eventNumber : (latest?.gameweek ?? null);
    const latestScore = useLiveScore
      ? (liveEventTotalByEntry.get(entryId) ?? 0)
      : (latest?.eventTotal ?? null);

    return {
      entryId,
      teamName: manager?.teamName ?? "Unknown",
      managerName: manager?.managerName ?? "Unknown",
      wins: standing?.h2hWins ?? 0,
      // Official cumulative stake plus a live projection of this week's
      // £5 H2H outcome, based on the live scores above - settles for real
      // once the gameweek locks and syncs, same as everything else here.
      pl: (standing?.pl ?? 0) + livePlDelta,
      latestGameweek,
      latestScore,
      streak,
      overallRank: liveStanding?.rank ?? standing?.rank ?? null,
      totalPoints: liveStanding?.value ?? standing?.totalPoints ?? null,
      motwCount: standing?.motwCount ?? null,
      sotwCount: standing?.sotwCount ?? null,
      draftPosition: draft?.position ?? null,
      firstPick: draft ? (playerNameById.get(draft.firstPickElementId) ?? null) : null,
    };
  }

  const matchups: H2hMatchup[] = [];
  const seen = new Set<number>();

  for (const manager of managers) {
    if (seen.has(manager.entryId)) continue;
    const rival = managersByEntry.get(manager.rivalEntryId);
    if (!rival) continue;

    seen.add(manager.entryId);
    seen.add(rival.entryId);

    const aRows = scoresByEntry.get(manager.entryId) ?? [];
    const history: GwHistoryRow[] = aRows.map((row) => ({
      gameweek: row.gameweek,
      aScore: row.eventTotal,
      bScore: row.rivalEventTotal,
    }));

    // Streak stays sheet-only (see buildSide's comment above) - the "All
    // Gameweeks" strip people actually scroll through should still show
    // the live gameweek's score, same reasoning as the headline number.
    // Appended, not merged in place: only relevant while the sheet hasn't
    // synced this gameweek yet, so there's never a synced row to collide
    // with.
    const lastSyncedGw = history[history.length - 1]?.gameweek;
    const displayHistory: GwHistoryRow[] =
      liveGameweek !== null && (lastSyncedGw === undefined || liveGameweek.eventNumber > lastSyncedGw)
        ? [
            ...history,
            {
              gameweek: liveGameweek.eventNumber,
              aScore: liveEventTotalByEntry.get(manager.entryId) ?? 0,
              bScore: liveEventTotalByEntry.get(rival.entryId) ?? 0,
            },
          ]
        : history;

    // Projected outcome of this week's £5 H2H stake if the live scores
    // stood as final right now - zero-sum between the two rivals, a tie
    // pays neither side. Only computed when canProjectLiveH2hPl allows it;
    // otherwise both stay 0 and buildSide's pl falls back to the official
    // cumulative figure untouched.
    const liveA = liveEventTotalByEntry.get(manager.entryId) ?? 0;
    const liveB = liveEventTotalByEntry.get(rival.entryId) ?? 0;
    const livePlDeltaA = !canProjectLiveH2hPl
      ? 0
      : liveA > liveB
        ? H2H_STAKE
        : liveA < liveB
          ? -H2H_STAKE
          : 0;

    matchups.push({
      teamA: buildSide(manager.entryId, computeStreak(history, "a"), livePlDeltaA),
      teamB: buildSide(rival.entryId, computeStreak(history, "b"), -livePlDeltaA),
      history: displayHistory,
    });
  }

  return matchups;
}
